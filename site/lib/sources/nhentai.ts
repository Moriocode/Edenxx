import type { ComicCard, ComicDetail, Listing } from "@/lib/source";

/**
 * nhentai adapter (official REST API v2).
 *
 * Docs: https://nhentai.net/api/v2/docs
 *
 * Verified live from this environment (anonymous reads work, the key only buys
 * a higher rate-limit tier):
 *   GET /api/v2                        200, version banner (health probe)
 *   GET /api/v2/galleries?page=N       200, {result,num_pages,per_page,total}
 *   GET /api/v2/search?query=q         200, same envelope
 *   GET /api/v2/galleries/tagged?tag_id=  200, same envelope
 *   GET /api/v2/galleries/{id}         200, detail with embedded pages[]
 *   GET /api/v2/galleries/{id}/related 200, list envelope
 *   GET /api/v2/tags/{type}/{slug}     200, {id,...} — resolves slug → tag_id
 *   GET /api/v2/tags/tag?page=N        200, 120 tags/page sorted by count desc
 *   CDN hotlinking works with no Referer: t1..t4 (thumbs/covers) and i1..i4
 *   (pages) both return 200 image/* directly.
 *
 * Rules taken from the docs:
 *   - Auth header is `Authorization: Key <API_KEY>` (the literal word "Key").
 *   - Always send a descriptive User-Agent.
 *   - Never construct CDN paths by guessing — extensions vary per page
 *     (1.jpg, 2.webp, ...), so paths come verbatim from the API response.
 *   - Rate limits are per IP: 30/min list, 45/min detail with a key. Every
 *     response is cached briefly in-process so page renders don't burn quota.
 *
 * The API key lives in NHENTAI_API_KEY; the source drops out of the chain
 * when it is unset, so the site keeps working without it.
 */

const NH_API = "https://nhentai.net/api/v2";
const NH_WEB = "https://nhentai.net";
const UA = "erofox/1.0 (https://github.com/Moriocode/Edenxx)";

const THUMB_SERVERS = ["t1", "t2", "t3", "t4"].map((n) => `https://${n}.nhentai.net`);
const IMAGE_SERVERS = ["i1", "i2", "i3", "i4"].map((n) => `https://${n}.nhentai.net`);

const TTL = 10 * 60 * 1000; // JSON responses are stable enough to reuse for 10 min
const TIMEOUT = 10_000;
const PER_PAGE = 24;
const TAG_TYPES = ["tag", "parody", "character", "category", "language"] as const;
const ARTIST_TYPES = ["artist", "group"] as const;

const SLUG_RE = /^nh-(\d+)$/;

export function nhSlug(id: string | number): string {
  return `nh-${String(id).replace(/\D/g, "")}`;
}

/** True when a route slug/url should be resolved against nhentai. */
export function isNhentaiRef(ref: string): boolean {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return false;
  if (SLUG_RE.test(clean)) return true;
  if (/^g\/\d+$/.test(clean)) return true;
  if (/nhentai\.net\/g\/\d+/.test(clean)) return true;
  return false;
}

function nhId(ref: string): string | null {
  // Route params arrive slash-wrapped ("/nh-693384/"), so normalize first.
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  const m =
    clean.match(/^nh-(\d+)/) || clean.match(/^g\/(\d+)/) || clean.match(/\/g\/(\d+)/);
  return m ? m[1] : null;
}

/** The source only participates when its key is configured. */
export function nhentaiEnabled(): boolean {
  return Boolean((process.env.NHENTAI_API_KEY || "").trim());
}

// ---------------------------------------------------------------------------
// Transport: cached, authenticated, one retry on throttles
// ---------------------------------------------------------------------------

type Envelope<T> = { result: T[]; num_pages: number; per_page: number; total: number };

const store = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

async function nhGet<T>(path: string, ttl = TTL): Promise<T> {
  const key = path;
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const attempt = async (): Promise<T> => {
    const headers: Record<string, string> = {
      "User-Agent": UA,
      Accept: "application/json",
    };
    const apiKey = (process.env.NHENTAI_API_KEY || "").trim();
    if (apiKey) headers.Authorization = `Key ${apiKey}`;

    let res: Response;
    try {
      res = await fetch(`${NH_API}${path}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT),
      });
    } catch {
      // One retry for transient network/timeout failures.
      await new Promise((r) => setTimeout(r, 300));
      res = await fetch(`${NH_API}${path}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT),
      });
    }

    if (!res.ok) {
      // 429 carries Retry-After; 404 means "no such tag/gallery" upstream.
      if (res.status === 429 || res.status >= 500) {
        const wait = Math.min(1000, Number(res.headers.get("retry-after") || 0) * 1000 || 500);
        await new Promise((r) => setTimeout(r, wait));
        res = await fetch(`${NH_API}${path}`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(TIMEOUT),
        });
        if (!res.ok) throw new Error(`Upstream responded ${res.status} for ${path}`);
      } else {
        throw new Error(`Upstream responded ${res.status} for ${path}`);
      }
    }

    const value = (await res.json()) as T;
    store.set(key, { at: Date.now(), value });
    return value;
  };

  const promise = attempt().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Shapes (from live responses)
// ---------------------------------------------------------------------------

type NhListItem = {
  id: number;
  media_id: string;
  english_title?: string | null;
  japanese_title?: string | null;
  thumbnail: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  num_pages: number;
};

type NhTag = { id: number; type: string; name: string; slug: string; count?: number };

type NhDetail = {
  id: number;
  media_id: string;
  title: { english?: string | null; japanese?: string | null; pretty?: string | null };
  cover: { path: string };
  thumbnail?: { path: string };
  tags: NhTag[];
  num_pages: number;
  pages: { number: number; path: string }[];
};

// ---------------------------------------------------------------------------
// URL helpers — paths come verbatim from the API, never guessed
// ---------------------------------------------------------------------------

function thumbUrl(path: string | undefined, seed = 0): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${THUMB_SERVERS[Math.abs(seed) % THUMB_SERVERS.length]}/${path.replace(/^\//, "")}`;
}

function imageUrl(path: string, seed = 0): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${IMAGE_SERVERS[Math.abs(seed) % IMAGE_SERVERS.length]}/${path.replace(/^\//, "")}`;
}

function titleOf(item: NhListItem): string {
  return (item.english_title || item.japanese_title || "").replace(/\s+/g, " ").trim() || "Untitled";
}

function cardOf(item: NhListItem): ComicCard {
  return {
    id: String(item.id),
    url: `${NH_WEB}/g/${item.id}/`,
    slug: nhSlug(item.id),
    title: titleOf(item),
    cover: thumbUrl(item.thumbnail, item.id),
    pages: item.num_pages ? String(item.num_pages) : undefined,
    tags: [],
    artists: [],
  };
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function nhHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const url = NH_API;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, url, status: res.status, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      url,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Listing: latest / search / tag / artist
// ---------------------------------------------------------------------------

async function listingFrom(
  path: string,
  page: number,
): Promise<Listing> {
  const env = await nhGet<Envelope<NhListItem>>(path);
  return {
    cards: (env.result || []).map(cardOf),
    page,
    maxPage: Math.max(1, env.num_pages || 1),
  };
}

/**
 * Resolves a site `/tag/<slug>` or `/artist/<slug>` slug to an nhentai tag id.
 * Slugs on this site come from the same API (detail chips), so the type is not
 * known up front — try every type in parallel and keep the first hit.
 */
async function resolveTagId(
  slug: string,
  types: readonly string[],
): Promise<number | null> {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  if (!clean) return null;

  const results = await Promise.allSettled(
    types.map((type) => nhGet<NhTag & { id: number }>(`/tags/${type}/${encodeURIComponent(clean)}`, 60 * 60 * 1000)),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.id) return result.value.id;
  }
  return null;
}

export async function nhListPage(
  basePath: string,
  page: number,
  query?: { s?: string },
): Promise<Listing> {
  const base = (basePath || "").replace(/\/+$/, "");

  // Search
  if (query?.s) {
    return listingFrom(
      `/search?query=${encodeURIComponent(query.s)}&page=${page}&per_page=${PER_PAGE}`,
      page,
    );
  }

  // Tag listing — resolve slug → tag_id first.
  if (base.startsWith("/tag/")) {
    const slug = base.slice("/tag/".length);
    const tagId = await resolveTagId(slug, TAG_TYPES);
    if (!tagId) return { cards: [], page, maxPage: 1 };
    return listingFrom(
      `/galleries/tagged?tag_id=${tagId}&page=${page}&per_page=${PER_PAGE}`,
      page,
    );
  }

  // Artist listing.
  if (base.startsWith("/artist/")) {
    const slug = base.slice("/artist/".length);
    const tagId = await resolveTagId(slug, ARTIST_TYPES);
    if (!tagId) return { cards: [], page, maxPage: 1 };
    return listingFrom(
      `/galleries/tagged?tag_id=${tagId}&page=${page}&per_page=${PER_PAGE}`,
      page,
    );
  }

  // Latest feed.
  return listingFrom(`/galleries?page=${page}&per_page=${PER_PAGE}`, page);
}

// ---------------------------------------------------------------------------
// Tag index + popular tags
// ---------------------------------------------------------------------------

type NhTagItem = { id: number; type: string; name: string; slug: string; count?: number };

/**
 * The /tags/tag endpoint is already sorted by gallery count descending
 * (120 per page), so a handful of pages yields a real popularity-ranked index.
 */
export async function nhTagIndex(pages = 4): Promise<
  { slug: string; label: string; count?: number }[]
> {
  const results = await Promise.allSettled(
    Array.from({ length: pages }, (_, i) =>
      nhGet<Envelope<NhTagItem>>(`/tags/tag?page=${i + 1}`),
    ),
  );

  const seen = new Map<string, { slug: string; label: string; count?: number }>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const tag of result.value.result || []) {
      if (!tag.slug || seen.has(tag.slug)) continue;
      seen.set(tag.slug, {
        slug: tag.slug,
        label: (tag.name || tag.slug).replace(/\s+/g, " ").trim(),
        count: tag.count || undefined,
      });
    }
  }

  if (seen.size === 0) throw new Error("nhentai tag index returned no tags");
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export async function nhPopularTags(limit = 28): Promise<{ slug: string; count: number }[]> {
  const env = await nhGet<Envelope<NhTagItem>>(`/tags/tag`);
  return (env.result || [])
    .slice(0, limit)
    .filter((t) => t.slug)
    .map((t) => ({ slug: t.slug, count: t.count || 0 }));
}

// ---------------------------------------------------------------------------
// Detail + reader
// ---------------------------------------------------------------------------

export async function nhDetail(ref: string): Promise<ComicDetail> {
  const id = nhId(ref);
  if (!id) throw new Error(`Not an nhentai gallery reference: ${ref}`);
  if (!nhentaiEnabled()) throw new Error("nhentai: NHENTAI_API_KEY is not set");

  const detail = await nhGet<NhDetail>(`/galleries/${id}`);
  if (!detail?.id) throw new Error(`nhentai gallery ${id} not found`);

  const seed = detail.id;
  const images = (detail.pages || []).map((p) => imageUrl(p.path, p.number));

  const tags = [
    ...new Set(
      (detail.tags || [])
        .filter((t) => !["artist", "group"].includes(t.type))
        .map((t) => t.name.replace(/\s+/g, " ").trim())
        .filter((t) => t && t.length < 60),
    ),
  ].slice(0, 24);

  const artists = [
    ...new Set(
      (detail.tags || [])
        .filter((t) => t.type === "artist" || t.type === "group")
        .map((t) => t.name.replace(/\s+/g, " ").trim())
        .filter((t) => t && t.length < 60),
    ),
  ].slice(0, 12);

  let related: ComicCard[] = [];
  try {
    const rel = await nhGet<Envelope<NhListItem>>(`/galleries/${id}/related`);
    related = (rel.result || []).map(cardOf).filter((c) => c.slug !== nhSlug(id)).slice(0, 12);
  } catch {
    // Related is decoration; a throttled lookup must not fail the page.
  }

  return {
    url: `${NH_WEB}/g/${id}/`,
    slug: nhSlug(id),
    title:
      (detail.title?.english || detail.title?.pretty || detail.title?.japanese || "")
        .replace(/\s+/g, " ")
        .trim() || "Untitled",
    cover: thumbUrl(detail.cover?.path, seed),
    images,
    tags,
    artists,
    related,
  };
}