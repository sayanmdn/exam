import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toggleExamPublished } from "@/app/actions/admin";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminExamsPage() {
  await requireAdmin();

  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      classrooms: true,
      category: true,
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Build multiple-choice tests, set timers, and publish them to students."
        action={
          <Link
            href="/admin/exams/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + New exam
          </Link>
        }
      />

      {exams.length === 0 ? (
        <EmptyState
          title="No exams yet"
          body="Create your first exam to start adding questions."
          cta={{ href: "/admin/exams/new", label: "Create exam" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Exam</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Questions</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {exam.title}
                      </Link>
                      {exam.category && (
                        <span className="ml-2 text-xs text-gray-400">
                          {exam.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {exam.classrooms.length === 0
                        ? "—"
                        : exam.classrooms.map((c) => c.name).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {exam.durationMinutes} min
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {exam._count.questions}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {exam._count.attempts}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={exam.isPublished ? "PUBLISHED" : "HIDDEN"}>
                        {exam.isPublished ? "PUBLISHED" : "HIDDEN"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <form
                          action={toggleExamPublished.bind(null, exam.id)}
                        >
                          <SubmitButton className="text-xs font-medium text-brand-600 hover:underline">
                            {exam.isPublished ? "Hide" : "Publish"}
                          </SubmitButton>
                        </form>
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="text-xs font-medium text-gray-600 hover:underline"
                        >
                          Edit
                        </Link>
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
