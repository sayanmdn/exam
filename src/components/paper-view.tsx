"use client";

import { PdfPaper } from "@/components/pdf-paper";
import { PdfIframes } from "@/components/pdf-iframes";
import { PaperShield } from "@/components/paper-shield";

// Inline question-paper viewer shared by the exam-taking and result pages: the
// same platform split (PDF.js canvas on Android/desktop, one iframe per page on
// iOS) behind the watermark + capture-deterrent shield, and no download option.
export function PaperView({
  examId,
  paperUrl,
  isIOS,
  studentLabel,
}: {
  examId: string;
  paperUrl: string;
  isIOS: boolean;
  studentLabel: string;
}) {
  return (
    <PaperShield label={studentLabel}>
      {isIOS ? (
        <PdfIframes examId={examId} />
      ) : (
        <PdfPaper url={paperUrl} />
      )}
    </PaperShield>
  );
}
