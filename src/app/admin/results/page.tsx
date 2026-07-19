import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";

export default async function AdminResultsPage() {
  await requireAdmin();

  const attempts = await prisma.attempt.findMany({
    where: { submittedAt: { not: null } },
    include: {
      user: true,
      exam: { include: { classrooms: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const avgPct =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0),
            0,
          ) / attempts.length,
        )
      : 0;

  return (
    <div>
      <PageHeader
        title="Performance"
        subtitle="Every test submission across the portal."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total submissions" value={attempts.length} tone="brand" />
        <StatCard
          label="Unique students"
          value={new Set(attempts.map((a) => a.userId)).size}
          tone="gray"
        />
        <StatCard label="Average score" value={`${avgPct}%`} tone="amber" />
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          body="When students complete exams, their results will be listed here."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Correct</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((a) => {
                  const percentage =
                    a.totalMarks > 0
                      ? Math.round((a.score / a.totalMarks) * 100)
                      : 0;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {a.user.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">{a.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{a.exam.title}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {a.exam.classrooms.map((c) => c.name).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {a.submittedAt?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {a.correctCount}/{a.totalQuestions}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {a.score}/{a.totalMarks}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            percentage >= 60
                              ? "text-green-600"
                              : percentage >= 35
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {percentage}%
                        </span>
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
