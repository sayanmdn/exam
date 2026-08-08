import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { requestEnrollment } from "@/app/actions/student";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PendingLink } from "@/components/pending-link";

export default async function ClassroomsPage() {
  const user = await requireStudent();

  const [allClassrooms, enrollments] = await Promise.all([
    prisma.classroom.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { exams: { where: { isPublished: true } } } } },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { classroom: { select: { class: true } } },
    }),
  ]);

  const statusByClassroom = new Map(
    enrollments.map((e) => [e.classroomId, e.status]),
  );

  // The set of classes this student is already tied to (via any enrollment).
  // Once a student belongs to a class (e.g. "11"), they should only see other
  // batches of that same class. Batches with no class set are always visible.
  const myClasses = new Set(
    enrollments
      .map((e) => e.classroom.class)
      .filter((c): c is string => Boolean(c)),
  );

  const classrooms =
    myClasses.size === 0
      ? allClassrooms
      : allClassrooms.filter(
          (c) =>
            // Keep batches matching one of my classes, batches with no class,
            // and any batch I'm already enrolled in.
            !c.class ||
            myClasses.has(c.class) ||
            statusByClassroom.has(c.id),
        );

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle="Request to join a batch. A teacher will approve you before you can take its exams."
      />

      {classrooms.length === 0 ? (
        <EmptyState
          title="No batches yet"
          body="There are no batches available to join right now. Check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((c) => {
            const status = statusByClassroom.get(c.id);
            return (
              <div key={c.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {c.name}
                  </h3>
                  {status && <Badge>{status}</Badge>}
                </div>
                <p className="mt-2 flex-1 text-sm text-gray-500">
                  {c.description || "No description provided."}
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  {c._count.exams} published exam
                  {c._count.exams === 1 ? "" : "s"}
                </p>

                <div className="mt-4">
                  {status === "APPROVED" ? (
                    <PendingLink
                      href={`/classrooms/${c.id}`}
                      className="inline-block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      View exams
                    </PendingLink>
                  ) : status === "PENDING" ? (
                    <span className="text-sm font-medium text-amber-600">
                      Awaiting approval…
                    </span>
                  ) : (
                    <form action={requestEnrollment.bind(null, c.id)}>
                      <SubmitButton
                        pendingText="Requesting…"
                        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        {status === "REJECTED"
                          ? "Request again"
                          : "Request to join"}
                      </SubmitButton>
                    </form>
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
