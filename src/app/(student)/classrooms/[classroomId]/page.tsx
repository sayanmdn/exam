import { notFound } from "next/navigation";
import { PendingLink } from "@/components/pending-link";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startAttempt } from "@/app/actions/student";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { StartPdfExam } from "@/components/start-pdf-exam";

export default async function ClassroomExamsPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const user = await requireStudent();
  const { classroomId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classroomId: { userId: user.id, classroomId } },
    include: { classroom: true },
  });

  if (!enrollment || enrollment.status !== "APPROVED") notFound();

  const classroom = enrollment.classroom;

  const exams = await prisma.exam.findMany({
    where: {
      classrooms: { some: { id: classroomId } },
      isPublished: true,
    },
    include: {
      category: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: user.id },
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <PendingLink
          href="/classrooms"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to classrooms
        </PendingLink>
      </div>

      <PageHeader
        title={classroom.name}
        subtitle={classroom.description ?? "Timed multiple-choice tests for this classroom."}
      />

      {exams.length === 0 ? (
        <EmptyState
          title="No exams yet"
          body="Your teacher hasn't published any exams in this classroom yet. Check back later."
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
                    {exam.category && (
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-500">
                        {exam.category.name}
                      </p>
                    )}
                  </div>
                  {exam.type === "PDF" && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      PDF paper
                    </span>
                  )}
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
                    <PendingLink
                      href={`/exams/${exam.id}/attempt/${inProgress.id}`}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Resume test
                    </PendingLink>
                  ) : exam.type === "PDF" ? (
                    <StartPdfExam
                      examId={exam.id}
                      paperUrl={`/exams/${exam.id}/paper`}
                      durationMinutes={exam.durationMinutes}
                      title={exam.title}
                      retake={!!completed}
                    />
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
                    <PendingLink
                      href={`/results/${completed.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Last score: {completed.score}/{completed.totalMarks}
                    </PendingLink>
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
