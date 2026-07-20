import { PendingLink } from "@/components/pending-link";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";

function pct(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export default async function ResultsPage() {
  const user = await requireStudent();

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, submittedAt: { not: null } },
    include: { exam: { include: { classrooms: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My results"
        subtitle="Your complete test history. Click any attempt to review your answers."
      />

      {attempts.length === 0 ? (
        <EmptyState
          title="No results yet"
          body="Take an exam and your scored attempts will show up here."
          cta={{ href: "/exams", label: "Browse exams" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((a) => {
                  const percentage = pct(a.score, a.totalMarks);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.exam.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {a.exam.classrooms.map((c) => c.name).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {a.submittedAt?.toLocaleDateString()}
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
                      <td className="px-4 py-3 text-right">
                        <PendingLink
                          href={`/results/${a.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          Review
                        </PendingLink>
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
