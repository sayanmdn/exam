import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ExamRunner } from "./exam-runner";

export const metadata = { title: "Test in progress" };

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const user = await requireStudent();
  const { examId, attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  // Guard: must exist, belong to this user, match the exam, and be unfinished.
  if (!attempt || attempt.userId !== user.id || attempt.examId !== examId) {
    redirect("/exams");
  }
  if (attempt.submittedAt) {
    redirect(`/results/${attempt.id}`);
  }

  const durationMs = attempt.exam.durationMinutes * 60 * 1000;
  const deadline = attempt.startedAt.getTime() + durationMs;
  const secondsRemaining = Math.max(
    0,
    Math.floor((deadline - Date.now()) / 1000),
  );

  // Never send correct answers to the client.
  const questions = attempt.exam.questions.map((q) => ({
    id: q.id,
    text: q.text,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
  }));

  const isPdf = attempt.exam.type === "PDF";

  // iOS/WebKit can't rasterize PDF.js canvases but does render PDFs in iframes,
  // so it uses a page-per-iframe viewer; Android/Chromium uses PDF.js. Decide on
  // the server from the User-Agent to avoid a hydration flip.
  const ua = (await headers()).get("user-agent") ?? "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  return (
    <ExamRunner
      attemptId={attempt.id}
      examId={examId}
      examTitle={attempt.exam.title}
      questions={questions}
      secondsRemaining={secondsRemaining}
      examType={isPdf ? "PDF" : "MANUAL"}
      paperUrl={isPdf ? `/exams/${examId}/paper` : undefined}
      isIOS={isIOS}
      studentLabel={`${user.email ?? user.name ?? user.id} · ${attempt.id.slice(-6)}`}
    />
  );
}
