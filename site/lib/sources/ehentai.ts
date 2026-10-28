import * as cheerio from "cheerio";
import { cachedHtml } from "@/lib/cache";
import type { ComicCard, ComicDetail, Listing } from "@/lib/source";

/**
 * E-Hentai adapter.
 *
 * Ported from the maple-awa/ehentai_awa service (Go) rather than running that
 * second runtime: the parsing is plain regex/cheerio work and the site already
 * has cheerio + a caching fetch layer.
 *
 * Verified live from this environment:
 *   GET /                      200, 25 cards, cursor pagination via ?next=<gid>
 *   GET /?f_search=neko        200, 25 cards
 *   GET /g/<gid>/<token>/      200, title/category/tags/"Length: 29 pages"
 *   GET /g/<gid>/<token>/?p=1  200, next 20 of the 29 /s/ page links
 *   GET /s/<hash>/<gid>-<n>    200, real image URL in <img id="img" src>
 *   image on hath.network      200 image/webp with Referer = page URL
 *
 * Two constraints shape this adapter:
 *  1. Pagination is cursor based (`?next=`); `?page=N` is ignored. Numbered
 *     pages are resolved by walking the cursor chain, which is cheap because
 *     every intermediate HTML response is cached.
 *  2. Page images are hotlink protected and their URLs expire, so the reader
 *     points at /api/eh/image, which resolves and streams them server-side.
 */

const EH_BASE = "https://e-hentai.org";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TTL = 10 * 60 * 1000;
const TIMEOUT = 20_000;
const PER_PAGE = 20;
const MAX_CURSOR_PAGE = 12;

/**
 * Seed tags for the rail / index. E-Hentai has no cheap "popular tags" listing,
 * so a short curated set keeps the sidebar useful without fake counts.
 */
const TAG_SEEDS = [
  // E-Hentai tag URLs use `+` for spaces (e.g. /tag/female:sole+female/).
  "language:english",
  "language:translated",
  "female:sole+female",
  "male:sole+male",
  "female:big+breasts",
  "female:nakadashi",
  "female:ahegao",
  "female:stockings",
  "female:glasses",
  "female:schoolgirl+uniform",
  "female:maid",
  "female:catgirl",
  "female:monster+girl",
  "female:yuri",
  "female:tomboy",
  "female:swimsuit",
  "female:full+color",
  "female:futanari",
  "female:elf",
  "female:tanlines",
];

export function ehSlug(gid: string | number, token: string): string {
  return `eh-${String(gid).replace(/\D/g, "")}-${token.toLowerCase()}`;
}

export function isEHentaiRef(ref: string): boolean {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return false;
  if (/^eh-\d+-[0-9a-f]{5,}$/i.test(clean)) return true;
  return /e-hentai\.org\/g\/\d+\/[0-9a-f]+/i.test(ref);
}

function ehRef(ref: string): { gid: string; token: string } | null {
  const match =
    (ref || "").match(/eh-(\d+)-([0-9a-f]+)/i) || (ref || "").match(/\/g\/(\d+)\/([0-9a-f]+)/i);
  return match ? { gid: match[1], token: match[2].toLowerCase() } : null;
}

function clean(text: string | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

/** E-Hentai tag slugs use `namespace:tag` with `+` for spaces. */
function tagSlug(raw: string): string {
  return clean(raw).toLowerCase().replace(/\s+/g, "+");
}

function tagLabel(slug: string): string {
  return slug.replace(/^[a-z]+:/, "").replace(/\+/g, " ").replace(/-/g, " ");
}

async function ehHtml(pathOrUrl: string): Promise<string> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${EH_BASE}${pathOrUrl}`;
  return cachedHtml(
    url,
    async () => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `${EH_BASE}/`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) throw new Error(`Upstream responded ${res.status} for ${url}`);
      return res.text();
    },
    TTL,
  );
}

export async function ehHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const url = `${EH_BASE}/`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
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

function parseCards(html: string): ComicCard[] {
  const $ = cheerio.load(html);
  const cards: ComicCard[] = [];

  $("a[href*='e-hentai.org/g/']").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const title = clean($a.find(".glink").text());
    const ids = href.match(/\/g\/(\d+)\/([0-9a-f]+)/i);
    if (!title || !ids) return;

    const $row = $a.closest("tr");
    const thumb = $row.find(".glthumb img").first();
    const overlay = clean($row.find(".glthumb").text());
    const pages = overlay.match(/(\d+)\s*pages/i)?.[1];
    const category = clean($row.find(".cn").first().text());

    cards.push({
      id: `${ids[1]}-${ids[2]}`,
      url: href,
      slug: ehSlug(ids[1], ids[2]),
      title,
      cover: thumb.attr("src") || thumb.attr("data-src") || "",
      pages,
      views: undefined,
      age: category || undefined,
      tags: [
        ...new Set(
          $row
            .find(".gt")
            .map((_, tag) => tagSlug($(tag).attr("title") || $(tag).text()))
            .get()
            .filter(Boolean),
        ),
      ].slice(0, 8),
      artists: [],
    });
  });

  const seen = new Set<string>();
  return cards.filter((c) => (seen.has(c.slug) ? false : (seen.add(c.slug), true)));
}

function listBase(basePath: string, query?: { s?: string }): string {
  if (query?.s) return `${EH_BASE}/?f_search=${encodeURIComponent(query.s)}`;

  const base = (basePath || "").replace(/\/+$/, "");
  if (!base) return `${EH_BASE}/`;
  if (base.startsWith("/tag/")) return `${EH_BASE}${base}/`;
  if (base.startsWith("/artist/")) {
    return `${EH_BASE}/tag/artist:${base.slice("/artist/".length)}/`;
  }
  return `${EH_BASE}${base}/`;
}

function nextCursor(html: string): string {
  return (html.match(/(?:[?&]|&amp;)next=(\d+)/) || [])[1] || "";
}

function withCursor(base: string, cursor: string): string {
  if (!cursor) return base;
  return `${base}${base.includes("?") ? "&" : "?"}next=${cursor}`;
}

export async function ehListPage(
  basePath: string,
  page: number,
  query?: { s?: string },
): Promise<Listing> {
  const base = listBase(basePath, query);
  const target = Math.max(1, Math.min(page, MAX_CURSOR_PAGE));

  let html: string;
  try {
    html = await ehHtml(base);
    // Cursor walk: every hop is cached HTML, so page N costs one upstream fetch
    // per uncached page, not per request.
    for (let p = 1; p < target; p++) {
      const cursor = nextCursor(html);
      if (!cursor) break;
      html = await ehHtml(withCursor(base, cursor));
    }
  } catch (err) {
    if (/responded 404/.test(err instanceof Error ? err.message : "")) {
      return { cards: [], page: target, maxPage: 1 };
    }
    throw err;
  }

  return {
    cards: parseCards(html),
    page: target,
    // Cursor pagination has no known last page; advertise one step forward.
    maxPage: nextCursor(html) ? target + 1 : target,
  };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function ehTagSeeds(): { slug: string; label: string; count?: number }[] {
  return TAG_SEEDS.map((slug) => ({ slug, label: tagLabel(slug) }));
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export async function ehDetail(ref: string): Promise<ComicDetail> {
  const ids = ehRef(ref);
  if (!ids) throw new Error(`Not an E-Hentai gallery reference: ${ref}`);

  const url = `${EH_BASE}/g/${ids.gid}/${ids.token}/`;
  const html = await ehHtml(url);
  const $ = cheerio.load(html);

  const title = clean($("h1#gn").text()) || clean($("title").text()) || "Untitled";
  const category = clean($("#gdc").text());
  const pages = Number((clean($("#gdd").text()).match(/Length:\s*(\d+)\s*pages/i) || [])[1] || 0);

  const tags = [
    ...new Set(
      $("a[href*='e-hentai.org/tag/']")
        .map((_, el) => {
          const slug = ($(el).attr("href") || "").match(/\/tag\/([^/?#]+)/)?.[1] || "";
          return slug;
        })
        .get()
        .filter(Boolean),
    ),
  ].slice(0, 24);

  const cover =
    $('meta[property="og:image"]').attr("content") ||
    $("img#gd1").attr("src") ||
    $("div#gd1 img").attr("src") ||
    "";

  const images = Array.from(
    { length: pages },
    (_, i) => `/api/eh/image?g=${ids.gid}&t=${ids.token}&n=${i + 1}`,
  );

  return {
    url,
    slug: ehSlug(ids.gid, ids.token),
    title,
    cover,
    images,
    tags,
    artists: [],
    // E-Hentai detail pages carry no related-gallery rail.
    related: [],
  };
}

// ---------------------------------------------------------------------------
// Image proxy support
// ---------------------------------------------------------------------------

type ImageEntry = { bytes: Uint8Array<ArrayBuffer>; type: string };
type ImageState = { map: Map<string, ImageEntry>; total: number };

const IMG_KEY = "__kitsuneEhImages";
const IMG_BUDGET = 48 * 1024 * 1024;

function imageState(): ImageState {
  const g = globalThis as unknown as Record<string, ImageState | undefined>;
  if (!g[IMG_KEY]) g[IMG_KEY] = { map: new Map(), total: 0 };
  return g[IMG_KEY]!;
}

function imageGet(key: string): ImageEntry | undefined {
  const state = imageState();
  const entry = state.map.get(key);
  if (!entry) return undefined;
  // Refresh LRU position.
  state.map.delete(key);
  state.map.set(key, entry);
  return entry;
}

function imageSet(key: string, entry: ImageEntry) {
  const state = imageState();
  state.map.set(key, entry);
  state.total += entry.bytes.byteLength;
  while (state.total > IMG_BUDGET) {
    const oldest = state.map.keys().next();
    if (oldest.done) break;
    const value = state.map.get(oldest.value);
    state.map.delete(oldest.value);
    state.total -= value?.bytes.byteLength || 0;
  }
}

/** Resolve the /s/ viewer URL for page `page` (1-based) of a gallery. */
async function pageUrlFor(gid: string, token: string, page: number): Promise<string | null> {
  const index = page - 1;
  const thumbPage = Math.floor(index / PER_PAGE);
  const path = `/g/${gid}/${token}/${thumbPage > 0 ? `?p=${thumbPage}` : ""}`;
  const html = await ehHtml(path);
  const $ = cheerio.load(html);
  const hrefs = $("#gdt a[href*='/s/']")
    .map((_, el) => $(el).attr("href") || "")
    .get()
    .filter(Boolean);
  return hrefs[index % PER_PAGE] || null;
}

/** Fetch one reader image (resolving the expiring URL server-side). */
export async function ehImageForPage(
  gid: string,
  token: string,
  page: number,
): Promise<ImageEntry | null> {
  const viewer = await pageUrlFor(gid, token, page);
  if (!viewer) return null;

  const cached = imageGet(viewer);
  if (cached) return cached;

  const html = await ehHtml(viewer);
  const src = cheerio.load(html)("img#img").attr("src");
  if (!src) return null;

  const entry = await downloadImage(src, viewer);
  imageSet(viewer, entry);
  return entry;
}

/**
 * E-Hentai serves pages from H@H nodes on assorted ports, and some of those
 * (notably :8888) are unreachable from filtered networks. Try the URL as given,
 * then without the explicit port, so a blocked node doesn't kill the page.
 */
function imageCandidates(raw: string): string[] {
  const candidates = [raw];
  if (/^https?:\/\/[^/]+:8888\//.test(raw)) candidates.push(raw.replace(":8888", ""));
  return [...new Set(candidates)];
}

async function downloadImage(raw: string, referer: string): Promise<ImageEntry> {
  let lastError: unknown;

  for (const candidate of imageCandidates(raw)) {
    try {
      const res = await fetch(candidate, {
        headers: { "User-Agent": UA, Referer: referer, Accept: "image/*,*/*" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Image upstream responded ${res.status}`);

      const type = res.headers.get("content-type") || "image/jpeg";
      return { bytes: new Uint8Array(await res.arrayBuffer()), type };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Image host unreachable: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

export function ehImageCacheStats() {
  const state = imageState();
  return { entries: state.map.size, bytes: state.total, budget: IMG_BUDGET };
}
