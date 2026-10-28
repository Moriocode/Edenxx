"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Reader({
  title,
  images,
  backHref,
  initialPage = 1,
}: {
  title: string;
  images: string[];
  backHref: string;
  initialPage?: number;
}) {
  const total = images.length;
  const [current, setCurrent] = useState(Math.min(Math.max(1, initialPage), Math.max(1, total)));
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  const goTo = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), total);
      const el = refs.current[next - 1];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrent(next);
    },
    [total],
  );

  // Track which page is in the middle of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.page || "1");
            setCurrent(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [total]);

  // Jump to a deep-linked page once, after first paint.
  useEffect(() => {
    if (initialPage > 1) {
      const t = setTimeout(() => goTo(initialPage), 250);
      return () => clearTimeout(t);
    }
  }, [initialPage, goTo]);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (["ArrowDown", "ArrowRight", "j", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        goTo(current + 1);
      } else if (["ArrowUp", "ArrowLeft", "k", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(1);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(total);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo, total]);

  return (
    <div className="pb-20">
      <div className="sticky top-[61px] z-30 -mx-4 mb-4 border-y border-line/80 bg-ink/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href={backHref}
            className="shrink-0 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-accent/60 hover:text-accent"
          >
            ← Info
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white/90">{title}</p>
            <p className="text-[11px] text-muted">
              page {current} of {total}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-bold text-white/80 transition enabled:hover:border-accent/60 enabled:hover:text-accent disabled:opacity-35"
            >
              Prev
            </button>
            <button
              onClick={() => goTo(current + 1)}
              disabled={current >= total}
              className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-extrabold text-black transition enabled:hover:brightness-110 disabled:opacity-35"
            >
              Next
            </button>
          </div>
        </div>
        <div className="mx-auto mt-1.5 h-0.5 max-w-4xl overflow-hidden rounded bg-line">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${total ? (current / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-1">
        {images.map((src, i) => (
          <div
            key={src}
            data-page={i + 1}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="w-full scroll-mt-[120px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} — page ${i + 1}`}
              referrerPolicy="no-referrer"
              loading={i < 2 ? "eager" : "lazy"}
              className="reader-img rounded-sm"
            />
            <div className="py-1 text-center text-[10px] font-semibold tracking-wide text-muted/50">
              {i + 1} / {total}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-4xl rounded-xl border border-line bg-panel p-5 text-center">
        <p className="text-sm font-bold">You reached the end</p>
        <p className="mt-1 text-xs text-muted">Continue browsing or go back to the comic page.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => goTo(1)}
            className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-white/80 hover:border-accent/60 hover:text-accent"
          >
            Back to page 1
          </button>
          <Link
            href={backHref}
            className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-white/80 hover:border-accent/60 hover:text-accent"
          >
            Comic info
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-accent px-3 py-2 text-xs font-extrabold text-black hover:brightness-110"
          >
            Browse more
          </Link>
        </div>
      </div>
    </div>
  );
}
