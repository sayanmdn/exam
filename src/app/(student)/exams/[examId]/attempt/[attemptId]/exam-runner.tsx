"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAttempt } from "@/app/actions/student";

type RunnerQuestion = {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  negativeMarks: number;
};

const OPTIONS = ["A", "B", "C", "D"] as const;

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunner({
  attemptId,
  examId,
  examTitle,
  questions,
  secondsRemaining,
  examType = "MANUAL",
  paperUrl,
}: {
  attemptId: string;
  examId: string;
  examTitle: string;
  questions: RunnerQuestion[];
  secondsRemaining: number;
  examType?: "MANUAL" | "PDF";
  paperUrl?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(secondsRemaining);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const doSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      if (!auto) {
        const unanswered = questions.length - Object.keys(responses).length;
        const ok = window.confirm(
          unanswered > 0
            ? `You have ${unanswered} unanswered question(s). Submit the test anyway?`
            : "Submit your test? You cannot change answers after this.",
        );
        if (!ok) return;
      }
      submittedRef.current = true;
      setSubmitting(true);
      const payload: Record<string, string | null> = {};
      for (const q of questions) payload[q.id] = responses[q.id] ?? null;
      try {
        await submitAttempt(attemptId, payload);
        router.replace(`/results/${attemptId}`);
      } catch {
        submittedRef.current = false;
        setSubmitting(false);
        alert("Could not submit the test. Please try again.");
      }
    },
    [attemptId, questions, responses, router],
  );

  // Countdown timer with auto-submit on expiry.
  useEffect(() => {
    if (timeLeft <= 0) {
      doSubmit(true);
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          doSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before accidental navigation/refresh.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const q = questions[current];
  const answeredCount = Object.keys(responses).length;
  const lowTime = timeLeft <= 60;

  const select = (opt: string) =>
    setResponses((r) => ({ ...r, [q.id]: opt }));

  const clearResponse = () =>
    setResponses((r) => {
      const next = { ...r };
      delete next[q.id];
      return next;
    });

  const toggleMark = () =>
    setMarked((m) => {
      const next = new Set(m);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });

  const paletteState = (qi: RunnerQuestion) => {
    const answered = responses[qi.id] !== undefined;
    const isMarked = marked.has(qi.id);
    if (isMarked && answered) return "bg-purple-600 text-white";
    if (isMarked) return "bg-purple-400 text-white";
    if (answered) return "bg-green-500 text-white";
    return "bg-gray-100 text-gray-500 hover:bg-gray-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900">
            {examTitle}
          </h1>
          <p className="text-xs text-gray-500">
            {answeredCount}/{questions.length} answered
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold ${
            lowTime
              ? "animate-pulse bg-red-50 text-red-600"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          {fmt(timeLeft)}
        </div>
      </header>

      {examType === "PDF" ? (
        /* PDF paper on top, OMR-style answer bar at the bottom */
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 bg-gray-300">
            {paperUrl && (
              <iframe
                src={paperUrl}
                title="Question paper"
                className="h-full w-full border-0"
              />
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
            <div className="mx-auto max-w-4xl">
              {/* Question navigation strip */}
              <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
                {questions.map((qi, i) => (
                  <button
                    key={qi.id}
                    onClick={() => setCurrent(i)}
                    className={`h-8 w-8 shrink-0 rounded-md text-xs font-semibold ring-offset-1 transition ${paletteState(
                      qi,
                    )} ${i === current ? "ring-2 ring-brand-600" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-brand-600">
                  Q{current + 1} / {questions.length}
                </span>
                <div className="flex gap-2">
                  {OPTIONS.map((opt) => {
                    const selected = responses[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => select(opt)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition ${
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-gray-300 text-gray-600 hover:border-brand-400 hover:bg-brand-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    onClick={toggleMark}
                    className="rounded-lg border border-purple-300 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50"
                  >
                    {marked.has(q.id) ? "Unmark" : "Mark"}
                  </button>
                  <button
                    onClick={clearResponse}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    disabled={current === 0}
                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {current < questions.length - 1 ? (
                    <button
                      onClick={() =>
                        setCurrent((c) => Math.min(questions.length - 1, c + 1))
                      }
                      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => doSubmit(false)}
                      disabled={submitting}
                      className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Question panel */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-600">
                Question {current + 1} of {questions.length}
              </span>
              <span className="text-xs text-gray-400">
                +{q.marks} / −{q.negativeMarks}
              </span>
            </div>

            <div className="card p-6">
              <p className="text-lg font-medium text-gray-900">{q.text}</p>

              <div className="mt-6 space-y-3">
                {OPTIONS.map((opt) => {
                  const value = q[`option${opt}` as keyof RunnerQuestion];
                  const selected = responses[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => select(opt)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-800"
                          : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {opt}
                      </span>
                      {value as string}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={toggleMark}
                className="rounded-lg border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
              >
                {marked.has(q.id) ? "Unmark review" : "Mark for review"}
              </button>
              <button
                onClick={clearResponse}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Clear response
              </button>
              <div className="ml-auto flex gap-3">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                {current < questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrent((c) => Math.min(questions.length - 1, c + 1))
                    }
                    className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Save &amp; Next
                  </button>
                ) : (
                  <button
                    onClick={() => doSubmit(false)}
                    disabled={submitting}
                    className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Submit test
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Palette */}
        <aside className="border-t border-gray-200 bg-white p-4 lg:w-80 lg:border-l lg:border-t-0">
          <h2 className="text-sm font-semibold text-gray-900">
            Question palette
          </h2>
          <div className="mt-3 grid grid-cols-8 gap-2 lg:grid-cols-6">
            {questions.map((qi, i) => (
              <button
                key={qi.id}
                onClick={() => setCurrent(i)}
                className={`h-9 rounded-md text-sm font-semibold ring-offset-1 transition ${paletteState(
                  qi,
                )} ${i === current ? "ring-2 ring-brand-600" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <ul className="mt-5 space-y-2 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-green-500" /> Answered
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-gray-200" /> Not answered
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-purple-400" /> Marked for
              review
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-purple-600" /> Answered &amp;
              marked
            </li>
          </ul>

          <button
            onClick={() => doSubmit(false)}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit test"}
          </button>
        </aside>
      </div>
      )}
    </div>
  );
}
