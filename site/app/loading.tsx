function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-panel2 ${className}`} />;
}

/**
 * Route-level loading state for every dynamic route (all listing, detail and
 * reader routes block on a remote source fetch). Pure presentation: it mirrors
 * ListingView's structure and spacing exactly, so the swap to real content
 * causes no layout shift.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_264px] lg:gap-8"
    >
      <span className="sr-only">Loading comics…</span>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div className="w-full space-y-2 sm:w-auto">
            <Block className="h-6 w-48" />
            <Block className="h-3 w-64 max-w-full" />
          </div>
          <Block className="h-6 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-line bg-panel" aria-hidden>
              <div className="card-cover animate-pulse bg-panel2" />
              <div className="space-y-2 p-2.5">
                <Block className="h-3 w-full" />
                <Block className="h-3 w-2/3" />
                <Block className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="surface p-3">
            <Block className="mb-3 h-3 w-28" />
            <div className="flex flex-wrap gap-1.5" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <Block key={i} className="h-6 w-16 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
