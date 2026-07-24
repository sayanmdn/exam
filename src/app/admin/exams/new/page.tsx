import { PendingLink } from "@/components/pending-link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createExam } from "@/app/actions/admin";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState } from "@/components/ui";
import { ExamTypeFields } from "./exam-type-fields";

export default async function NewExamPage() {
  await requireAdmin();

  const classrooms = await prisma.classroom.findMany({
    orderBy: { name: "asc" },
    include: { categories: true },
  });

  if (classrooms.length === 0) {
    return (
      <div>
        <PageHeader title="Create exam" />
        <EmptyState
          title="Create a classroom first"
          body="Exams belong to a classroom. Add one before building exams."
          cta={{ href: "/admin/classrooms", label: "Go to classrooms" }}
        />
      </div>
    );
  }

  // Flatten categories with their classroom id for the client select mapping.
  const categoriesByClassroom = Object.fromEntries(
    classrooms.map((c) => [
      c.id,
      c.categories.map((cat) => ({ id: cat.id, name: cat.name })),
    ]),
  );

  return (
    <div>
      <div className="mb-6">
        <PendingLink
          href="/admin/exams"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to exams
        </PendingLink>
      </div>
      <PageHeader
        title="Create exam"
        subtitle="Set the basics now; add questions on the next screen."
      />

      <div className="card max-w-2xl p-6">
        <form action={createExam} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Exam title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Full Mock Test 01"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional instructions or syllabus coverage"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Classrooms
            </label>
            <p className="mt-1 text-xs text-gray-400">
              Select every classroom this exam should be accessible in.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {classrooms.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="classroomIds"
                    value={c.id}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:max-w-xs">
            <label className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              name="durationMinutes"
              type="number"
              min={1}
              defaultValue={60}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Marking scheme
            </label>
            <p className="mt-1 text-xs text-gray-400">
              Applied to every question in this exam.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:max-w-sm">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Marks for correct
                </label>
                <input
                  name="marks"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={4}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Negative marks for wrong
                </label>
                <input
                  name="negativeMarks"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={1}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <ExamTypeFields />

          {/* Category is optional; kept simple — first classroom's categories. */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category (optional)
            </label>
            <select
              name="categoryId"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">— None —</option>
              {classrooms.flatMap((c) =>
                categoriesByClassroom[c.id].map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {c.name} · {cat.name}
                  </option>
                )),
              )}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Make sure the category belongs to the selected classroom.
            </p>
          </div>

          <div className="flex gap-3">
            <SubmitButton
              pendingText="Creating…"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Create &amp; add questions
            </SubmitButton>
            <PendingLink
              href="/admin/exams"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </PendingLink>
          </div>
        </form>
      </div>
    </div>
  );
}
