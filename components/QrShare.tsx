"use client";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function QrShare({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "watch-tonight-qr.png", { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Scan to join tonight's pick" });
        } catch {
          // user dismissed the share sheet
        }
        return;
      }

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "watch-tonight-qr.png";
      link.click();
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the link is still visible on screen to copy manually
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl bg-white p-4">
        <QRCodeCanvas ref={canvasRef} value={url} size={200} />
      </div>
      <p className="max-w-xs text-center text-xs text-muted break-all">{url}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent-gradient)" }}
        >
          Share QR
        </button>
        <button type="button" onClick={handleCopy} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
