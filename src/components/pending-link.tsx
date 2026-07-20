"use client";

import { type ComponentProps, useEffect } from "react";
import Link, { useLinkStatus } from "next/link";
import { navProgress } from "@/lib/nav-progress";

// A trailing spinner that lights up while this link's navigation is pending
// (rendered as a sibling so it doesn't disturb the link's own flex layout).
// It also drives the global <TopProgress> bar.
function LinkSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending) return;
    navProgress.start();
    return () => navProgress.done();
  }, [pending]);

  if (!pending) return null;
  return (
    <span
      aria-hidden
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent align-[-1px] ${
        className ?? ""
      }`}
    />
  );
}

/**
 * Drop-in replacement for next/link that shows a small inline spinner (and the
 * top progress bar) while the navigation it triggers is pending. Useful when
 * the destination is dynamic and the transition isn't instant.
 */
export function PendingLink({
  children,
  spinnerClassName,
  ...props
}: ComponentProps<typeof Link> & { spinnerClassName?: string }) {
  return (
    <Link {...props}>
      {children}
      <LinkSpinner className={spinnerClassName} />
    </Link>
  );
}
