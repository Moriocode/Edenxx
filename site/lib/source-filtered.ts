import type { Listing, ComicCard } from "@/lib/source";

export type FilterOptions = {
  /** Only show comics with at least this many pages. */
  minPages?: number;
  /** Only show comics with at most this many pages. */
  maxPages?: number;
  /** Drop any card whose tags or title contain this substring. */
  excludeTerms?: string[];
  /** Keep only cards that include at least one of these tags. */
  requireAnyTag?: string[];
  /** Drop cards with no page count, to avoid placeholder/unknown entries. */
  requirePageCount?: boolean;
};

const DEFAULT_EXCLUDE_TERMS = [
  "anime",
  "video",
  "stream",
  "episode",
  "ova",
  "ova/",
  "episode/",
  "streaming",
];

function termMatchesCard(card: ComicCard, term: string): boolean {
  const haystack = `${card.title} ${card.tags.join(" ")} ${card.artists.join(" ")}`.toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export function filterListing(listing: Listing, opts: FilterOptions = {}): Listing {
  const excludeTerms = opts.excludeTerms ?? DEFAULT_EXCLUDE_TERMS;

  return {
    ...listing,
    cards: listing.cards.filter((card): card is ComicCard => {
      if (opts.requirePageCount && !card.pages) return false;

      const pages = Number(card.pages ?? "0");
      if (Number.isNaN(pages)) return false;
      if (opts.minPages != null && pages < opts.minPages) return false;
      if (opts.maxPages != null && pages > opts.maxPages) return false;

      for (const term of excludeTerms) {
        if (termMatchesCard(card, term)) return false;
      }

      if (opts.requireAnyTag?.length) {
        const cardTags = card.tags.map((t) => t.toLowerCase());
        if (!opts.requireAnyTag.some((t) => cardTags.includes(t.toLowerCase()))) {
          return false;
        }
      }

      return true;
    }),
  };
}

/** Common manga/comic-focused defaults: drop anime-video-like terms and require a page count. */
export function comicOnlyListing(listing: Listing): Listing {
  return filterListing(listing, {
    excludeTerms: DEFAULT_EXCLUDE_TERMS,
    requirePageCount: true,
  });
}
