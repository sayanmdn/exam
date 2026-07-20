"use client";

import { useEffect, useState } from "react";

// iOS/WebKit renders PDF page content inside an <iframe>, but only ever the
// first page of a multi-page document. So on iOS we render one iframe per page,
// each pointing at a server-split single-page PDF, and stack them to get a
// scrollable multi-page view.
type Info = { pages: number; sizes: { w: number; h: number }[] };

export function PdfIframes({ examId }: { examId: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/exams/${examId}/paper/info`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: Info) => {
        if (!cancelled) setInfo(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-300 p-6 text-center text-sm text-gray-700">
        Couldn&apos;t load the question paper. Please refresh.
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-2 bg-gray-300 text-sm text-gray-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        Loading question paper…
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-300">
      <div className="mx-auto max-w-3xl space-y-3 p-2 sm:p-4">
        {Array.from({ length: info.pages }, (_, i) => {
          const s = info.sizes[i] ?? { w: 1, h: 1.414 };
          return (
            <div
              key={i}
              className="mx-auto w-full bg-white shadow-sm"
              style={{ aspectRatio: `${s.w} / ${s.h}` }}
            >
              <iframe
                src={`/exams/${examId}/paper/page/${i + 1}`}
                title={`Question paper page ${i + 1}`}
                className="h-full w-full border-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
