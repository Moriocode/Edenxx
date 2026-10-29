"use client";

import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "error";

/**
 * <img> wrapper that shows a spinner while bytes stream in and a graceful
 * placeholder if the upstream CDN refuses the request (these covers come from
 * third-party hosts that answer 403 to a foreign Referer).
 *
 * Structure: a wrapper <span> (position: relative) holding the spinner and the
 * image as siblings, so the spinner can cover the image box without changing
 * the image's own layout classes. `pendingClassName` reserves space only while
 * loading — pass an aspect/height there when the box would otherwise be 0px
 * tall before the image arrives.
 *
 * The <img> is always emitted during SSR. Cached images can finish before
 * React hydrates (so onLoad never fires) — the mount effect checks the
 * element's own state instead.
 */
export default function LoadableImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  pendingClassName = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  pendingClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.complete) setStatus(el.naturalWidth > 0 ? "ready" : "error");
  }, [src]);

  return (
    <span
      className={`relative block ${wrapperClassName} ${status === "loading" ? pendingClassName : ""}`}
    >
      {status === "loading" ? (
        <span aria-hidden className="absolute inset-0 z-10 grid place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
        </span>
      ) : null}

      {status === "error" ? (
        <span aria-hidden className={`min-h-[8rem] bg-panel2 p-3 text-center ${className}`}>
          <span className="text-2xl opacity-30">🦊</span>
          <span className="mt-1 block text-[10px] font-semibold text-muted">Image unavailable</span>
        </span>
      ) : (
        // Hotlinked upstream art: deliberately a plain <img> (no optimizer,
        // so the referrer policy stays under our control).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={loading}
          referrerPolicy="no-referrer"
          className={className}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
      )}
    </span>
  );
}