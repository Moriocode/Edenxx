"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Invisible page-view beacon.
 *
 * Renders nothing at all — no element, no text, no spacing. It fires one
 * fire-and-forget POST per client-side navigation and swallows every failure,
 * so a blocked request, a slow function or a cold store can never affect the
 * page or throw into React.
 *
 * Routes included by default: everything. To keep admin/legal pages out of the
 * numbers, add them to EXCLUDED.
 */
const EXCLUDED: string[] = ["/api"];

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (EXCLUDED.some((prefix) => pathname.startsWith(prefix))) return;

    // Honour the browser-level tracking preference before sending anything.
    try {
      if (navigator.doNotTrack === "1") return;
    } catch {
      /* navigator access is safe to ignore */
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    void fetch("/api/visit", {
      method: "POST",
      // Same-origin, so CORS is not strictly needed; kept for parity with the
      // spec and harmless on same-origin requests.
      mode: "cors",
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || "" }),
      signal: controller.signal,
    })
      .catch(() => {
        /* analytics is best-effort only — never retried, never surfaced */
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
