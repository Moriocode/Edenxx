"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GENRE_GROUPS } from "@/lib/genres";

export default function GenreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="genre-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/60 hover:text-accent"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Genres
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          id="genre-menu"
          className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),44rem)] rounded-xl border border-line bg-panel p-4 shadow-2xl shadow-black/70"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {GENRE_GROUPS.map((group) => (
              <section key={group.title}>
                <h2 className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
                  <span className="h-3 w-1 rounded bg-accent" />
                  {group.title}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {group.genres.map((genre) => (
                    <Link
                      key={genre.slug}
                      href={`/tag/${genre.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-md border border-line bg-panel2 px-2.5 py-1 text-[12px] font-semibold text-white/75 transition hover:border-accent/60 hover:text-accent"
                    >
                      {genre.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3">
            <Link
              href="/genres"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-accent hover:underline"
            >
              All genres →
            </Link>
            <Link
              href="/tags"
              onClick={() => setOpen(false)}
              className="text-xs text-muted transition hover:text-white"
            >
              Full tag index
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
