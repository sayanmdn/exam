import Link from "next/link";

const features = [
  {
    title: "Timed mock tests",
    body: "A live countdown timer with auto-submit when time runs out — just like the real NEET & JEE exam hall.",
    icon: (
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: "Negative marking",
    body: "Configurable +4 / −1 style marking so your practice scores reflect the actual exam pattern.",
    icon: <path d="M9 7h6m-6 5h6m-6 5h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />,
  },
  {
    title: "Instant results",
    body: "The moment you submit, the test is graded and you see your score, accuracy and a full answer review.",
    icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    title: "Question palette",
    body: "Jump between questions, mark for review, and track answered / unanswered at a glance during the test.",
    icon: <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />,
  },
  {
    title: "Classrooms & approval",
    body: "Teachers create subject classrooms and approve students before they can access exams and materials.",
    icon: <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />,
  },
  {
    title: "Performance tracking",
    body: "Students review their full attempt history; teachers see every score and which questions were missed.",
    icon: <path d="M3 3v18h18M7 14l3-3 3 3 5-5" />,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-700 to-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-100 ring-1 ring-white/20">
              Mock tests &bull; Competitive exams &bull; Academic prep
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Practise Like the Real Exam. <br />
              Perform with Confidence.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-brand-100">
              Exams Hub is a dedicated educational institute that provides
              carefully designed mock tests and practice examinations based on
              the latest patterns of major competitive and academic exams. Join
              your classroom, take timed tests with negative marking, and see
              your results instantly.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
              >
                Get started free
              </Link>
              <Link
                href="/#features"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore features
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Physics — Full Mock 01
                </p>
                <span className="rounded-md bg-red-50 px-2 py-1 font-mono text-sm font-bold text-red-600">
                  59:42
                </span>
              </div>
              <p className="mt-4 font-medium">
                Q3. A body moving with uniform acceleration has a velocity of 10
                m/s. What is its displacement after 4 s if a = 2 m/s²?
              </p>
              <div className="mt-4 space-y-2">
                {["56 m", "48 m", "64 m", "40 m"].map((opt, i) => (
                  <div
                    key={opt}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      i === 0
                        ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-8 gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-6 rounded text-center text-xs leading-6 ${
                      i < 2
                        ? "bg-green-500 text-white"
                        : i === 2
                          ? "bg-brand-600 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Everything you need to run &amp; ace exams
          </h2>
          <p className="mt-4 text-gray-600">
            Built for teachers who create tests and students who take them.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-audience split */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-8">
            <h3 className="text-xl font-bold text-brand-900">For students</h3>
            <ul className="mt-4 space-y-3 text-sm text-brand-900/80">
              {[
                "Sign up with Google and request to join your classroom",
                "Take timed exams that auto-submit when the clock hits zero",
                "See your score, accuracy and answer review instantly",
                "Look back at your full attempt history any time",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 text-brand-600">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-gray-50 p-8">
            <h3 className="text-xl font-bold text-gray-900">
              For teachers &amp; staff
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {[
                "A dashboard summarising students, exams and pending approvals",
                "Create classrooms and approve or reject student requests",
                "Build MCQ exams with categories, timers and negative marking",
                "Publish or hide exams and track every student's performance",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 text-brand-600">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to start practising?
          </h2>
          <p className="mt-3 text-brand-100">
            Create your free account in seconds with Google.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Sign in to get started
          </Link>
        </div>
      </section>
    </>
  );
}
