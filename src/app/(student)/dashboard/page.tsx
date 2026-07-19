import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Badge } from "@/components/ui";

export default async function StudentDashboard() {
  const user = await requireStudent();

  const [enrollments, attempts] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { classroom: true },
    }),
    prisma.attempt.findMany({
      where: { userId: user.id, submittedAt: { not: null } },
      include: { exam: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);

  const approvedClassroomIds = enrollments
    .filter((e) => e.status === "APPROVED")
    .map((e) => e.classroomId);

  const availableExams = approvedClassroomIds.length
    ? await prisma.exam.count({
        where: {
          classrooms: { some: { id: { in: approvedClassroomIds } } },
          isPublished: true,
        },
      })
    : 0;

  const bestPct =
    attempts.length > 0
      ? Math.max(
          ...attempts.map((a) =>
            a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0,
          ),
        )
      : null;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name?.split(" ")[0] ?? "student"} 👋`}
        subtitle="Here's a snapshot of your learning activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Approved classrooms"
          value={approvedClassroomIds.length}
          tone="green"
        />
        <StatCard label="Exams available" value={availableExams} tone="brand" />
        <StatCard
          label="Tests completed"
          value={attempts.length}
          tone="gray"
        />
        <StatCard
          label="Best score"
          value={bestPct === null ? "—" : `${bestPct.toFixed(0)}%`}
          tone="amber"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Classrooms */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              My classrooms
            </h2>
            <Link
              href="/classrooms"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Browse all
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              You haven&apos;t joined any classroom yet.{" "}
              <Link href="/classrooms" className="text-brand-600 underline">
                Find one to join
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {e.classroom.name}
                  </span>
                  <Badge>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent results */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent results
            </h2>
            <Link
              href="/results"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {attempts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No tests taken yet. Your scores will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {attempts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/results/${a.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="truncate text-sm font-medium text-gray-800">
                      {a.exam.title}
                    </span>
                    <span className="text-sm font-semibold text-brand-600">
                      {a.score}/{a.totalMarks}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
