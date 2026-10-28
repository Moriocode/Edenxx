function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-line/70 ${className}`} />;
}

/**
 * Route-level loading state for every dynamic route (all listing, detail and
 * reader routes block on a remote source fetch). Pure presentation: it mirrors
 * ListingView's structure so the transition into real content is seamless.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6 lg:grid-cols-[1fr_264px]">
      <span className="sr-only">Loading comics…</span>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-line/70 pb-3">
          <div className="space-y-2">
            <Block className="h-5 w-48" />
            <Block className="h-3 w-64 max-w-full" />
          </div>
          <Block className="h-3 w-24" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-line/70 bg-panel"
              aria-hidden
            >
              <div className="card-cover animate-pulse bg-panel2" />
              <div className="space-y-2 p-2.5">
                <Block className="h-3 w-full" />
                <Block className="h-3 w-2/3" />
                <Block className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
          Fetching the latest comics…
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl border border-line/70 bg-panel p-3">
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