import { prisma } from "./prisma";

/**
 * Grades a submitted attempt using NEET/JEE-style marking:
 *  - correct answer   -> +question.marks
 *  - wrong answer     -> -question.negativeMarks
 *  - unanswered       ->  0
 * Persists the score and per-answer records, then returns the summary.
 */
export async function gradeAttempt(
  attemptId: string,
  responses: Record<string, string | null>,
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { questions: true } } },
  });

  if (!attempt) throw new Error("Attempt not found");
  if (attempt.submittedAt) {
    // Already graded — return existing summary (idempotent).
    return {
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
    };
  }

  const questions = attempt.exam.questions;
  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;

  const answerData = questions.map((q) => {
    const selected = responses[q.id] ?? null;
    // A question with no answer key (e.g. a PDF paper the teacher hasn't keyed
    // yet) is not graded: it adds nothing to the total and can't be scored.
    const keyed = ["A", "B", "C", "D"].includes(q.correctOption);
    if (keyed) {
      totalMarks += q.marks;
      if (selected) {
        if (selected === q.correctOption) {
          score += q.marks;
          correctCount += 1;
        } else {
          score -= q.negativeMarks;
        }
      }
    }
    return {
      attemptId,
      questionId: q.id,
      selectedOption: selected,
    };
  });

  await prisma.$transaction([
    prisma.answer.deleteMany({ where: { attemptId } }),
    prisma.answer.createMany({ data: answerData }),
    prisma.attempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score,
        totalMarks,
        correctCount,
        totalQuestions: questions.length,
      },
    }),
  ]);

  return { score, totalMarks, correctCount, totalQuestions: questions.length };
}
