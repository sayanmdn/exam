"use client";

import { useRef, useState } from "react";
import { startAttempt } from "@/app/actions/student";
import { setPreloadedPaper } from "@/lib/paper-cache";

// For PDF exams we download the question paper BEFORE creating the attempt, so
// the server-side timer (which starts at attempt creation) doesn't run while the
// paper is still loading. Once the bytes are in hand we stash them as a blob for
// the attempt screen and submit the form, which starts the attempt and navigates.
export function StartPdfExam({
  examId,
  paperUrl,
  durationMinutes,
  title,
  retake,
}: {
  examId: string;
  paperUrl: string;
  durationMinutes: number;
  title: string;
  retake: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [pct, setPct] = useState<number | null>(null);

  async function handleStart() {
    if (loading) return;
    const ok = window.confirm(
      `Start "${title}"? The ${durationMinutes}-minute timer begins once the question paper has loaded.`,
    );
    if (!ok) return;

    setLoading(true);
    setPct(null);
    try {
      const res = await fetch(paperUrl);
      if (!res.ok || !res.body) throw new Error("download failed");

      const total = Number(res.headers.get("Content-Length")) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) setPct(Math.min(100, Math.round((received / total) * 100)));
      }

      const blob = new Blob(chunks as BlobPart[], {
        type: res.headers.get("Content-Type") || "application/pdf",
      });
      setPreloadedPaper(examId, URL.createObjectURL(blob));

      // Hand off to the server action, which sets startedAt=now and redirects.
      formRef.current?.requestSubmit();
    } catch {
      setLoading(false);
      setPct(null);
      alert(
        "Couldn't load the question paper. Check your connection and try again.",
      );
    }
  }

  return (
    <form ref={formRef} action={startAttempt.bind(null, examId)}>
      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
        )}
        {loading
          ? pct === null
            ? "Loading paper…"
            : `Loading paper… ${pct}%`
          : retake
            ? "Retake test"
            : "Start test"}
      </button>
    </form>
  );
}
