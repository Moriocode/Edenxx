"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AdSlot, { AD_EVERY } from "@/components/AdSlot";
import LoadableImage from "@/components/LoadableImage";

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
      <div className="sticky top-16 z-30 -mx-4 mb-4 border-y border-line bg-ink/90 px-4 py-2 backdrop-blur-xl sm:-mx-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href={backHref}
            className="btn shrink-0 px-2.5 py-1.5"
          >
            ← Info
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
            <p className="text-[11px] text-muted">
              page {current} of {total}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              className="btn px-2.5 py-1.5"
            >
              Prev
            </button>
            <button
              onClick={() => goTo(current + 1)}
              disabled={current >= total}
              className="btn btn-primary px-2.5 py-1.5"
            >
              Next
            </button>
          </div>
        </div>
        <div className="mx-auto mt-2 h-1 max-w-4xl overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${total ? (current / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-1">
        {images.map((src, i) => (
          <Fragment key={`${i}-${src}`}>
            <div
              data-page={i + 1}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="w-full scroll-mt-[120px]"
            >
              {/* Reserve a dark page-sized block with a spinner while the page
                  streams in; it collapses to the image's natural height after. */}
              <LoadableImage
                src={src}
                alt={`${title} — page ${i + 1}`}
                loading={i < 2 ? "eager" : "lazy"}
                className="reader-img rounded-sm"
                wrapperClassName="w-full"
                pendingClassName="min-h-[65vh] rounded-sm bg-panel2"
              />
              <div className="py-1 text-center text-[10px] font-semibold tracking-wide text-muted/50">
                {i + 1} / {total}
              </div>
            </div>

            {/* Ad slot between reader pages; hidden on the final page so the
                “You reached the end” block closes the comic cleanly. */}
            {(i + 1) % AD_EVERY.reader === 0 && i + 1 < total ? (
              <AdSlot id={`reader-${i + 1}`} variant="reader" />
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className="surface mx-auto mt-6 max-w-4xl p-6 text-center">
        <p className="text-sm font-bold">You reached the end</p>
        <p className="mt-1 text-xs text-muted">Continue browsing or go back to the comic page.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => goTo(1)}
            className="btn"
          >
            Back to page 1
          </button>
          <Link
            href={backHref}
            className="btn"
          >
            Comic info
          </Link>
          <Link
            href="/"
            className="btn btn-primary"
          >
            Browse more
          </Link>
        </div>
      </div>
    </div>
  );
}
