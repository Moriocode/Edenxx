import blocklist from "@/data/blocked-galleries.json";

/**
 * Takedown blocklist.
 *
 * `data/blocked-galleries.json` is the single place to purge a gallery. It is
 * read by middleware on every request, so removing an entry — or adding one —
 * takes effect on the next request with no scraper change and no cache to warm.
 *
 * Entry shape:
 *
 *   {
 *     "id": "hf-4316238",              // required, matched against the slug
 *     "slugs": ["hf-4316238", "..."],  // optional extra aliases (URL slugs)
 *     "status": 451,                   // 451 (default) or 404
 *     "reason": "DMCA notice #2041",   // shown on the 451 page
 *     "requested": "2026-01-31"        // when we received the request
 *   }
 *
 * 451 is the default because it is the honest answer to "removed for legal
 * reasons". Use 404 when the request asks for the title to disappear silently.
 */

export type TakedownStatus = 404 | 451;

export type TakedownEntry = {
  id: string;
  slugs?: string[];
  status?: TakedownStatus;
  reason?: string;
  requested?: string;
};

type BlocklistFile = { entries?: TakedownEntry[] };

function key(value: string): string {
  return value.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

const ENTRIES: TakedownEntry[] = ((blocklist as BlocklistFile).entries ?? []).filter(
  (entry): entry is TakedownEntry => Boolean(entry && entry.id),
);

/** id + aliases → entry, so every URL shape resolves in one lookup. */
const INDEX = new Map<string, TakedownEntry>();
for (const entry of ENTRIES) {
  for (const ref of [entry.id, ...(entry.slugs ?? [])]) {
    INDEX.set(key(ref), entry);
  }
}

export const takedownCount = ENTRIES.length;

export function takedownFor(...refs: Array<string | undefined | null>): TakedownEntry | undefined {
  for (const ref of refs) {
    if (!ref) continue;
    const hit = INDEX.get(key(ref));
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Candidate blocklist keys for a gallery URL (/comic/<slug>, /read/<slug>).
 * Both the full remainder and each segment are tried, so slugs that contain
 * slashes still match an entry that lists either form.
 */
export function galleryRefsFromPath(pathname: string): string[] {
  const match = pathname.match(/^\/(?:comic|read)\/(.+?)\/?$/);
  if (!match) return [];

  let decoded = match[1];
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* malformed escape: fall back to the raw path */
  }

  const segments = decoded.split("/").filter(Boolean);
  const first = segments[0];
  const last = segments[segments.length - 1];
  return [...new Set([decoded, first, last].filter((value): value is string => Boolean(value)))];
}

export function takedownForPath(pathname: string): TakedownEntry | undefined {
  return takedownFor(...galleryRefsFromPath(pathname));
}
