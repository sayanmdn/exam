"use client";

import { useEffect, useRef, useState } from "react";

// Native <iframe>/<embed> of a PDF does not render inline on Android (it shows a
// download placeholder), so we rasterize with PDF.js to <canvas>.
//
// Pages are rendered at device-pixel-ratio × OVERSAMPLE so text stays crisp when
// the user pinch-zooms (a canvas is a fixed bitmap — under-rendering it is what
// makes zoomed text look fuzzy). To keep that extra resolution from exhausting
// memory on long papers, pages are rendered lazily as they scroll into view and
// released again once they scroll far away.
const OVERSAMPLE = 2;
const MAX_CANVAS_WIDTH = 2600; // per-page memory guard (device px)

type Slot = { n: number; rendered: boolean; rendering: boolean };

export function PdfPaper({ url }: { url: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any = null;
    let observer: IntersectionObserver | null = null;
    let resizeObs: ResizeObserver | null = null;
    const slots = new Map<HTMLElement, Slot>();

    async function renderSlot(el: HTMLElement) {
      const info = slots.get(el);
      if (!info || info.rendered || info.rendering || !doc) return;
      info.rendering = true;
      try {
        const page = await doc.getPage(info.n);
        if (cancelled) return;
        const cssWidth = listRef.current?.clientWidth || 800;
        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = Math.min(
          cssWidth * dpr * OVERSAMPLE,
          MAX_CANVAS_WIDTH,
        );
        const viewport = page.getViewport({ scale: targetWidth / base.width });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        el.replaceChildren(canvas);
        info.rendered = true;
      } catch {
        /* leave the slot blank; a single page failing is non-fatal */
      } finally {
        info.rendering = false;
      }
    }

    function releaseSlot(el: HTMLElement) {
      const info = slots.get(el);
      if (!info || !info.rendered) return;
      el.replaceChildren();
      info.rendered = false;
    }

    async function init() {
      const list = listRef.current;
      if (!list) return;
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;

        // Build correctly-sized placeholder slots first so the scrollbar height
        // is right before any page has rendered.
        list.replaceChildren();
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const el = document.createElement("div");
          el.className = "mx-auto mb-3 bg-white shadow-sm";
          el.style.width = "100%";
          el.style.aspectRatio = `${base.width} / ${base.height}`;
          list.appendChild(el);
          slots.set(el, { n, rendered: false, rendering: false });
        }
        if (cancelled) return;
        setStatus("ready");

        observer = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const el = e.target as HTMLElement;
              if (e.isIntersecting) renderSlot(el);
              else releaseSlot(el);
            }
          },
          { root: scrollRef.current, rootMargin: "150% 0px" },
        );
        for (const el of slots.keys()) observer.observe(el);

        // Re-render at the new width after a rotation / resize.
        let lastWidth = list.clientWidth;
        resizeObs = new ResizeObserver(() => {
          const w = list.clientWidth;
          if (Math.abs(w - lastWidth) < 4 || !observer) return;
          lastWidth = w;
          for (const el of slots.keys()) {
            releaseSlot(el);
            observer.unobserve(el);
            observer.observe(el); // re-fires intersection → re-renders if visible
          }
        });
        resizeObs.observe(list);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      observer?.disconnect();
      resizeObs?.disconnect();
      try {
        doc?.destroy();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto bg-gray-300">
      <div ref={listRef} className="mx-auto max-w-3xl p-2 sm:p-4" />

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
