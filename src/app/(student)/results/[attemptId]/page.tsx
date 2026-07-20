import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireStudent();
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { classrooms: true } },
      answers: true,
    },
  });

  if (!attempt || attempt.userId !== user.id) redirect("/results");
  if (!attempt.submittedAt) redirect(`/exams/${attempt.examId}`);

  const questions = await prisma.question.findMany({
    where: { examId: attempt.examId },
    orderBy: { order: "asc" },
  });
  const answerByQuestion = new Map(
    attempt.answers.map((a) => [a.questionId, a.selectedOption]),
  );

  const isPdf = attempt.exam.type === "PDF";
  const isKeyed = (q: { correctOption: string }) =>
    (OPTIONS as readonly string[]).includes(q.correctOption);

  const percentage =
    attempt.totalMarks > 0
      ? Math.round((attempt.score / attempt.totalMarks) * 100)
      : 0;
  const wrong = questions.filter((q) => {
    const sel = answerByQuestion.get(q.id);
    return isKeyed(q) && sel && sel !== q.correctOption;
  }).length;
  const unanswered = questions.filter(
    (q) => !answerByQuestion.get(q.id),
  ).length;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/results"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to results
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          {attempt.exam.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {attempt.exam.classrooms.map((c) => c.name).join(", ")} • Submitted{" "}
          {attempt.submittedAt?.toLocaleString()}
        </p>
      </div>

      {/* Score summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Score"
          value={`${attempt.score}/${attempt.totalMarks}`}
          tone="brand"
        />
        <StatCard label="Percentage" value={`${percentage}%`} tone="amber" />
        <StatCard
          label="Correct"
          value={attempt.correctCount}
          tone="green"
        />
        <StatCard label="Wrong" value={wrong} tone="red" />
        <StatCard label="Unanswered" value={unanswered} tone="gray" />
      </div>

      {/* Answer review */}
      <div className="mb-4 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Answer review</h2>
        {isPdf && (
          <a
            href={`/exams/${attempt.examId}/paper`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-brand-300 px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            View question paper
          </a>
        )}
      </div>

      {isPdf ? (
        <div className="card divide-y divide-gray-100">
          {questions.map((q, i) => {
            const selected = answerByQuestion.get(q.id);
            const keyed = isKeyed(q);
            const isCorrect = keyed && selected === q.correctOption;
            return (
              <div
                key={q.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 text-sm"
              >
                <span className="w-14 font-semibold text-gray-500">
                  Q{i + 1}
                </span>
                <span className="text-gray-700">
                  Your answer:{" "}
                  <span className="font-semibold">{selected ?? "—"}</span>
                </span>
                {keyed && (
                  <span className="text-gray-700">
                    Correct:{" "}
                    <span className="font-semibold text-green-700">
                      {q.correctOption}
                    </span>
                  </span>
                )}
                <span
                  className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    !keyed
                      ? "bg-gray-100 text-gray-500"
                      : !selected
                        ? "bg-gray-100 text-gray-500"
                        : isCorrect
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                  }`}
                >
                  {!keyed
                    ? "Not graded"
                    : !selected
                      ? "Not answered"
                      : isCorrect
                        ? `+${q.marks}`
                        : `−${q.negativeMarks}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="space-y-4">
        {questions.map((q, i) => {
          const selected = answerByQuestion.get(q.id);
          const isCorrect = selected === q.correctOption;
          return (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-gray-900">
                  <span className="text-gray-400">Q{i + 1}.</span> {q.text}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    !selected
                      ? "bg-gray-100 text-gray-500"
                      : isCorrect
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {!selected
                    ? "Not answered"
                    : isCorrect
                      ? `+${q.marks}`
                      : `−${q.negativeMarks}`}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {OPTIONS.map((opt) => {
                  const value = q[`option${opt}` as keyof typeof q] as string;
                  const isAnswer = q.correctOption === opt;
                  const isPicked = selected === opt;
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        isAnswer
                          ? "border-green-400 bg-green-50 text-green-800"
                          : isPicked
                            ? "border-red-400 bg-red-50 text-red-800"
                            : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <span className="font-bold">{opt}.</span>
                      <span className="flex-1">{value}</span>
                      {isAnswer && (
                        <span className="text-xs font-semibold text-green-600">
                          Correct
                        </span>
                      )}
                      {isPicked && !isAnswer && (
                        <span className="text-xs font-semibold text-red-600">
                          Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
