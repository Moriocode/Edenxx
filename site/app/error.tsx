"use client";

import Link from "next/link";

/**
 * Root error boundary. Pages already catch their own source failures and render
 * <Notice />, so this only catches what they cannot: an unexpected render or
 * data-shape error. Presentation only — `reset()` re-runs the failed segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-line bg-panel p-8 text-center"
    >
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-panel2 text-xl">
        ⚠️
      </div>
      <h1 className="text-base font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This page hit an unexpected error while rendering — often a source that stopped responding
        mid-load. It is usually temporary.
      </p>

      {error.message ? (
        <p className="mt-3 overflow-auto rounded-lg border border-line bg-ink px-3 py-2 text-left text-[11px] break-words text-muted/80">
          {error.message}
          {error.digest ? <span className="opacity-70"> · ref {error.digest}</span> : null}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-extrabold text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-white/80 transition hover:border-accent/60 hover:text-accent"
        >
          Back to latest
        </Link>
      </div>
    </div>
  );
}