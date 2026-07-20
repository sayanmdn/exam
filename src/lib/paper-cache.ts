// In-memory hand-off for a preloaded question paper. The exam-list page downloads
// the PDF into a Blob before the attempt is created, stashes its object URL here,
// and the attempt screen picks it up so the paper renders instantly (no second
// download, no clock running while it loads). Memory-only on purpose: PDFs can be
// up to 25 MB, which blows past localStorage limits, and the blob only needs to
// survive the client-side navigation from the list to the attempt screen.

const store = new Map<string, string>(); // examId -> blob object URL

export function setPreloadedPaper(examId: string, objectUrl: string) {
  const prev = store.get(examId);
  if (prev && prev !== objectUrl) {
    try {
      URL.revokeObjectURL(prev);
    } catch {
      /* noop */
    }
  }
  store.set(examId, objectUrl);
}

export function getPreloadedPaper(examId: string): string | undefined {
  return store.get(examId);
}
