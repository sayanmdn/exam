import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  createClassroom,
  deleteClassroom,
  createCategory,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminClassroomsPage() {
  await requireAdmin();

  const classrooms = await prisma.classroom.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categories: true,
      _count: {
        select: {
          exams: true,
          enrollments: { where: { status: "APPROVED" } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Classrooms"
        subtitle="Create classrooms for different subjects or batches, and organise exams into categories."
      />

      {/* Create form */}
      <div className="card mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Create a classroom
        </h2>
        <form
          action={createClassroom}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              name="name"
              required
              placeholder="e.g. NEET Physics 2026"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              name="description"
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <SubmitButton
            pendingText="Creating…"
            className="h-[38px] rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create
          </SubmitButton>
        </form>
      </div>

      {/* List */}
      {classrooms.length === 0 ? (
        <p className="text-sm text-gray-500">
          No classrooms yet — create your first one above.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classrooms.map((c) => (
            <div key={c.id} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {c.description || "No description"}
                  </p>
                </div>
                <form action={deleteClassroom.bind(null, c.id)}>
                  <SubmitButton
                    confirm={`Delete "${c.name}"? This removes its exams, enrollments and results.`}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>

              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{c._count.enrollments} approved students</span>
                <span>{c._count.exams} exams</span>
              </div>

              {/* Categories */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Categories
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.categories.length === 0 ? (
                    <span className="text-xs text-gray-400">None yet</span>
                  ) : (
                    c.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                      >
                        {cat.name}
                      </span>
                    ))
                  )}
                </div>
                <form
                  action={createCategory}
                  className="mt-3 flex gap-2"
                >
                  <input type="hidden" name="classroomId" value={c.id} />
                  <input
                    name="name"
                    required
                    placeholder="Add category (e.g. Mechanics)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <SubmitButton className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Add
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
