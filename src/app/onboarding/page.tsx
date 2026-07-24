import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { completeProfile } from "@/app/actions/student";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { SignOutButton } from "@/components/sign-out-button";
import { INDIAN_PHONE_PATTERN, INDIAN_PHONE_TITLE } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Complete your profile",
  description: "Finish setting up your Exam Hub student account.",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  // Already onboarded — either waiting for validation or fully approved.
  if (session.user.profileCompleted) {
    redirect(session.user.status === "APPROVED" ? "/dashboard" : "/pending");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome! Confirm your details below. A teacher will review your
            account before you can access the exams.
          </p>

          <form action={completeProfile} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={user.name ?? ""}
                placeholder="Your full name"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Pre-filled from Google — please correct it if it&apos;s wrong.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Linked to your Google account and can&apos;t be changed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                name="phone"
                type="tel"
                required
                pattern={INDIAN_PHONE_PATTERN}
                title={INDIAN_PHONE_TITLE}
                defaultValue={user.phone ?? ""}
                placeholder="+91 00000 00000"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Your teacher may use this to reach you.
              </p>
            </div>

            <SubmitButton
              pendingText="Submitting…"
              className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Submit for verification
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <SignOutButton />
        </p>
      </div>
    </div>
  );
}
