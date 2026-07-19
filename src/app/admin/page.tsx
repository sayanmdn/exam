import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { setEnrollmentStatus } from "@/app/actions/admin";
import { PageHeader, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    studentCount,
    classroomCount,
    activeExams,
    pending,
    recentAttempts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.classroom.count(),
    prisma.exam.count({ where: { isPublished: true } }),
    prisma.enrollment.findMany({
      where: { status: "PENDING" },
      include: { user: true, classroom: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attempt.findMany({
      where: { submittedAt: { not: null } },
      include: { user: true, exam: true },
      orderBy: { submittedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        subtitle="A quick summary of what's happening across the portal."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered students" value={studentCount} tone="brand" />
        <StatCard label="Classrooms" value={classroomCount} tone="gray" />
        <StatCard label="Active exams" value={activeExams} tone="green" />
        <StatCard
          label="Pending approvals"
          value={pending.length}
          tone="amber"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Pending approvals */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Waiting for approval
            </h2>
            <Link
              href="/admin/students"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Manage all
            </Link>
          </div>

          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No pending requests. You&apos;re all caught up. 🎉
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.slice(0, 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {e.user.name ?? e.user.email}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      wants to join {e.classroom.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form
                      action={setEnrollmentStatus.bind(
                        null,
                        e.id,
                        "APPROVED",
                      )}
                    >
                      <SubmitButton className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                        Approve
                      </SubmitButton>
                    </form>
                    <form
                      action={setEnrollmentStatus.bind(
                        null,
                        e.id,
                        "REJECTED",
                      )}
                    >
                      <SubmitButton className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent submissions
            </h2>
            <Link
              href="/admin/results"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No test submissions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentAttempts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {a.user.name ?? a.user.email}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {a.exam.title}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">
                    {a.score}/{a.totalMarks}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
