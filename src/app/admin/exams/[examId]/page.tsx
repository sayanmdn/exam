import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  addQuestion,
  deleteQuestion,
  deleteExam,
  toggleExamPublished,
  setExamClassrooms,
  setPaperQuestionCount,
  setAnswerKey,
} from "@/app/actions/admin";
import { PageHeader, Badge, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PaperUploader } from "./paper-uploader";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  await requireAdmin();
  const { examId } = await params;

  const [exam, allClassrooms] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        classrooms: true,
        category: true,
        questions: { orderBy: { order: "asc" } },
        paper: {
          select: { fileName: true, size: true, uploadedAt: true },
        },
        _count: { select: { attempts: true } },
      },
    }),
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!exam) notFound();

  const isPdf = exam.type === "PDF";
  const keyedCount = exam.questions.filter((q) =>
    OPTIONS.includes(q.correctOption as (typeof OPTIONS)[number]),
  ).length;
  const totalMarks = exam.questions.reduce(
    (s, q) =>
      OPTIONS.includes(q.correctOption as (typeof OPTIONS)[number])
        ? s + q.marks
        : s,
    0,
  );
  const selectedClassroomIds = new Set(exam.classrooms.map((c) => c.id));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/exams"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to exams
        </Link>
      </div>

      <PageHeader
        title={exam.title}
        subtitle={`${
          exam.classrooms.length
            ? exam.classrooms.map((c) => c.name).join(", ")
            : "No classrooms"
        }${exam.category ? ` • ${exam.category.name}` : ""}`}
        action={
          <div className="flex items-center gap-3">
            <Badge>{isPdf ? "PDF PAPER" : "MANUAL"}</Badge>
            <Badge tone={exam.isPublished ? "PUBLISHED" : "HIDDEN"}>
              {exam.isPublished ? "PUBLISHED" : "HIDDEN"}
            </Badge>
            <form action={toggleExamPublished.bind(null, exam.id)}>
              <SubmitButton
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  exam.isPublished
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {exam.isPublished ? "Hide from students" : "Publish"}
              </SubmitButton>
            </form>
            <form action={deleteExam.bind(null, exam.id)}>
              <SubmitButton
                confirm="Delete this exam and all its questions and attempts?"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </SubmitButton>
            </form>
          </div>
        }
      />

      {exam.description && (
        <p className="mb-6 max-w-2xl text-sm text-gray-600">
          {exam.description}
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Questions" value={exam.questions.length} tone="brand" />
        <StatCard
          label={isPdf ? "Answer key" : "Total marks"}
          value={isPdf ? `${keyedCount}/${exam.questions.length}` : totalMarks}
          tone="gray"
        />
        <StatCard
          label="Duration"
          value={`${exam.durationMinutes}m`}
          tone="amber"
        />
        <StatCard label="Attempts" value={exam._count.attempts} tone="green" />
      </div>

      {!exam.isPublished && isPdf && !exam.paper && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Upload the question paper before you can publish this exam.
        </div>
      )}
      {!exam.isPublished && !isPdf && exam.questions.length === 0 && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add at least one question before you can publish this exam.
        </div>
      )}

      {/* Classroom access */}
      <div className="card mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Classroom access</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the set of classrooms this exam is accessible in. Approved
          students in any selected classroom can take it once it&apos;s
          published.
        </p>

        {allClassrooms.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No classrooms exist yet. Create one first.
          </p>
        ) : (
          <form action={setExamClassrooms.bind(null, exam.id)} className="mt-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {allClassrooms.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="classroomIds"
                    value={c.id}
                    defaultChecked={selectedClassroomIds.has(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <SubmitButton
                pendingText="Saving…"
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Save classroom access
              </SubmitButton>
            </div>
          </form>
        )}
      </div>

      {isPdf ? (
        <PdfSections
          examId={exam.id}
          paper={exam.paper}
          questions={exam.questions}
        />
      ) : (
        <ManualSections exam={exam} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF exam management
// ---------------------------------------------------------------------------

function PdfSections({
  examId,
  paper,
  questions,
}: {
  examId: string;
  paper: { fileName: string | null; size: number; uploadedAt: Date } | null;
  questions: { id: string; correctOption: string }[];
}) {
  return (
    <div className="space-y-8">
      {/* Question paper */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">Question paper</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload the exam as a single PDF (max 25 MB). Students will read it
          while answering.
        </p>

        {paper ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-green-800">
                {paper.fileName ?? "question-paper.pdf"}
              </p>
              <p className="text-xs text-green-700">
                {(paper.size / 1024).toFixed(0)} KB · uploaded{" "}
                {paper.uploadedAt.toLocaleString()}
              </p>
            </div>
            <a
              href={`/exams/${examId}/paper`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
            >
              Preview
            </a>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No paper uploaded yet.
          </p>
        )}

        <PaperUploader examId={examId} hasPaper={Boolean(paper)} />
      </div>

      {/* Number of questions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Number of questions
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Set how many questions the paper has. This drives the student answer
          grid.
        </p>
        <form
          action={setPaperQuestionCount.bind(null, examId)}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="sm:max-w-[10rem]">
            <input
              name="count"
              type="number"
              min={1}
              max={200}
              defaultValue={questions.length}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <SubmitButton
            pendingText="Saving…"
            confirm="Changing the count adds or removes questions (and their saved answers). Continue?"
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Update count
          </SubmitButton>
        </form>
      </div>

      {/* Answer key */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Answer key{" "}
          <span className="text-sm font-normal text-gray-400">(optional)</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Set the correct option for each question to enable auto-grading. Leave
          a question as &ldquo;—&rdquo; to keep it ungraded.
        </p>

        {questions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Set the number of questions first.
          </p>
        ) : (
          <form action={setAnswerKey.bind(null, examId)} className="mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {questions.map((q, i) => (
                <label
                  key={q.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5"
                >
                  <span className="w-8 shrink-0 text-xs font-semibold text-gray-500">
                    Q{i + 1}
                  </span>
                  <select
                    name={`key-${q.id}`}
                    defaultValue={
                      OPTIONS.includes(
                        q.correctOption as (typeof OPTIONS)[number],
                      )
                        ? q.correctOption
                        : ""
                    }
                    className="w-full rounded-md border border-gray-300 px-1 py-1 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">—</option>
                    {OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-5">
              <SubmitButton
                pendingText="Saving…"
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Save answer key
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual exam management (unchanged behaviour)
// ---------------------------------------------------------------------------

type ManualExam = {
  id: string;
  questions: {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
    negativeMarks: number;
  }[];
};

function ManualSections({ exam }: { exam: ManualExam }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      {/* Existing questions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Questions ({exam.questions.length})
        </h2>
        {exam.questions.length === 0 ? (
          <div className="card p-6 text-sm text-gray-500">
            No questions yet. Use the form to add one.
          </div>
        ) : (
          <div className="space-y-4">
            {exam.questions.map((q, i) => (
              <div key={q.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-gray-900">
                    <span className="text-gray-400">Q{i + 1}.</span> {q.text}
                  </p>
                  <form action={deleteQuestion.bind(null, q.id, exam.id)}>
                    <SubmitButton
                      confirm="Delete this question?"
                      className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {OPTIONS.map((opt) => {
                    const value = q[`option${opt}` as keyof typeof q] as string;
                    const correct = q.correctOption === opt;
                    return (
                      <li
                        key={opt}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${
                          correct
                            ? "border-green-400 bg-green-50 font-medium text-green-800"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        <span className="font-bold">{opt}.</span> {value}
                        {correct && <span className="ml-1 text-xs">✓</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-gray-400">
                  +{q.marks} for correct · −{q.negativeMarks} for wrong
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add question form */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Add a question
        </h2>
        <div className="card sticky top-6 p-6">
          <form action={addQuestion} className="space-y-4">
            <input type="hidden" name="examId" value={exam.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question
              </label>
              <textarea
                name="text"
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {OPTIONS.map((opt) => (
              <div key={opt}>
                <label className="block text-sm font-medium text-gray-700">
                  Option {opt}
                </label>
                <input
                  name={`option${opt}`}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            ))}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Correct
                </label>
                <select
                  name="correctOption"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marks
                </label>
                <input
                  name="marks"
                  type="number"
                  defaultValue={4}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Negative
                </label>
                <input
                  name="negativeMarks"
                  type="number"
                  defaultValue={1}
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <SubmitButton
              pendingText="Adding…"
              className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Add question
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
