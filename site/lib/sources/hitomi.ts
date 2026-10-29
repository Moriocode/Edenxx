import { Extension, Hitomi, NameInitial, SortType, ThumbnailSize } from "node-hitomi";
import type { Gallery, Tag, TransportFunction } from "node-hitomi";
import type { ComicCard, ComicDetail, Listing } from "@/lib/source";

/**
 * Hitomi.la adapter, backed by the `node-hitomi` client library.
 *
 * Verified live from this environment (probe results):
 *   galleries.list latest page0      25 ids, 183ms; page1 disjoint (byte-range
 *                                   into /n/index-all.nozomi, size*4 bytes/page)
 *   galleries.list({title})         full id set for the query (27k ids for
 *                                   "neko", 622ms) — the library IGNORES `title`
 *                                   when `page` is also given, so we slice it
 *                                   ourselves instead of passing `page`.
 *   galleries.list(tags+[page])     single non-language tag → nozomi range, 51ms
 *   galleries.retrieve(id)          /galleries/{id}.js, ~55ms, gives title, tags,
 *                                   artists, files (hashes), relations, url
 *   tags.search(term)               tagindex trie, top-10 substring matches with
 *                                   counts; underscores stand for spaces
 *                                   ("big_breasts" → female:big breasts=469446)
 *   tags.list(type, letter)         scrapes hitomi.la/all{type}s-{letter}.html
 *   resolveUrl(Webp)                w1|w2.gold-usergeneratedcontent.net/... (webp)
 *   resolveUrl(Webp, Big)           tn.gold-usergeneratedcontent.net/webpbigtn/...
 *
 * Image CDN: 404 with no Referer and 404 with a foreign Referer; 200 only with
 * `Referer: https://hitomi.la`. The browser can never load these directly, so
 * every image URL this adapter returns is rewritten to our own
 * /api/hitomi/image proxy (see app/api/hitomi/image/route.ts), which re-sends
 * the required Referer server-side — same pattern as /api/eh/image.
 *
 * Pagination: hitomi has no total-count endpoint; a full page means "probably
 * more", so maxPage is page+1 while pages keep coming back full.
 */

const HIT_BASE = "https://hitomi.la";
const LIST_SIZE = 24;
const RETRIEVE_POOL = 6;
const TAG_PAGE_TTL = 60 * 60 * 1000; // tag index: once per hour
const SEARCH_TTL = 10 * 60 * 1000; // slug→tag lookups and popular tags
const TITLE_TTL = 5 * 60 * 1000; // title-search id sets

const SLUG_RE = /^hm-(\d+)$/;

export function hitSlug(id: string | number): string {
  return `hm-${String(id).replace(/\D/g, "")}`;
}

/** True when a route slug/url should be resolved against Hitomi. */
export function isHitomiRef(ref: string): boolean {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return false;
  if (SLUG_RE.test(clean)) return true;
  // Canonical Hitomi paths end in -<id>.html, e.g. /cg/title-4289263.html
  return /(?:^|\/)[^/]*-(\d+)\.html$/.test(clean);
}

function hitId(ref: string): string | null {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  const slug = clean.match(SLUG_RE);
  if (slug) return slug[1];
  const deep = clean.match(/(?:^|\/)[^/]*-(\d+)\.html$/);
  if (deep) return deep[1];
  return null;
}

// ---------------------------------------------------------------------------
// Small helpers: TTL memo (shared across requests in this instance) and a
// bounded concurrency pool for the retrieve-per-card pattern listings need.
// ---------------------------------------------------------------------------

type MemoEntry = { expires: number; value?: unknown; promise?: Promise<unknown> };
const memoStore = new Map<string, MemoEntry>();

async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = memoStore.get(key);
  if (hit) {
    if (hit.promise) return hit.promise as Promise<T>;
    if (hit.expires > now) return hit.value as T;
  }
  const entry: MemoEntry = { expires: now + ttlMs, promise: fn() };
  memoStore.set(key, entry);
  try {
    const value = await entry.promise;
    entry.value = value;
    return value as T;
  } catch (err) {
    memoStore.delete(key); // never cache a failure
    throw err;
  } finally {
    entry.promise = undefined;
  }
}

async function poolMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------------------
// Transport with a small response cache
// ---------------------------------------------------------------------------

/**
 * Every library request flows through this transport instead of the library's
 * bare `https` call. It adds three things the plain transport lacks:
 *
 *  - a 10-minute response cache keyed by host+path+range, which collapses the
 *    redundant bursts the tag index otherwise causes (the same
 *    all{type}s-{letter}.html is requested once per tag type — three times
 *    back to back — and listing pages re-request nozomi ranges constantly);
 *  - a hard timeout (the default transport has none);
 *  - one retry for transient failures, so a single blip does not sink a page
 *    into source fallback.
 *
 * fetch() decompresses gzip transparently, which this hook must guarantee,
 * because the library parses the returned bytes as-is.
 */

type TransportOptions = { headers?: Record<string, string | string[] | undefined> };

const TRANSPORT_TTL = 10 * 60 * 1000;
const transportCache = new Map<string, { expires: number; body: Uint8Array }>();

function cacheBody(key: string, body: Uint8Array) {
  if (transportCache.size > 400) {
    // Cheap FIFO eviction: insertion order is Map's iteration order.
    for (const stale of transportCache.keys()) {
      if (transportCache.size <= 300) break;
      transportCache.delete(stale);
    }
  }
  transportCache.set(key, { expires: Date.now() + TRANSPORT_TTL, body });
}

async function fetchBody(url: string, headers: Record<string, string>): Promise<Uint8Array> {
  let lastError: Error = new Error(`Upstream request failed for ${url}`);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 300));
    let res: Response;
    try {
      res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
    if (res.status === 200 || res.status === 206) {
      return new Uint8Array(await res.arrayBuffer());
    }
    lastError = new Error(`Upstream responded ${res.status} for ${url}`);
    if (res.status < 500 && res.status !== 429) break; // 4xx will not improve on retry
  }
  throw lastError;
}

const transport: TransportFunction<TransportOptions> = async (context) => {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(context.options.headers || {})) {
    if (typeof value !== "string") continue;
    if (name.toLowerCase() === "accept-encoding") continue; // fetch encodes/decodes itself
    headers[name.toLowerCase()] = value;
  }

  const key = `${context.host}${context.path}|${headers.range || ""}`;
  const cached = transportCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.body;

  const body = await fetchBody(`https://${context.host}${context.path}`, headers);
  cacheBody(key, body);
  return body;
};

const hitomiClient = new Hitomi({ transport });

// ---------------------------------------------------------------------------
// Image proxying
// ---------------------------------------------------------------------------

/** Rewrite a CDN URL to our own origin (the CDN only answers hitomi referers). */
function proxied(url: string): string {
  if (!url) return "";
  const abs = url.startsWith("//") ? `https:${url}` : url;
  return `/api/hitomi/image?u=${encodeURIComponent(abs)}`;
}

async function coverOf(gallery: Gallery): Promise<string> {
  try {
    const [thumb] = gallery.getThumbnails(); // files[0] carries hasThumbnail
    return proxied(await thumb.resolveUrl(Extension.Webp, ThumbnailSize.Big));
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function canonicalUrl(gallery: Gallery): string {
  return gallery.url ? `${HIT_BASE}${encodeURI(gallery.url)}` : `${HIT_BASE}/galleries/${gallery.id}.html`;
}

async function toCard(gallery: Gallery): Promise<ComicCard> {
  return {
    id: String(gallery.id),
    url: canonicalUrl(gallery),
    slug: hitSlug(gallery.id),
    title: gallery.title?.display || "Untitled",
    cover: await coverOf(gallery),
    pages: gallery.files.length ? String(gallery.files.length) : undefined,
    age: gallery.type || undefined,
    tags: [...new Set(gallery.tags.map((t) => t.name))].slice(0, 8),
    artists: [...new Set(gallery.artists.map((a) => a.name))].slice(0, 4),
  };
}

/** Retrieve a page of gallery ids and hydrate them into cards. */
async function hydrate(ids: number[]): Promise<ComicCard[]> {
  const galleries = await poolMap(ids, RETRIEVE_POOL, async (id) => {
    try {
      return await hitomiClient.galleries.retrieve(id);
    } catch {
      return null; // a single dead gallery must not fail the whole listing
    }
  });
  const cards: ComicCard[] = [];
  for (const gallery of galleries) {
    if (gallery) cards.push(await toCard(gallery));
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Tag slug → hitomi Tag
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const TAGGED_TYPES = new Set(["artist", "group", "type", "series", "character", "male", "female", "tag"]);

/**
 * Resolve one of our tag/artist slugs to a hitomi tag by querying the tag
 * index (top-10 substring matches with counts). Language and bare `type`
 * entries are skipped: paging them does not behave like a normal tag.
 */
async function resolveTag(term: string): Promise<Tag | null> {
  const matches = await memo(`tagsearch:${term}`, SEARCH_TTL, () =>
    hitomiClient.tags.search(term),
  );
  const usable = matches
    .filter(([tag]) => TAGGED_TYPES.has(tag.type) && !tag.isNegative)
    .sort((a, b) => b[1] - a[1]);
  return usable[0]?.[0] ?? null;
}

/** `/tag/<slug>` or `/artist/<slug>` (plus type-prefixed slugs) → Tag, or null. */
async function resolveListTag(basePath: string): Promise<Tag | null> {
  const clean = basePath.replace(/^\/+|\/+$/g, "");
  const kind = clean.startsWith("tag/") ? "tag" : clean.startsWith("artist/") ? "artist" : null;
  if (!kind) throw new Error(`Not a Hitomi listing path: ${basePath}`);

  let slug = clean.slice(kind.length + 1);
  let prefix = "";
  const typed = slug.match(/^(artist|female|male|series|character|group|tag|language|type):(.*)$/);
  if (typed) {
    prefix = `${typed[1]}:`;
    slug = typed[2];
  }
  const term = prefix + slug.replace(/-/g, "_");
  return resolveTag(term);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function hitHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const url = `${HIT_BASE}/`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
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
// Listing
// ---------------------------------------------------------------------------

export async function hitListPage(
  basePath: string,
  page: number,
  query?: { s?: string },
): Promise<Listing> {
  const size = LIST_SIZE;
  const index = Math.max(0, page - 1);

  // Title search: `page` must not be passed alongside `title` (the library
  // would ignore the query entirely), so the full id set is fetched once and
  // sliced per page.
  if (query?.s) {
    const ids = await memo(`title:${query.s.toLowerCase()}`, TITLE_TTL, () =>
      hitomiClient.galleries.list({ title: query.s }),
    );
    const slice = ids.slice(index * size, index * size + size);
    return {
      cards: await hydrate(slice.map((ref) => ref.id)),
      page,
      maxPage: Math.max(1, Math.ceil(ids.length / size)),
    };
  }

  const tag = basePath ? await resolveListTag(basePath) : null;
  if (basePath && !tag) {
    // The tag genuinely has no hitomi equivalent — an honest empty result,
    // not an upstream failure (no router penalty, no fallback loop).
    return { cards: [], page, maxPage: 1 };
  }

  const refs = await hitomiClient.galleries.list({
    tags: tag ? [tag] : undefined,
    orderBy: SortType.DateAdded,
    page: { index, size },
  });

  return {
    cards: await hydrate(refs.map((ref) => ref.id)),
    page,
    maxPage: refs.length >= size ? page + 1 : page,
  };
}

// ---------------------------------------------------------------------------
// Tag index + popular tags
// ---------------------------------------------------------------------------

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
/**
 * Per-letter cap for the /tags index. Hitomi publishes ~14k tags across its
 * all{type}s-{letter}.html pages (alphabetical, no counts); rendering all of
 * them produced a 7MB page, so each bucket keeps its first entries.
 */
const INDEX_BUCKET = 40;
const INITIAL_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "_123",
] as const;

/** Full tag index for /tags: scraped per letter, memoized for an hour. */
export async function hitTagIndex(): Promise<{ slug: string; label: string; count?: number }[]> {
  const initials = INITIAL_KEYS.map((key) => NameInitial[key]);
  const results = await poolMap(initials, 6, async (initial) => {
    try {
      return await memo(`tags:${initial}`, TAG_PAGE_TTL, async () => {
        const out: { slug: string; label: string; count?: number }[][] = [];
        for (const type of ["tag", "female", "male"] as const) {
          const tags = await hitomiClient.tags.list(type, initial);
          out.push(
            tags
              .slice(0, INDEX_BUCKET)
              .map((t) => ({ slug: slugify(t.name), label: t.name })),
          );
        }
        return out;
      });
    } catch {
      return null; // one flaky letter must not sink the whole index
    }
  });

  const loaded = results.filter((group) => group !== null);
  if (loaded.length < Math.ceil(initials.length * 0.8)) {
    // Most buckets failed — hand the page to the next source in the chain
    // (a complete index from elsewhere beats a mostly-empty one).
    throw new Error(`Hitomi tag index loaded ${loaded.length}/${initials.length} buckets`);
  }

  const seen = new Map<string, { slug: string; label: string; count?: number }>();
  for (const group of loaded.flat()) {
    for (const entry of group) {
      if (entry.slug && !seen.has(entry.slug)) seen.set(entry.slug, entry);
    }
  }
  if (seen.size === 0) throw new Error("Hitomi tag index returned no tags");
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Sidebar rail: union of the tag index's top matches per letter (the tagindex
 * returns the top 10 by gallery count per query), deduped and ranked by count.
 */
export async function hitPopularTags(limit = 28): Promise<{ slug: string; count: number }[]> {
  const terms = ["", ...LETTERS];
  const results = await poolMap(terms, 8, (term) =>
    memo(`popular:${term}`, SEARCH_TTL, () => hitomiClient.tags.search(term)),
  );

  const best = new Map<string, { slug: string; count: number }>();
  for (const [tag, count] of results.flat()) {
    if (!TAGGED_TYPES.has(tag.type) || tag.isNegative) continue;
    const slug = slugify(tag.name);
    const previous = best.get(slug);
    if (!previous || previous.count < count) best.set(slug, { slug, count });
  }
  if (best.size === 0) throw new Error("Hitomi popular tags returned nothing");

  return [...best.values()]
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Detail + reader
// ---------------------------------------------------------------------------

/** Full-size page URLs for every file, rewritten through the image proxy. */
async function pageImages(gallery: Gallery): Promise<string[]> {
  const urls = await Promise.all(
    gallery.files.map((file) =>
      file.resolveUrl(Extension.Webp).then(proxied).catch(() => ""),
    ),
  );
  return urls.filter((u) => u);
}

export async function hitDetail(ref: string): Promise<ComicDetail> {
  const id = hitId(ref);
  if (!id) throw new Error(`Not a Hitomi gallery reference: ${ref}`);

  const gallery = await hitomiClient.galleries.retrieve(Number(id));
  const [images, related] = await Promise.all([
    pageImages(gallery),
    hydrate(gallery.relations.slice(0, 12).map((relation) => relation.id)),
  ]);

  const tags = [
    ...new Set([
      ...gallery.tags.map((t) => t.name),
      ...gallery.series.map((s) => s.name),
    ]),
  ].slice(0, 24);

  return {
    url: canonicalUrl(gallery),
    slug: hitSlug(gallery.id),
    title: gallery.title?.display || "Untitled",
    cover: await coverOf(gallery),
    images,
    tags,
    artists: [...new Set(gallery.artists.map((a) => a.name))].slice(0, 12),
    related: related.filter((card) => card.slug !== hitSlug(gallery.id)).slice(0, 12),
  };
}
