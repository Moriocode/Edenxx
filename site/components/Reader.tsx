"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AdSlot, { AD_EVERY } from "@/components/AdSlot";
import LoadableImage from "@/components/LoadableImage";

type Mode = "strip" | "page";

const MODE_KEY = "erofox-reader-mode";

/** Pages ahead of the reader that are fetched before they are needed. */
const PRELOAD_AHEAD = 3;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

/**
 * Comic reader.
 *
 * Two ergonomics, one component:
 *  - "Strip" (default): continuous vertical scroll for webtoon-style pacing.
 *  - "Paged": one page at a time with tap zones, for spreads and single pages.
 *
 * Both share the same keyboard map, the same persistent progress bar/page
 * counter, and the same three-page lookahead so turning a page never waits on
 * the network. The preference is remembered per browser.
 */
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
  const [mode, setMode] = useState<Mode>("strip");
  const [current, setCurrent] = useState(() =>
    Math.min(Math.max(1, initialPage), Math.max(1, total)),
  );
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), Math.max(1, total));
      setCurrent(next);
      if (mode === "strip") {
        refs.current[next - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        shellRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [mode, total],
  );

  // Restore the reader's preferred mode.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_KEY);
      if (saved === "strip" || saved === "page") setMode(saved);
    } catch {
      /* private mode: stay on the default */
    }
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
  }

  // After a mode switch (or a ?page= deep link) land on the current page.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (mode === "strip") refs.current[current - 1]?.scrollIntoView({ block: "start" });
      else shellRef.current?.scrollIntoView({ block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
    // Deliberately keyed on mode only: this repositions when the layout changes,
    // not on every page turn (goTo already scrolls).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Track which page is in the middle of the viewport (strip mode only).
  useEffect(() => {
    if (mode !== "strip") return;
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
  }, [mode, total]);

  // Fetch the next few pages while the reader is still on this one.
  useEffect(() => {
    for (let offset = 1; offset <= PRELOAD_AHEAD; offset += 1) {
      const src = images[current - 1 + offset];
      if (!src) break;
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [current, images]);

  // Arrow keys turn pages in both modes; up/down additionally scroll in strip.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          goTo(current + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          goTo(current - 1);
          break;
        case "ArrowDown":
          if (mode === "strip") {
            event.preventDefault();
            goTo(current + 1);
          }
          break;
        case "ArrowUp":
          if (mode === "strip") {
            event.preventDefault();
            goTo(current - 1);
          }
          break;
        case "Home":
          event.preventDefault();
          goTo(1);
          break;
        case "End":
          event.preventDefault();
          goTo(total);
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo, mode, total]);

  const progress = total ? (current / total) * 100 : 0;

  return (
    <div ref={shellRef} className="scroll-mt-28 pb-20">
      <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-line bg-ink/95 px-4 py-2 backdrop-blur-xl sm:-mx-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-2">
          <Link href={backHref} aria-label="Back to comic info" className="btn btn-icon shrink-0">
            ←
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-fg">{title}</p>
            <p className="text-[11px] tabular-nums text-muted" aria-live="polite">
              Page {current} of {total}
            </p>
          </div>

          <div
            role="group"
            aria-label="Reading mode"
            className="flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5"
          >
            <button
              type="button"
              aria-pressed={mode === "strip"}
              onClick={() => changeMode("strip")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                mode === "strip" ? "bg-panel2 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              Strip
            </button>
            <button
              type="button"
              aria-pressed={mode === "page"}
              onClick={() => changeMode("page")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                mode === "page" ? "bg-panel2 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              Paged
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              aria-label="Previous page"
              className="btn btn-icon"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current >= total}
              aria-label="Next page"
              className="btn btn-icon"
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        {/* Progress is always visible, in both modes. */}
        <div
          className="mx-auto mt-2 h-1 max-w-4xl overflow-hidden rounded-full bg-panel2"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {mode === "page" ? (
        <div className="mx-auto max-w-4xl">
          <div className="relative flex justify-center overflow-hidden rounded-xl border border-line bg-panel">
            <LoadableImage
              key={images[current - 1]}
              src={images[current - 1]}
              alt={`${title} — page ${current}`}
              loading="eager"
              className="mx-auto block max-h-[calc(100dvh-11rem)] w-full object-contain"
              wrapperClassName="w-full"
              pendingClassName="min-h-[70vh]"
            />

            {/* Tap zones: left third back, right third forward. */}
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              aria-label="Previous page"
              className="reader-zone left-0"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current >= total}
              aria-label="Next page"
              className="reader-zone right-0"
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              className="btn"
            >
              ← Previous
            </button>
            <span className="text-[11px] font-semibold tabular-nums text-muted">
              {current} / {total}
            </span>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current >= total}
              className="btn btn-primary"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-1">
          {images.map((src, i) => (
            <Fragment key={`${i}-${src}`}>
              <div
                data-page={i + 1}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="w-full scroll-mt-32"
              >
                {/* Reserve a dark page-sized block while the page streams in; it
                    collapses to the image's natural height after load. */}
                <LoadableImage
                  src={src}
                  alt={`${title} — page ${i + 1}`}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="reader-img rounded-sm"
                  wrapperClassName="w-full"
                  pendingClassName="min-h-[65vh] rounded-sm"
                />
                <div className="py-1 text-center text-[10px] font-semibold tabular-nums tracking-wide text-muted/55">
                  {i + 1} / {total}
                </div>
              </div>

              {(i + 1) % AD_EVERY.reader === 0 && i + 1 < total ? (
                <AdSlot id={`reader-${i + 1}`} variant="reader" />
              ) : null}
            </Fragment>
          ))}
        </div>
      )}

      {mode === "page" && current < total ? null : (
        <div className="surface mx-auto mt-6 max-w-4xl p-6 text-center">
          <p className="text-sm font-bold">You reached the end</p>
          <p className="mt-1 text-xs text-muted">
            Continue browsing or go back to the comic page.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => goTo(1)} className="btn">
              Back to page 1
            </button>
            <Link href={backHref} className="btn">
              Comic info
            </Link>
            <Link href="/" className="btn btn-primary">
              Browse more
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
