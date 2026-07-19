import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { requestEnrollment } from "@/app/actions/student";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function ClassroomsPage() {
  const user = await requireStudent();

  const [classrooms, enrollments] = await Promise.all([
    prisma.classroom.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { exams: { where: { isPublished: true } } } } },
    }),
    prisma.enrollment.findMany({ where: { userId: user.id } }),
  ]);

  const statusByClassroom = new Map(
    enrollments.map((e) => [e.classroomId, e.status]),
  );

  return (
    <div>
      <PageHeader
        title="Classrooms"
        subtitle="Request to join a classroom. A teacher will approve you before you can take its exams."
      />

      {classrooms.length === 0 ? (
        <EmptyState
          title="No classrooms yet"
          body="There are no classrooms available to join right now. Check back later."
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
                    <span className="text-sm font-medium text-green-600">
                      ✓ You&apos;re enrolled
                    </span>
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
