"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "error";

/**
 * <img> wrapper with a skeleton placeholder and a styled fallback.
 *
 * These covers and pages come from third-party CDNs that answer 403 to a foreign
 * Referer, drop images when a gallery is pulled upstream, or simply time out. The
 * wrapper therefore reserves the box while bytes are in flight (a pulsing
 * skeleton, never a layout shift) and swaps to a branded placeholder if the
 * request fails — the grid stays aligned either way.
 *
 * Structure: a wrapper <span> (position: relative) holding the placeholder and
 * the image as siblings, so the skeleton can cover the image box without
 * changing the image's own layout classes. `pendingClassName` reserves space only
 * while loading — pass an aspect/height there when the box would otherwise be
 * 0px tall before the image arrives.
 *
 * The <img> is always emitted during SSR. Cached images can finish before React
 * hydrates (so onLoad never fires) — the mount effect checks the element's own
 * state instead.
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
      className={[
        "relative block",
        wrapperClassName,
        status === "loading" ? `skeleton ${pendingClassName}` : "",
      ].join(" ")}
    >
      {status === "error" ? (
        <span
          aria-hidden
          className={`grid min-h-[8rem] place-content-center gap-2 border border-line bg-panel2 p-3 text-center ${className}`}
        >
          <Image
            src="/erofox-mark.png"
            alt=""
            width={320}
            height={315}
            className="mx-auto h-7 w-auto opacity-25"
          />
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Preview unavailable
          </span>
        </span>
      ) : (
        // Hotlinked upstream art: deliberately a plain <img> (no optimizer, so
        // the referrer policy stays under our control).
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
