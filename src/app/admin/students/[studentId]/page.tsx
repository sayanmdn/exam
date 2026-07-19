import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { setStudentStatus, setStudentClassrooms } from "@/app/actions/admin";
import { PageHeader, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireAdmin();
  const { studentId } = await params;

  const [student, classrooms] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      include: { enrollments: true },
    }),
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!student || student.role !== "STUDENT") notFound();

  const approvedClassroomIds = new Set(
    student.enrollments
      .filter((e) => e.status === "APPROVED")
      .map((e) => e.classroomId),
  );

  const statusLabel = student.profileCompleted
    ? student.status
    : "PROFILE PENDING";

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to students
        </Link>
      </div>

      <PageHeader
        title={student.name ?? "Unnamed student"}
        subtitle="View the student's details, manage classroom access, and set their account status."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Read-only profile */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <Badge>{statusLabel}</Badge>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Name, email and phone are owned by the student and can&apos;t be
            edited here.
          </p>

          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-gray-500">Full name</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {student.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {student.email}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {student.phone ?? "—"}
              </dd>
            </div>
          </dl>

          {/* Account status controls */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Account status
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Approve to grant access, reject to deny, or mark unverified to
              revoke access until re-approved.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {student.status !== "APPROVED" && (
                <form action={setStudentStatus.bind(null, student.id, "APPROVED")}>
                  <SubmitButton className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                    Approve
                  </SubmitButton>
                </form>
              )}
              {student.status === "APPROVED" && (
                <form action={setStudentStatus.bind(null, student.id, "PENDING")}>
                  <SubmitButton
                    confirm="Mark this student as unverified? They'll lose access until re-approved."
                    className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Mark as unverified
                  </SubmitButton>
                </form>
              )}
              {student.status !== "REJECTED" && (
                <form action={setStudentStatus.bind(null, student.id, "REJECTED")}>
                  <SubmitButton className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    Reject
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Classroom assignment */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">Classrooms</h2>
          <p className="mt-1 text-xs text-gray-500">
            Select the classrooms this student can access exams in.
          </p>

          {classrooms.length === 0 ? (
            <p className="mt-6 text-sm text-amber-600">
              No classrooms yet.{" "}
              <Link
                href="/admin/classrooms"
                className="font-medium underline"
              >
                Create one first.
              </Link>
            </p>
          ) : (
            <form
              action={setStudentClassrooms.bind(null, student.id)}
              className="mt-6"
            >
              <div className="space-y-2">
                {classrooms.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="classroomIds"
                      value={c.id}
                      defaultChecked={approvedClassroomIds.has(c.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <span className="font-medium">{c.name}</span>
                      {c.description && (
                        <span className="block text-xs text-gray-400">
                          {c.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-5">
                <SubmitButton
                  pendingText="Saving…"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save classrooms
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
