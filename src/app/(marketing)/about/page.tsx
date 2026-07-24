import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Learn about Exams Hub, a dedicated educational institute providing carefully designed mock tests and practice examinations based on the latest patterns of major competitive and academic exams.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
        About Exams Hub
      </h1>
      <p className="mt-6 text-lg text-gray-600">
        Exams Hub is a dedicated educational institute that provides carefully
        designed mock tests and practice examinations based on the latest
        patterns and standards of major competitive and academic exams. Our
        tests closely simulate the actual examination environment, helping
        students understand the question format, improve time management,
        identify their strengths and weaknesses, and build confidence.
      </p>

      <div className="prose mt-10 max-w-none text-gray-700">
        <h2 className="text-2xl font-bold text-gray-900">Our mission</h2>
        <p className="mt-3">
          With regular assessments, detailed performance analysis, and
          exam-focused preparation, Exams Hub helps students practise effectively
          and move closer to their academic and career goals. We give students
          an authentic exam experience — a live timer, a question palette,
          negative marking and instant, honest feedback — while giving educators
          the tools to organise students and measure progress.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">
          What makes it different
        </h2>
        <ul className="mt-4 space-y-3">
          <li>
            <strong>Realistic testing.</strong> Timed tests that auto-submit,
            configurable marking schemes, and a familiar question navigator.
          </li>
          <li>
            <strong>Classroom control.</strong> Teachers approve who joins,
            group exams into categories, and publish or hide them on demand.
          </li>
          <li>
            <strong>Clear insight.</strong> Instant scoring for students and
            full performance records for staff.
          </li>
          <li>
            <strong>Secure by design.</strong> Google sign-in, role-based
            access and modern web-security best practices.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">
          Who it&apos;s for
        </h2>
        <p className="mt-3">
          Coaching centres, schools and independent tutors who want a simple,
          reliable way to run mock tests — and the students who rely on those
          tests to sharpen their preparation.
        </p>
      </div>
    </div>
  );
}
