"use client";

import { useEffect, useRef, useState } from "react";

// Renders a PDF to <canvas> pages with PDF.js. Native <iframe>/<embed> of a PDF
// does not render inline on Android (and several mobile browsers) — they show a
// download placeholder instead. Canvas rendering works everywhere.
export function PdfPaper({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: { numPages: number; getPage: (n: number) => Promise<unknown>; destroy: () => void } | null =
      null;

    async function render() {
      const container = containerRef.current;
      if (!container) return;
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const doc = await pdfjs.getDocument({ url }).promise;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfDoc = doc as any;
        if (cancelled) return;

        container.replaceChildren();
        const cssWidth = container.clientWidth || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: (cssWidth / base.width) * dpr,
          });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "mx-auto mb-3 block bg-white shadow-sm";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          container.appendChild(canvas);

          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    render();
    return () => {
      cancelled = true;
      try {
        pdfDoc?.destroy();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-300">
      <div ref={containerRef} className="mx-auto max-w-3xl p-2 sm:p-4" />

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          Loading question paper…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-gray-700">
          <p>Couldn&apos;t display the question paper here.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
          >
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
}
