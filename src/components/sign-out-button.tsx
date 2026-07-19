"use client";

import { signOutAction } from "@/app/actions/auth";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={`text-sm font-medium text-gray-600 transition hover:text-brand-700 ${className}`}
      >
        Sign out
      </button>
    </form>
  );
}
