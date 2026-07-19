import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { GoogleButton } from "@/components/google-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to NTAPattern with your Google account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-8">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in or create an account to start taking exams.
          </p>

          <div className="mt-8">
            <GoogleButton redirectTo={callbackUrl} />
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing you agree to our terms of use and privacy policy.
            Students will need teacher approval to join a classroom.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="font-medium text-brand-700 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
