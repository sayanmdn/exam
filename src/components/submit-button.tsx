"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { navProgress } from "@/lib/nav-progress";

export function SubmitButton({
  children,
  className = "",
  pendingText,
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  // Reflect the in-flight action in the global top progress bar too.
  useEffect(() => {
    if (!pending) return;
    navProgress.start();
    return () => navProgress.done();
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
        }
      }}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending && (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
