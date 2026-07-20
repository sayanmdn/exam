"use client";

import { useSyncExternalStore } from "react";
import { navProgress } from "@/lib/nav-progress";

// A thin bar pinned to the top of the viewport that animates whenever a
// navigation or server action is in flight — instant feedback that a click
// registered even when the destination takes a moment to render.
export function TopProgress() {
  const active = useSyncExternalStore(
    navProgress.subscribe,
    navProgress.isActive,
    () => false,
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      {active && <span className="navbar-indeterminate bg-brand-600" />}
    </div>
  );
}
