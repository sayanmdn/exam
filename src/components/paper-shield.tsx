"use client";

import { useEffect, useState, type ReactNode } from "react";

// Screenshots cannot be truly blocked in a browser (the OS/phone camera is
// outside our reach), so this layer is a set of deterrents:
//  - a tiled, semi-transparent watermark carrying the student's identity, so any
//    leaked capture is traceable to the account it came from;
//  - disabled right-click / long-press-save / text selection / drag on the paper;
//  - the paper is covered whenever the tab or window loses focus, making it
//    harder to alt-tab away and capture cleanly (and to screen-record a rival app).
function watermarkDataUrl(label: string) {
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='200'>` +
    `<text x='170' y='100' text-anchor='middle' ` +
    `font-family='sans-serif' font-size='15' fill='rgba(0,0,0,0.13)' ` +
    `transform='rotate(-30 170 100)'>${safe}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function PaperShield({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () =>
      setHidden(document.visibilityState !== "visible");
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {children}

      {/* Tiled watermark, fixed over the viewport so it is captured in any
          screenshot regardless of scroll position. Non-interactive so the paper
          underneath stays scrollable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          backgroundImage: `url("${watermarkDataUrl(label)}")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Cover the paper when the tab/window is not focused. */}
      {hidden && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/95 p-6 text-center text-sm text-white">
          The question paper is hidden while this tab is not active. Return here
          to continue your test.
        </div>
      )}
    </div>
  );
}
