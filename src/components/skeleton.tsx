/** Generic content skeleton shown while a portal page's data loads. */
export function PortalLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      {/* Page header */}
      <div className="mb-6">
        <div className="h-7 w-56 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-gray-100" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Two panels */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-screen loading used while the exam runner boots. */
export function FullScreenLoading({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gray-50">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
