import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

const MODEL = "gemini-3.6-flash";

let cached: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!cached) cached = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return cached;
}

/** Calls Gemini with a JSON-schema-constrained response and validates it, retrying once on a parse/validation failure. */
export async function callGeminiJson<T>(
  system: string,
  userPrompt: string,
  jsonSchema: Record<string, unknown>,
  schema: ZodType<T>
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await gemini().models.generateContent({
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
