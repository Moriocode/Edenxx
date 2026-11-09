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
        className={`btn h-9 gap-1.5 px-3 text-[13px] ${open ? "border-edge bg-panel text-fg" : ""}`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 text-muted"
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
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
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
          className="animate-menu-in absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),44rem)] rounded-xl border border-edge bg-panel p-4 shadow-2xl shadow-black/60"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {GENRE_GROUPS.map((group) => (
              <section key={group.title}>
                <h2 className="eyebrow mb-2 flex items-center gap-2">
                  <span aria-hidden className="h-3 w-0.5 rounded-full bg-accent" />
                  {group.title}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {group.genres.map((genre) => (
                    <Link
                      key={genre.slug}
                      href={`/tag/${genre.slug}`}
                      onClick={() => setOpen(false)}
                      className="chip"
                    >
                      {genre.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
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
              className="text-xs text-muted transition-colors hover:text-fg"
            >
              Full tag index
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
