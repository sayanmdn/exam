import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { setEnrollmentStatus } from "@/app/actions/admin";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminStudentsPage() {
  await requireAdmin();

  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, classroom: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = enrollments.filter((e) => e.status === "PENDING");
  const others = enrollments.filter((e) => e.status !== "PENDING");

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Approve or reject requests to join classrooms."
      />

      {/* Pending */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
        Pending requests ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="card mb-8 p-6 text-sm text-gray-500">
          No pending requests right now.
        </div>
      ) : (
        <div className="card mb-8 divide-y divide-gray-100">
          {pending.map((e) => (
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
                <form
                  action={setEnrollmentStatus.bind(null, e.id, "APPROVED")}
                >
                  <SubmitButton className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                    Approve
                  </SubmitButton>
                </form>
                <form
                  action={setEnrollmentStatus.bind(null, e.id, "REJECTED")}
                >
                  <SubmitButton className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    Reject
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All enrollments */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        All enrollments
      </h2>
      {others.length === 0 ? (
        <EmptyState
          title="No processed enrollments"
          body="Approved and rejected students will appear here."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {others.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {e.user.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{e.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.classroom.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{e.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {e.status !== "APPROVED" && (
                          <form
                            action={setEnrollmentStatus.bind(
                              null,
                              e.id,
                              "APPROVED",
                            )}
                          >
                            <SubmitButton className="text-xs font-medium text-green-600 hover:underline">
                              Approve
                            </SubmitButton>
                          </form>
                        )}
                        {e.status !== "REJECTED" && (
                          <form
                            action={setEnrollmentStatus.bind(
                              null,
                              e.id,
                              "REJECTED",
                            )}
                          >
                            <SubmitButton className="text-xs font-medium text-red-600 hover:underline">
                              Revoke
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
