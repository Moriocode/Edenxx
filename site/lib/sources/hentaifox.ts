import * as cheerio from "cheerio";
import { cachedHtml } from "@/lib/cache";
import type { ComicCard, ComicDetail, Listing } from "@/lib/source";

/**
 * HentaiFox adapter.
 *
 * HentaiFox is a plain server-rendered doujinshi/manga site: no JS challenge, no
 * API key, ~0.3s responses. That makes it a much better primary source than the
 * hdporncomics scraper (which is heavy, JS-driven and mixes in video content).
 *
 * Verified live from this environment:
 *   GET /                    200, 20 cards/page, pagination at /page/2/ and /pag/N/
 *   GET /search/?q=neko      200, 20 cards, &page=N pagination
 *   GET /tag/<slug>/         200, 20 cards, /tag/<slug>/pag/N/ pagination
 *   GET /tags/               200, tag list with counts, /tags/pag/N/ pagination
 *   GET /gallery/<id>/       200, title/tags/category/page count/cover
 *   GET /g/<id>/1/           200, full page image at img#gimg[data-src]
 *   i3.hentaifox.com images 200 without a Referer (covers, thumbs, pages)
 *
 * Page images are `.webp` (the old "swap the thumb to .jpg" trick 404s now), so
 * the reader path is derived from the real first image URL rather than guessed.
 */

const HF_BASE = "https://hentaifox.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TTL = 10 * 60 * 1000;
const TIMEOUT = 15_000;

const SLUG_RE = /^hf-(\d+)$/;

export function hfSlug(id: string | number): string {
  return `hf-${String(id).replace(/\D/g, "")}`;
}

/** True when a route slug/url should be resolved against HentaiFox. */
export function isHentaiFoxRef(ref: string): boolean {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return false;
  if (SLUG_RE.test(clean)) return true;
  if (/^gallery\/\d+$/.test(clean)) return true;
  if (/hentaifox\.com\/(?:gallery|g)\/\d+/.test(clean)) return true;
  return false;
}

function hfId(ref: string): string | null {
  const m = (ref || "").match(/(?:hf-|gallery\/|g\/)(\d+)/) || (ref || "").match(/^\/(\d+)\/$/);
  return m ? m[1] : null;
}

function absolute(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  return HF_BASE + (url.startsWith("/") ? url : `/${url}`);
}

function clean(text: string | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

async function hfHtml(pathOrUrl: string): Promise<string> {
  const url = absolute(pathOrUrl);
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
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) throw new Error(`Upstream responded ${res.status} for ${url}`);
      return res.text();
    },
    TTL,
  );
}

export async function hentaifoxHealth(): Promise<{
  ok: boolean;
  url: string;
  latencyMs: number;
  status?: number;
  error?: string;
}> {
  const url = `${HF_BASE}/`;
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

  $("div.thumb").each((_, el) => {
    const $el = $(el);
    const href = $el.find(".g_title a").first().attr("href") || $el.find(".inner_thumb a").first().attr("href");
    const id = (href || "").match(/\/gallery\/(\d+)/)?.[1];
    if (!href || !id) return;

    const img = $el.find("img").first();
    const rawCover = img.attr("data-src") || img.attr("src") || "";
    const category = clean($el.find(".g_cat a").first().text());

    cards.push({
      id,
      url: absolute(href),
      slug: hfSlug(id),
      title: clean($el.find(".g_title a").first().text()) || "Untitled",
      // Lazy-loaded thumbs sit in data-src; src is an inline svg placeholder.
      cover: rawCover.startsWith("data:") ? "" : absolute(rawCover),
      pages: undefined,
      views: undefined,
      age: category || undefined,
      tags: category ? [category.toLowerCase()] : [],
      artists: [],
    });
  });

  const seen = new Set<string>();
  return cards.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
}

function maxPage(html: string, page: number): number {
  const numbers: number[] = [];
  for (const m of html.matchAll(/\/(?:pag|page)\/(\d+)\//g)) numbers.push(Number(m[1]));
  for (const m of html.matchAll(/[?&]page=(\d+)/g)) numbers.push(Number(m[1]));
  return Math.max(page, 1, ...numbers.filter((n) => Number.isFinite(n)));
}

function listingPath(basePath: string, page: number, query?: { s?: string }): string {
  if (query?.s) {
    const params = new URLSearchParams({ q: query.s });
    if (page > 1) params.set("page", String(page));
    return `/search/?${params.toString()}`;
  }

  const base = (basePath || "").replace(/\/+$/, "");
  if (!base) {
    // Home is the only route that uses /page/2/ for its second page.
    if (page <= 1) return "/";
    return page === 2 ? "/page/2/" : `/pag/${page}/`;
  }
  return page <= 1 ? `${base}/` : `${base}/pag/${page}/`;
}

export async function hfListPage(
  basePath: string,
  page: number,
  query?: { s?: string },
): Promise<Listing> {
  let html: string;
  try {
    html = await hfHtml(listingPath(basePath, page, query));
  } catch (err) {
    // A 404 here means "no such tag/artist/page", which is an empty result set.
    if (/responded 404/.test(err instanceof Error ? err.message : "")) {
      return { cards: [], page, maxPage: 1 };
    }
    throw err;
  }

  return { cards: parseCards(html), page, maxPage: maxPage(html, page) };
}

// ---------------------------------------------------------------------------
// Tag index
// ---------------------------------------------------------------------------

/**
 * HentaiFox lists tags alphabetically across /tags/pag/N/ with a count badge.
 * Reading a handful of pages and sorting by count gives a real popularity
 * ranking without hardcoding tag names that might not exist.
 */
export async function hfTagIndex(pages = 5): Promise<{ slug: string; label: string; count?: number }[]> {
  const paths = ["/tags/", ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) => `/tags/pag/${i + 2}/`)];
  const results = await Promise.allSettled(paths.map((p) => hfHtml(p)));

  const map = new Map<string, { slug: string; label: string; count?: number }>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const $ = cheerio.load(result.value);
    $("a[href^='/tag/']").each((_, el) => {
      const slug = ($(el).attr("href") || "").replace(/^\/tag\//, "").replace(/\/+$/, "");
      if (!slug) return;
      const text = clean($(el).text());
      const count = Number((text.match(/(\d+)\s*$/) || [])[1] || 0);
      const label = text.replace(/\s*\d+\s*$/, "").trim() || slug.replace(/-+/g, " ");
      const previous = map.get(slug);
      if (!previous || (count && count > (previous.count || 0))) {
        map.set(slug, { slug, label, count: count || undefined });
      }
    });
  }

  if (map.size === 0) {
    throw new Error("HentaiFox tag index returned no tags");
  }
  return [...map.values()];
}

// ---------------------------------------------------------------------------
// Detail + reader
// ---------------------------------------------------------------------------

function pageImageUrls(dir: string, ext: string, total: number): string[] {
  if (!dir || total <= 0) return [];
  return Array.from({ length: total }, (_, i) => `${dir}${i + 1}.${ext}`);
}

/**
 * Reads /g/<id>/1/ (the real reader) to learn the image directory, extension and
 * total page count, then expands that into the full page list.
 */
async function readerPages(id: string, fallbackUrl: string, declaredPages: number) {
  let dir = "";
  let ext = "webp";
  let total = declaredPages;

  const fallback = fallbackUrl.match(/^(.*\/)[^/]+\.(jpg|jpeg|png|webp)$/i);
  if (fallback) dir = fallback[1];

  try {
    const html = await hfHtml(`/g/${id}/1/`);
    const $ = cheerio.load(html);
    const img = $("img#gimg").first();
    const first = img.attr("data-src") || img.attr("src") || "";
    const match = first.match(/^(.*\/)[^/]+\.([a-z0-9]{2,5})$/i);
    if (match) {
      dir = match[1];
      ext = match[2].toLowerCase();
    }
    const readerTotal = Number(clean($(".total_pages").first().text()).replace(/\D/g, ""));
    if (!total && readerTotal) total = readerTotal;
  } catch {
    // Keep whatever the gallery page told us; cover/thumb path still yields a dir.
  }

  return pageImageUrls(dir, ext, total);
}

export async function hfDetail(ref: string): Promise<ComicDetail> {
  const id = hfId(ref);
  if (!id) throw new Error(`Not a HentaiFox gallery reference: ${ref}`);

  const url = `${HF_BASE}/gallery/${id}/`;
  const html = await hfHtml(url);
  const $ = cheerio.load(html);

  const title = clean($("div.info h1").first().text()) || clean($("h1").first().text()) || "Untitled";

  const tags = [
    ...new Set(
      $("ul.tags a")
        .map((_, el) => clean($(el).text()).replace(/\s*\d+$/, "").trim())
        .get()
        .filter((t) => t && t.length < 60),
    ),
  ].slice(0, 24);

  const artists = [
    ...new Set(
      $("ul.artists a, ul.artist a")
        .map((_, el) => clean($(el).text()).replace(/\s*\d+$/, "").trim())
        .get()
        .filter((t) => t && t.length < 60),
    ),
  ].slice(0, 12);

  const pagesText = clean($("span.i_text.pages").first().text());
  const declaredPages = Number((pagesText.match(/(\d+)/) || [])[1] || 0);

  const rawCover =
    $('img[src*="/cover."]').first().attr("src") ||
    $('img[data-src*="/cover."]').first().attr("data-src") ||
    $("div.gallery_left img, div.cover img").first().attr("src") ||
    "";

  const thumb = $("div.thumb img").first().attr("data-src") || "";
  const images = await readerPages(id, absolute(thumb), declaredPages);

  return {
    url,
    slug: hfSlug(id),
    title,
    cover: absolute(rawCover),
    images,
    tags,
    artists,
    related: parseCards(html)
      .filter((c) => c.slug !== hfSlug(id))
      .slice(0, 12),
  };
}
