"use client";

import { useState, useTransition } from "react";
import { startAttempt } from "@/app/actions/student";
import { setPreloadedPaper } from "@/lib/paper-cache";

// For PDF exams we download the question paper BEFORE creating the attempt, so
// the server-side timer (which starts at attempt creation) doesn't run while the
// paper is still loading. Once the bytes are in hand we stash them as a blob for
// the attempt screen and start the attempt.
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
  const [downloading, setDownloading] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const busy = downloading || isPending;

  async function handleStart() {
    if (busy) return;
    const ok = window.confirm(
      `Start "${title}"? The ${durationMinutes}-minute timer begins once the question paper has loaded.`,
    );
    if (!ok) return;

    setDownloading(true);
    setPct(null);
    try {
      const res = await fetch(paperUrl);
      if (!res.ok) throw new Error("download failed");

      let blob: Blob;
      const reader = res.body?.getReader?.();
      if (reader) {
        // Stream so we can show download progress.
        const total = Number(res.headers.get("Content-Length")) || 0;
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setPct(Math.min(100, Math.round((received / total) * 100)));
        }
        blob = new Blob(chunks as BlobPart[], {
          type: res.headers.get("Content-Type") || "application/pdf",
        });
      } else {
        // Older WebKit without fetch response streaming.
        blob = await res.blob();
      }

      setPreloadedPaper(examId, URL.createObjectURL(blob));
    } catch {
      setDownloading(false);
      setPct(null);
      alert(
        "Couldn't load the question paper. Check your connection and try again.",
      );
      return;
    }

    // Create the attempt (this starts the server timer) and navigate. We invoke
    // the server action directly inside a transition rather than via
    // form.requestSubmit() — the latter does not reliably trigger a React Server
    // Action on iOS/WebKit, leaving the button looking unresponsive.
    startTransition(async () => {
      await startAttempt(examId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
    >
      {busy && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
      )}
      {downloading
        ? pct === null
          ? "Loading paper…"
          : `Loading paper… ${pct}%`
        : isPending
          ? "Starting…"
          : retake
            ? "Retake test"
            : "Start test"}
    </button>
  );
}
