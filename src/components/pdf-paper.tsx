"use client";

import { useEffect, useRef, useState } from "react";

// Native <iframe>/<embed> of a PDF does not render inline on Android (it shows a
// download placeholder), so we rasterize with PDF.js.
//
// Each page is rendered to a canvas and then swapped for an <img>: iOS/WebKit is
// unreliable about painting large, dynamically-created canvases inside a
// scrolling container, but it always paints <img> elements. Pages render at
// device-pixel-ratio × OVERSAMPLE so text stays crisp when pinch-zoomed, and are
// rendered lazily (with the far ones released) to bound memory on long papers.
const OVERSAMPLE = 2;
const MAX_CANVAS_WIDTH = 2600; // per-page memory guard (device px)
const MAX_CANVAS_AREA = 16_000_000; // iOS/WebKit blanks canvases past ~16M px

type Slot = { n: number; rendered: boolean; rendering: boolean; imgUrl?: string };

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
        let scale =
          Math.min(cssWidth * dpr * OVERSAMPLE, MAX_CANVAS_WIDTH) / base.width;
        if (base.width * base.height * scale * scale > MAX_CANVAS_AREA) {
          scale = Math.sqrt(MAX_CANVAS_AREA / (base.width * base.height));
        }
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";

        // Attach BEFORE rendering: iOS/WebKit does not reliably allocate a
        // backing store for a detached, zero-layout canvas, so it must be in the
        // DOM (and laid out) before page.render draws into it.
        el.replaceChildren(canvas);

        await page.render({ canvas, viewport }).promise;
        if (cancelled) return;

        // Swap the canvas for an <img>. iOS paints images reliably in a scroll
        // container where it may skip painting a live canvas. If toBlob fails,
        // keep the already-rendered canvas rather than blanking the page.
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (cancelled) return;
        if (blob) {
          const imgUrl = URL.createObjectURL(blob);
          const img = document.createElement("img");
          img.src = imgUrl;
          img.decoding = "async";
          img.style.width = "100%";
          img.style.height = "auto";
          img.style.display = "block";
          el.replaceChildren(img);
          canvas.width = 0;
          canvas.height = 0; // free the backing store now that the img holds it
          info.imgUrl = imgUrl;
        }
        info.rendered = true;
      } catch {
        el.replaceChildren();
      } finally {
        info.rendering = false;
      }
    }

    function releaseSlot(el: HTMLElement) {
      const info = slots.get(el);
      if (!info || !info.rendered) return;
      el.replaceChildren();
      if (info.imgUrl) {
        try {
          URL.revokeObjectURL(info.imgUrl);
        } catch {
          /* noop */
        }
        info.imgUrl = undefined;
      }
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

        // Build correctly-sized placeholder slots so the scrollbar height is
        // right before any page has rendered.
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
          { root: scrollRef.current, rootMargin: "1200px 0px" },
        );
        for (const el of slots.keys()) observer.observe(el);

        // Insurance: render the first pages immediately rather than waiting for
        // the observer's first callback (which can lag on iOS).
        for (const el of Array.from(slots.keys()).slice(0, 2)) renderSlot(el);

        // Re-render at the new width after a rotation / resize.
        let lastWidth = list.clientWidth;
        resizeObs = new ResizeObserver(() => {
          const w = list.clientWidth;
          if (Math.abs(w - lastWidth) < 4 || !observer) return;
          lastWidth = w;
          for (const el of slots.keys()) {
            releaseSlot(el);
            observer.unobserve(el);
            observer.observe(el);
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
      for (const info of slots.values()) {
        if (info.imgUrl) {
          try {
            URL.revokeObjectURL(info.imgUrl);
          } catch {
            /* noop */
          }
        }
      }
      try {
        doc?.destroy();
      } catch {
        /* noop */
      }
    };
  }, [url]);

  return (
    <div ref={scrollRef} className="relative h-full w-full overflow-y-auto bg-gray-300">
      <div ref={listRef} className="mx-auto max-w-3xl p-2 sm:p-4" />

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          Loading question paper…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-gray-700">
          <p>Couldn&apos;t load the question paper. Please refresh.</p>
        </div>
      )}
    </div>
  );
}
