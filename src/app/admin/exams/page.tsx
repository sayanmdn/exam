import { PendingLink } from "@/components/pending-link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toggleExamPublished } from "@/app/actions/admin";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminExamsPage() {
  await requireAdmin();

  const [classrooms, unassigned] = await Promise.all([
    // All classrooms with their exams nested inside.
    prisma.classroom.findMany({
      orderBy: { name: "asc" },
      include: {
        exams: {
          orderBy: { createdAt: "desc" },
          include: {
            classrooms: true,
            category: true,
            _count: { select: { questions: true, attempts: true } },
          },
        },
      },
    }),
    // Exams not assigned to any classroom.
    prisma.exam.findMany({
      where: { classrooms: { none: {} } },
      orderBy: { createdAt: "desc" },
      include: {
        classrooms: true,
        category: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
  ]);

  const hasAnyExams =
    classrooms.some((c) => c.exams.length > 0) || unassigned.length > 0;

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Exams are grouped by batch. Build tests, set timers, and publish them to students."
        action={
          <PendingLink
            href="/admin/exams/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + New exam
          </PendingLink>
        }
      />

      {!hasAnyExams ? (
        <EmptyState
          title="No exams yet"
          body="Create your first exam to start adding questions."
          cta={{ href: "/admin/exams/new", label: "Create exam" }}
        />
      ) : (
        <div className="space-y-8">
          {classrooms.map((classroom) => (
            <section key={classroom.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-800">
                  {classroom.name}
                </h2>
                <span className="text-xs text-gray-400">
                  {classroom.exams.length} exam
                  {classroom.exams.length === 1 ? "" : "s"}
                </span>
              </div>

              {classroom.exams.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400">
                  No exams in this batch yet.
                </p>
              ) : (
                <ExamTable exams={classroom.exams} />
              )}
            </section>
          ))}

          {unassigned.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-800">
                  Unassigned
                </h2>
                <span className="text-xs text-gray-400">
                  {unassigned.length} exam
                  {unassigned.length === 1 ? "" : "s"}
                </span>
              </div>
              <ExamTable exams={unassigned} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type ExamRow = {
  id: string;
  title: string;
  isFreeTest: boolean;
  isPublished: boolean;
  durationMinutes: number;
  category: { name: string } | null;
  classrooms: { name: string }[];
  _count: { questions: number; attempts: number };
};

function ExamTable({ exams }: { exams: ExamRow[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Exam</th>
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
                  <PendingLink
                    href={`/admin/exams/${exam.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {exam.title}
                  </PendingLink>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {exam.category && (
                      <span className="text-xs text-gray-400">
                        {exam.category.name}
                      </span>
                    )}
                    {exam.isFreeTest && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Free test
                      </span>
                    )}
                  </div>
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
                    <form action={toggleExamPublished.bind(null, exam.id)}>
                      <SubmitButton className="text-xs font-medium text-brand-600 hover:underline">
                        {exam.isPublished ? "Hide" : "Publish"}
                      </SubmitButton>
                    </form>
                    <PendingLink
                      href={`/admin/exams/${exam.id}`}
                      className="text-xs font-medium text-gray-600 hover:underline"
                    >
                      Edit
                    </PendingLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
