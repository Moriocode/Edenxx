export const SOURCES = ["hentaifox", "ehentai", "hdporncomics"] as const;

export type SourceId = (typeof SOURCES)[number];

/**
 * Public contract shared across all comic sources.
 * Right now the site is wired to a single hdporncomics scraper, so every source
 * adapter must return the same shape the existing components already expect.
 */
export type ComicCard = {
  id: string;
  url: string;
  slug: string;
  title: string;
  cover: string;
  views?: string;
  pages?: string;
  age?: string;
  tags: string[];
  artists: string[];
};

export type ComicDetail = {
  url: string;
  slug: string;
  title: string;
  cover: string;
  images: string[];
  tags: string[];
  artists: string[];
  views?: string;
  related: ComicCard[];
};

export type Listing = {
  cards: ComicCard[];
  page: number;
  maxPage: number;
};

/**
 * Source selection.
 *
 * Keep the site on one source at a time until a second source is verified live
 * from this environment. The current default is the hdporncomics scraper path
 * that the rest of the app is already built around.
 */
export function sourceFor(_id?: SourceId): SourceId {
  // The head of the chain is the active source. The hidden router demotes a
  // source that stops answering, so this is "the one that works right now".
  return routeChain()[0];
}

/**
 * Source order used for fallback.
 *
 * Defaults to HentaiFox (fast, direct CDN images), then E-Hentai (much larger
 * catalogue, proxied images), then hdporncomics. Override for testing with a
 * comma list, e.g. KITSUNE_SOURCE_ORDER=ehentai,hentaifox.
 */
export function sourceChain(): SourceId[] {
  const wanted = (process.env.KITSUNE_SOURCE_ORDER || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id): id is SourceId => (SOURCES as readonly string[]).includes(id));

  return wanted.length ? [...wanted, ...SOURCES.filter((id) => !wanted.includes(id))] : [...SOURCES];
}

/**
 * Chain order for this request, with failing sources moved out of the way.
 * See `source-routing.ts` for the cooldown rules.
 */
function routeChain(): SourceId[] {
  return routeOrder(sourceChain());
}

// ---------------------------------------------------------------------------
// Source adapter surface
// ---------------------------------------------------------------------------

/**
 * Round-trip health probe for the currently selected source.
 * Used by /api/health and any future source-health badge in the UI.
 */
export async function sourceHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  return hentaifoxHealth();
}

/**
 * Per-attempt budget. A dead upstream must not hold the page hostage while the
 * HTML cache retries it, so past this deadline the attempt is abandoned and the
 * next source is tried. The abandoned fetch keeps running and still warms the
 * cache if it eventually succeeds.
 */
const LIST_BUDGET_MS = 12_000;
const DETAIL_BUDGET_MS = 20_000;

function withBudget<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
  });
  // The losing side of the race must never surface as an unhandled rejection.
  promise.catch(() => {});
  return Promise.race([promise, deadline]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Runs one request down the source chain and returns the first success.
 *
 * This is the hidden auto picker: sources are tried in routed order, an empty
 * response counts as a failure (a blocked upstream often answers 200 with no
 * items instead of an error), and the result is fed back to the router so the
 * next request starts from a source that works. Nothing here is user-visible.
 */
async function firstOk<T>(
  run: (source: SourceId) => Promise<T>,
  isBroken?: (value: T) => boolean,
  options?: { report?: boolean },
): Promise<T> {
  const report = options?.report ?? true;
  const problems: string[] = [];

  for (const source of routeChain()) {
    try {
      const value = await withBudget(run(source), LIST_BUDGET_MS, `${source} request`);
      if (isBroken?.(value)) {
        if (report) noteFailure(source, "empty response");
        problems.push(`${source}: empty response`);
        continue;
      }
      if (report) noteSuccess(source);
      return value;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (report) noteFailure(source, message);
      problems.push(`${source}: ${message}`);
    }
  }

  throw new Error(`No source could serve this request (${problems.join("; ")})`);
}

/**
 * Latest listing.
 *
 * The home feed treats an empty first page as a failure: a source that blocks
 * us, changes markup or serves a placeholder page returns 0 cards, not an
 * error, and that is exactly when the fallback should take over.
 */
export function listLatest(page = 1): Promise<Listing> {
  return firstOk(
    (source) => listPage(source, "", page),
    (listing) => page === 1 && listing.cards.length === 0,
  );
}

/**
 * Tag listing for the active source.
 */
export function listTag(slug: string, page = 1): Promise<Listing> {
  return firstOk((source) => listPage(source, `/tag/${slug}`, page));
}

/**
 * Artist listing for the active source.
 */
export function listArtist(slug: string, page = 1): Promise<Listing> {
  return firstOk((source) => listPage(source, `/artist/${slug}`, page));
}

/**
 * Search for the active source.
 */
export function searchComics(query: string, page = 1): Promise<Listing> {
  return firstOk((source) => listPage(source, "", page, { s: query }));
}

/**
 * Comic detail for the active source.
 *
 * Slugs are source-tagged: `hf-123456` resolves on HentaiFox, anything else is
 * treated as a hdporncomics path, so cards keep linking correctly no matter
 * which source in the chain produced them.
 */
export async function getComic(pathOrUrl: string): Promise<ComicDetail> {
  // Try the source the slug belongs to first, then the other one, so a card is
  // still readable if the chain switched upstreams between listing and detail.
  const order: SourceId[] = isEHentaiRef(pathOrUrl)
    ? ["ehentai", "hentaifox", "hdporncomics"]
    : isHentaiFoxRef(pathOrUrl)
      ? ["hentaifox", "ehentai", "hdporncomics"]
      : ["hdporncomics", "hentaifox", "ehentai"];

  const problems: string[] = [];
  for (const source of order) {
    try {
      const detail = await withBudget(
        getComicFor(source, pathOrUrl),
        DETAIL_BUDGET_MS,
        `${source} detail`,
      );
      noteSuccess(source);
      return detail;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // A wrong-source guess (404 / not a ref for this source) says nothing about
      // the source's health, so only real failures are reported.
      if (!/responded 404|Not an? [A-Za-z-]* ?gallery reference/i.test(message)) {
        noteFailure(source, message);
      }
      problems.push(`${source}: ${message}`);
    }
  }
  throw new Error(`No source could open this comic (${problems.join("; ")})`);
}

/**
 * Tag index for the active source.
 */
export async function allTags(): Promise<{ slug: string; label: string; count?: number }[]> {
  // Tag rails are cosmetic: fall back to another source, but never let a broken
  // sidebar rest the whole catalogue.
  return firstOk(
    (source) => allTagsFor(source),
    (tags) => tags.length === 0,
    { report: false },
  );
}

/**
 * Popular tags for the active source (sidebar).
 */
export async function popularTags(limit = 28): Promise<{ slug: string; count: number }[]> {
  return firstOk(
    (source) => popularTagsFor(source, limit),
    (tags) => tags.length === 0,
    { report: false },
  );
}

// ---------------------------------------------------------------------------
// hdporncomics adapter
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import { cachedHtml } from "@/lib/cache";
import { noteFailure, noteSuccess, routeOrder } from "@/lib/source-routing";
import { hfDetail, hfListPage, hfTagIndex, hentaifoxHealth, isHentaiFoxRef } from "@/lib/sources/hentaifox";
import { ehDetail, ehListPage, ehTagSeeds, ehHealth, isEHentaiRef } from "@/lib/sources/ehentai";

const HD_BASE = "https://hdporncomics.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const REVALIDATE = 600;

function absolute(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return HD_BASE + (href.startsWith("/") ? href : `/${href}`);
}

async function getHtml(pathOrUrl: string): Promise<string> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : HD_BASE + pathOrUrl;

  return cachedHtml(
    url,
    async () => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Upstream responded ${res.status} for ${url}`);
      return res.text();
    },
    REVALIDATE * 1000,
  );
}

export async function hdporncomicsHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const url = `${HD_BASE}/`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return {
      ok: res.ok,
      url,
      status: res.status,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      url,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function num(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(/\s+/g, " ").trim();
}

function cleanTitle(raw: string | undefined): string {
  const t = num(raw) || "";
  return (
    t.replace(/\s*[|–—-]?\s*(comic porn|porn comics?|sex comics?|comics?|porn)\s*$/i, "").trim() || t
  );
}

function parseCards(html: string): ComicCard[] {
  const $ = cheerio.load(html);
  const cards: ComicCard[] = [];

  $("#all-posts > div[id^='post-']").each((_, el) => {
    const $el = $(el);
    const href = $el.find(".comic-image a").first().attr("href");
    if (!href) return;
    const url = absolute(href);
    const classes = ($el.attr("class") || "").split(/\s+/);
    const text = $el.text().replace(/\s+/g, " ");
    const cover =
      $el.find("img").first().attr("src") ||
      $el.find("source").first().attr("srcset") ||
      "";

    cards.push({
      id: ($el.attr("id") || "").replace(/^post-/, "") || url,
      url,
      slug: slugFromUrl(url),
      title:
        cleanTitle($el.find("h2").first().text()) ||
        cleanTitle($el.find("img").first().attr("alt")) ||
        "Untitled",
      cover: absolute(cover),
      views: num((text.match(/([\d.]+k?)\s*Views/i) || [])[1]),
      pages: num((text.match(/(\d+)\s*Images/i) || [])[1]),
      age: num($el.find(".comic-image span").last().text()),
      tags: classes.filter((c) => c.startsWith("tag-")).map((c) => c.slice(4)),
      artists: classes.filter((c) => c.startsWith("artist-")).map((c) => c.slice(7)),
    });
  });

  const seen = new Set<string>();
  return cards.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
}

function slugFromUrl(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const clean = path.replace(/^\/|\/$/g, "");
  return clean || "home";
}

function maxPageFrom(html: string, basePath: string): number {
  const pages = [
    ...html.matchAll(
      new RegExp(`${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}page\\/(\\d+)\\/`, "g"),
    ),
  ].map((m) => Number(m[1]));
  const generic = [...html.matchAll(/\/page\/(\d+)\//g)].map((m) => Number(m[1]));
  return Math.max(1, ...pages, ...generic);
}

function pagePath(basePath: string, page: number): string {
  const clean = basePath.replace(/\/$/, "");
  return page <= 1 ? `${clean}/` : `${clean}/page/${page}/`;
}

async function listing(
  basePath: string,
  page: number,
  query?: { s?: string },
): Promise<Listing> {
  let path: string;
  if (query?.s) {
    const q = `?s=${encodeURIComponent(query.s)}&s_extra%5B%5D=title&s_extra%5B%5D=taxonomy`;
    path = `${page <= 1 ? "/" : `/page/${page}/`}${q}`;
  } else {
    path = pagePath(basePath || "/", page);
  }

  let html: string;
  try {
    html = await getHtml(path);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/responded 404/.test(msg)) return { cards: [], page, maxPage: 1 };
    throw err;
  }

  return {
    cards: parseCards(html),
    page,
    maxPage: maxPageFrom(html, `${basePath.replace(/\/$/, "")}/`),
  };
}

export function listPage(source: SourceId, basePath: string, page: number, query?: { s?: string }): Promise<Listing> {
  if (source === "hentaifox") return hfListPage(basePath, page, query);
  if (source === "ehentai") return ehListPage(basePath, page, query);
  return listing(basePath, page, query);
}

export async function getComicFor(source: SourceId, pathOrUrl: string): Promise<ComicDetail> {
  if (source === "hentaifox" || isHentaiFoxRef(pathOrUrl)) return hfDetail(pathOrUrl);
  if (source === "ehentai" || isEHentaiRef(pathOrUrl)) return ehDetail(pathOrUrl);
  return hdporncomicsDetail(pathOrUrl);
}

async function hdporncomicsDetail(pathOrUrl: string): Promise<ComicDetail> {
  const url = absolute(pathOrUrl);
  const html = await getHtml(url);
  const $ = cheerio.load(html);

  const images = [
    ...new Set(
      $(".my-gallery a[itemprop='contentUrl']")
        .map((_, el) => absolute($(el).attr("href") || ""))
        .get()
        .filter((u) => /\.(jpe?g|png|webp)$/i.test(u)),
    ),
  ];

  const tags = [
    ...new Set(
      $("a[href*='/tag/']")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t && t.length < 40),
    ),
  ].slice(0, 24);

  const artists = [
    ...new Set(
      $("a[href*='/artist/']")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t && t.length < 60),
    ),
  ].slice(0, 12);

  const text = $("body").text().replace(/\s+/g, " ");
  const cover =
    $(".my-gallery img").first().attr("src") ||
    $(".my-gallery source").first().attr("srcset") ||
    "";

  return {
    url,
    slug: slugFromUrl(url),
    title: cleanTitle($("h1").first().text()) || "Untitled",
    cover: absolute(cover),
    images,
    tags,
    artists,
    views: num((text.match(/([\d.]+k?)\s*Views/i) || [])[1]),
    related: parseCards(html)
      .filter((c) => c.url !== url)
      .slice(0, 12),
  };
}

export async function allTagsFor(source: SourceId): Promise<{ slug: string; label: string; count?: number }[]> {
  if (source === "hentaifox") {
    const tags = await hfTagIndex();
    return tags.sort((a, b) => a.label.localeCompare(b.label));
  }
  if (source === "ehentai") {
    return ehTagSeeds().sort((a, b) => a.label.localeCompare(b.label));
  }

  const html = await getHtml("/comics/tags/");
  const seen = new Map<string, { slug: string; label: string; count?: number }>();

  for (const m of html.matchAll(/href="[^"]*\/tag\/([a-z0-9-]+)\/?\"[^>]*>([^<]{1,60})<\/a>/gi)) {
    const slug = m[1];
    const label = m[2].replace(/&amp;/g, "&").trim();
    if (!slug || seen.has(slug)) continue;
    seen.set(slug, { slug, label: label || slug });
  }

  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export async function popularTagsFor(source: SourceId, limit = 28): Promise<{ slug: string; count: number }[]> {
  if (source === "hentaifox") {
    const tags = await hfTagIndex();
    return tags
      .filter((t) => t.count)
      .sort((a, b) => (b.count || 0) - (a.count || 0) || a.slug.localeCompare(b.slug))
      .slice(0, limit)
      .map((t) => ({ slug: t.slug, count: t.count || 0 }));
  }
  if (source === "ehentai") {
    return ehTagSeeds()
      .slice(0, limit)
      .map((t) => ({ slug: t.slug, count: 0 }));
  }

  const html = await getHtml("/");
  const counts = new Map<string, number>();
  for (const card of parseCards(html)) {
    for (const tag of card.tags) {
      if (tag.length < 3 || tag.length > 40) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}
