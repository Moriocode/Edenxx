import type { SourceId } from "@/lib/source";

export const SITE_NAME = "Kitsune";
export const SITE_TAGLINE = "adult comics, doujin & manhwa reader";

/**
 * Rights-holder, abuse and privacy contact shown on the legal pages.
 *
 * Replace this with a real, monitored mailbox before launch — ``.example`` is a
 * reserved placeholder domain, not a deliverable address.
 */
export const CONTACT_EMAIL = "contact@kitsune.example";

/**
 * Default active source id.
 *
 * HentaiFox is the primary adapter: server-rendered HTML, fast responses and
 * comic/doujin content only. hdporncomics stays in the chain as a fallback.
 */
export const DEFAULT_SOURCE_ID = "hentaifox" as SourceId;

/**
 * Default comic/manga-filter policy.
 *
 * Applies at the site layer, not at the scraper layer, so the same upstream can
 * be reused while the site itself stays focused on comic/doujin/manhwa pages
 * rather than anime-video terms.
 */
export const DEFAULT_FILTERS = {
  requirePageCount: true,
  excludeTerms: [
    "anime",
    "video",
    "stream",
    "episode",
    "ova",
    "ova/",
    "episode/",
    "streaming",
    "stream/",
  ],
} as const;

export const PAGE_SIZE = 24;
