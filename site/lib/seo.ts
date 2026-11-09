import type { Metadata } from "next";

/**
 * Central SEO helpers: one place for the site URL, title/description rules and
 * the metadata builders used across routes.
 *
 * The canonical origin is NEXT_PUBLIC_SITE_URL (set it in the host's
 * environment to your production domain). When it is absent — local dev or a
 * bare Vercel deploy — we fall back to Vercel's own URL so metadataBase,
 * canonicals, Open Graph and the sitemap always resolve to a real origin.
 */

import { SITE_NAME } from "@/lib/constants";

export { SITE_NAME };

export const DEFAULT_DESCRIPTION =
  "Browse and read adult comics, doujin and manhwa online. Tag and artist browsing, fast image reader, fresh chapters daily.";

export function siteUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Absolute URL for an app path ("/tag/neko" → "https://site/tag/neko"). */
export function absUrl(path: string): string {
  return siteUrl() + (path.startsWith("/") ? path : `/${path}`);
}

/** Cap meta descriptions at ~155 chars without cutting mid-word. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40))}…`;
}

/**
 * Metadata for a listing-style page: title feeds the layout's
 * "%s · erofox" template, canonical keeps paginated variants consolidated.
 */
export function listingMeta(options: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, noIndex } = options;
  return {
    title,
    description: truncate(description),
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false } } : {}),
    openGraph: { type: "website", siteName: SITE_NAME, title, description: truncate(description) },
  };
}