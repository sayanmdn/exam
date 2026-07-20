"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPaperUploadUrl, saveExamPaper } from "@/app/actions/admin";

// Uploads a PDF straight from the browser to R2 via a presigned URL, so the
// file never passes through the serverless function (no ~4.5MB Vercel cap).
export function PaperUploader({
  examId,
  hasPaper,
}: {
  examId: string;
  hasPaper: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    setError(null);
    if (!file) {
      setError("Choose a PDF file first.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("The question paper must be a PDF.");
      return;
    }
    // Generous ceiling to avoid accidental huge uploads.
    if (file.size > 25 * 1024 * 1024) {
      setError("PDF is too large — please keep it under 25 MB.");
      return;
    }

    setBusy(true);
    try {
      const { url, key } = await createPaperUploadUrl(examId, file.type);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(
          `Upload to storage failed (${res.status}). Check the bucket CORS rule.`,
        );
      }
      await saveExamPaper(examId, {
        key,
        fileName: file.name,
        size: file.size,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            setError(null);
            setFile(e.target.files?.[0] ?? null);
          }}
          className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy || !file}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Uploading…" : hasPaper ? "Replace paper" : "Upload paper"}
        </button>
      </div>
      {file && !busy && (
        <p className="mt-2 text-xs text-gray-500">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
