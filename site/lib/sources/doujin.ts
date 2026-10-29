import type { ComicCard, ComicDetail } from "@/lib/source";

/**
 * doujin-api adapter (github.com/indiser/doujin-api).
 *
 * That project is a self-hosted FastAPI service that scrapes an NHentai-style
 * gallery site. It is wired here but DISABLED until it is actually deployed:
 * set `DOUJIN_API_URL` (e.g. https://doujin-api.example.com) to turn it on.
 * Nothing reads that variable in the browser; it is server-side only.
 *
 * Scope: detail/reader only. The API exposes just `GET /manga_id={id}` — no
 * listing, search or tag endpoints — so it cannot feed browse pages and is
 * deliberately kept OUT of the listing source chain (sourceChain()). Its
 * slugs only resolve direct visits such as /comic/dx-177013. When the API
 * grows list endpoints, its listing functions can join sourceChain() too.
 *
 * Responses follow the shape documented in that repo's README: id, title,
 * tags/artists/categories, num_pages, page_urls[] and cover_image (absolute
 * URLs on the upstream CDN), plus recommendations[] for related cards.
 */

const SLUG_RE = /^dx-(\d+)$/;

type DoujinRecommendation = {
  id: number;
  title?: string;
  thumbnail_image?: string;
};

type DoujinGallery = {
  id: number;
  title?: string;
  date?: string;
  categories?: string[];
  tags?: string[];
  artists?: string[];
  num_pages?: number;
  page_urls?: string[];
  cover_image?: string;
  recommendations?: DoujinRecommendation[];
};

/** True when a hosted doujin-api instance has been configured. */
export function doujinEnabled(): boolean {
  return !!(process.env.DOUJIN_API_URL || "").trim();
}

function baseUrl(): string {
  return (process.env.DOUJIN_API_URL || "").trim().replace(/\/+$/, "");
}

export function dxSlug(id: string | number): string {
  return `dx-${String(id).replace(/\D/g, "")}`;
}

/** True when a route slug should be resolved against a hosted doujin-api. */
export function isDoujinRef(ref: string): boolean {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return false;
  if (SLUG_RE.test(clean)) return true;
  return /^manga_id=(\d+)$/.test(clean) || /^manga_id\/(\d+)$/.test(clean);
}

function doujinId(ref: string): string | null {
  const clean = (ref || "").trim().replace(/^\/+|\/+$/g, "");
  const match = clean.match(SLUG_RE) || clean.match(/manga_id[=/](\d+)$/);
  return match ? match[1] : null;
}

export async function doujinDetail(ref: string): Promise<ComicDetail> {
  if (!doujinEnabled()) {
    throw new Error("doujin-api is not configured (set DOUJIN_API_URL)");
  }

  const id = doujinId(ref);
  if (!id) throw new Error(`Not a doujin-api gallery reference: ${ref}`);

  const url = `${baseUrl()}/manga_id=${id}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Upstream responded ${res.status} for ${url}`);

  const data = (await res.json()) as DoujinGallery;
  const images = (Array.isArray(data.page_urls) ? data.page_urls : []).filter((u) =>
    /^https?:\/\//.test(u),
  );
  if (images.length === 0) {
    throw new Error("doujin-api returned no pages for this gallery");
  }

  const categories = (data.categories || []).map((c) => c.trim()).filter(Boolean);
  const tags = [...new Set([...categories, ...(data.tags || []).map((t) => t.trim())])]
    .filter(Boolean)
    .slice(0, 24);
  const artists = [...new Set((data.artists || []).map((a) => a.trim()))]
    .filter(Boolean)
    .slice(0, 12);

  const related: ComicCard[] = (data.recommendations || [])
    .slice(0, 12)
    .map((rec) => ({
      id: String(rec.id),
      url: `https://nhentai.net/g/${rec.id}/`,
      slug: dxSlug(rec.id),
      title: (rec.title || "").trim() || "Untitled",
      cover: rec.thumbnail_image || "",
      tags: [],
      artists: [],
    }));

  return {
    url,
    slug: dxSlug(data.id || id),
    title: (data.title || "").trim() || "Untitled",
    cover: (data.cover_image || "").trim(),
    images,
    tags,
    artists,
    related,
  };
}
