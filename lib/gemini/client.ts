import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { ZodType } from "zod";

const MODEL = "gemini-3.6-flash";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_API_ATTEMPTS = 3;

let cached: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!cached) cached = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return cached;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pulls an HTTP-ish status out of whatever shape @google/genai throws (a `status` prop, or a JSON-stringified `{error:{code}}` message). */
function extractStatusCode(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as { status?: unknown; message?: unknown };
  if (typeof anyErr.status === "number") return anyErr.status;
  if (typeof anyErr.message === "string") {
    try {
      const parsed = JSON.parse(anyErr.message) as { error?: { code?: number } };
      if (typeof parsed?.error?.code === "number") return parsed.error.code;
    } catch {
      // message wasn't JSON — fall through
    }
  }
  return null;
}

/** Treats rate limits, server errors, and unrecognized (e.g. network-level) failures as worth retrying. */
function isRetryable(err: unknown): boolean {
  const status = extractStatusCode(err);
  return status === null || RETRYABLE_STATUS.has(status);
}

async function generateWithRetry(params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]): Promise<GenerateContentResponse> {
  for (let attempt = 0; attempt < MAX_API_ATTEMPTS; attempt++) {
    try {
      return await gemini().models.generateContent(params);
    } catch (err) {
      if (!isRetryable(err) || attempt === MAX_API_ATTEMPTS - 1) throw err;
      await sleep(1000 * 2 ** attempt); // 1s, 2s
    }
  }
  throw new Error("unreachable");
}

/**
 * Calls Gemini with a JSON-schema-constrained response and validates it.
 * Retries transient failures (rate limits, 5xx, network errors) with backoff at the API-call
 * level, and separately retries once, immediately, if the model's response fails to parse or
 * validate — the two failure modes need different handling, so they're not the same loop.
 */
export async function callGeminiJson<T>(
  system: string,
  userPrompt: string,
  jsonSchema: Record<string, unknown>,
  schema: ZodType<T>
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await generateWithRetry({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    try {
      const parsed = JSON.parse(response.text ?? "");
      return schema.parse(parsed);
    } catch {
      if (attempt === 1) throw new Error("Gemini did not return a valid JSON response after retry");
    }
  }
  throw new Error("unreachable");
}
