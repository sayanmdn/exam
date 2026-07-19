import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  setEnrollmentStatus,
  approveStudent,
  rejectStudent,
} from "@/app/actions/admin";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminStudentsPage() {
  await requireAdmin();

  const [pendingStudents, classrooms, enrollments, allStudents] =
    await Promise.all([
      // Students who finished onboarding and await teacher validation.
      prisma.user.findMany({
        where: { role: "STUDENT", status: "PENDING", profileCompleted: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.classroom.findMany({ orderBy: { name: "asc" } }),
      prisma.enrollment.findMany({
        include: { user: true, classroom: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        include: { enrollments: { include: { classroom: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const pendingEnrollments = enrollments.filter((e) => e.status === "PENDING");

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Validate new students and manage classroom access."
      />

      {/* Account validation queue */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
        Awaiting validation ({pendingStudents.length})
      </h2>
      {pendingStudents.length === 0 ? (
        <div className="card mb-8 p-6 text-sm text-gray-500">
          No students are waiting for validation right now.
        </div>
      ) : (
        <div className="mb-8 space-y-4">
          {pendingStudents.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {s.name ?? "Unnamed student"}
                  </p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                  {s.phone && (
                    <p className="text-xs text-gray-500">{s.phone}</p>
                  )}
                </div>
                <form action={rejectStudent.bind(null, s.id)}>
                  <SubmitButton className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    Reject
                  </SubmitButton>
                </form>
              </div>

              <form action={approveStudent} className="mt-4">
                <input type="hidden" name="userId" value={s.id} />
                <p className="text-xs font-medium text-gray-700">
                  Assign classroom(s) to grant exam access
                </p>
                {classrooms.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-600">
                    Create a classroom first — you can approve now and assign
                    later.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {classrooms.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          name="classroomIds"
                          value={c.id}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <SubmitButton
                    pendingText="Approving…"
                    className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    Approve &amp; grant access
                  </SubmitButton>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Classroom join requests (from already-validated students) */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
        Classroom join requests ({pendingEnrollments.length})
      </h2>
      {pendingEnrollments.length === 0 ? (
        <div className="card mb-8 p-6 text-sm text-gray-500">
          No pending classroom requests.
        </div>
      ) : (
        <div className="card mb-8 divide-y divide-gray-100">
          {pendingEnrollments.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {e.user.name ?? e.user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {e.user.email} • wants to join{" "}
                  <span className="font-medium">{e.classroom.name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <form action={setEnrollmentStatus.bind(null, e.id, "APPROVED")}>
                  <SubmitButton className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                    Approve
                  </SubmitButton>
                </form>
                <form action={setEnrollmentStatus.bind(null, e.id, "REJECTED")}>
                  <SubmitButton className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    Reject
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All students */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        All students
      </h2>
      {allStudents.length === 0 ? (
        <EmptyState
          title="No students yet"
          body="Students appear here after they sign in with Google."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Classrooms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allStudents.map((s) => {
                  const approvedClassrooms = s.enrollments.filter(
                    (en) => en.status === "APPROVED",
                  );
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {s.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>
                          {s.profileCompleted ? s.status : "PROFILE PENDING"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {approvedClassrooms.length === 0
                          ? "—"
                          : approvedClassrooms
                              .map((en) => en.classroom.name)
                              .join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
