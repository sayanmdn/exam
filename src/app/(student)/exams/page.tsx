import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startAttempt } from "@/app/actions/student";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function ExamsPage() {
  const user = await requireStudent();

  const approved = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "APPROVED" },
    select: { classroomId: true },
  });
  const classroomIds = approved.map((e) => e.classroomId);

  const exams = classroomIds.length
    ? await prisma.exam.findMany({
        where: {
          classrooms: { some: { id: { in: classroomIds } } },
          isPublished: true,
        },
        include: {
          classrooms: true,
          category: true,
          _count: { select: { questions: true } },
          attempts: {
            where: { userId: user.id },
            orderBy: { startedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Available exams"
        subtitle="Timed multiple-choice tests from your classrooms."
      />

      {exams.length === 0 ? (
        <EmptyState
          title="No exams available"
          body="Once you're approved in a classroom and a teacher publishes an exam, it will show up here."
          cta={{ href: "/classrooms", label: "Browse classrooms" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => {
            const inProgress = exam.attempts.find((a) => !a.submittedAt);
            const completed = exam.attempts.find((a) => a.submittedAt);
            const totalMarks = exam._count.questions * 4;

            return (
              <div key={exam.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exam.title}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-500">
                      {exam.classrooms.map((c) => c.name).join(", ")}
                      {exam.category ? ` • ${exam.category.name}` : ""}
                    </p>
                  </div>
                </div>
                {exam.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {exam.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    ⏱ {exam.durationMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    📝 {exam._count.questions} questions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    ⭐ {totalMarks} marks
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  {inProgress ? (
                    <Link
                      href={`/exams/${exam.id}/attempt/${inProgress.id}`}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Resume test
                    </Link>
                  ) : (
                    <form action={startAttempt.bind(null, exam.id)}>
                      <SubmitButton
                        pendingText="Starting…"
                        confirm={`Start "${exam.title}"? The ${exam.durationMinutes}-minute timer begins immediately.`}
                        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        {completed ? "Retake test" : "Start test"}
                      </SubmitButton>
                    </form>
                  )}
                  {completed && (
                    <Link
                      href={`/results/${completed.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Last score: {completed.score}/{completed.totalMarks}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
