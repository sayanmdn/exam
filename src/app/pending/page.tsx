import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Awaiting validation",
  description: "Your Exams Hub account is waiting for teacher approval.",
};

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  // Haven't filled the profile yet — send them back to do that first.
  if (!session.user.profileCompleted) redirect("/onboarding");
  // Already validated — straight into the portal.
  if (session.user.status === "APPROVED") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return null;

  const rejected = user.status === "REJECTED";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-8 text-center">
          <span
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              rejected
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {rejected ? (
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            ) : (
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
          </span>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            {rejected
              ? "Your request wasn't approved"
              : "Waiting for admin confirmation"}
          </h1>

          {rejected ? (
            <p className="mt-3 text-sm text-gray-600">
              Your validation request was declined. Please contact your teacher
              to sort this out.
            </p>
          ) : (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>Your profile has been submitted successfully. ✅</p>
              <p>Your account is now pending validation.</p>
              <p className="font-medium text-gray-800">
                Contact your teacher for approval.
              </p>
            </div>
          )}

          {!rejected && (
            <ol className="mx-auto mt-6 max-w-xs space-y-3 text-left text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                <span className="text-gray-700">Profile completed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  •
                </span>
                <span className="text-gray-700">
                  Waiting for account validation
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                  •
                </span>
                <span className="text-gray-400">
                  Teacher assigns you a classroom &amp; grants exam access
                </span>
              </li>
            </ol>
          )}

          <div className="mt-8 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left text-sm">
            <p className="text-gray-500">Submitted details</p>
            <p className="mt-1 font-medium text-gray-900">
              {user.name ?? "—"}
            </p>
            <p className="text-gray-600">{user.email}</p>
            {user.phone && <p className="text-gray-600">{user.phone}</p>}
          </div>

          <p className="mt-6 text-xs text-gray-400">
            This page updates automatically once a teacher validates your
            account — just refresh after they confirm.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <SignOutButton />
        </p>
      </div>
    </div>
  );
}
