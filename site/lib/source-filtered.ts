import type { Listing, ComicCard } from "@/lib/source";

export type FilterOptions = {
  /** Only show comics with at least this many pages. */
  minPages?: number;
  /** Only show comics with at most this many pages. */
  maxPages?: number;
  /** Drop any card whose tags or title contain one of these as a whole word. */
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiles one exclusion term into a whole-word matcher.
 *
 * A plain substring test drops "Nova", "Casanova" and "Removal" for the term
 * "ova", so the term must sit on its own word boundary. Trailing slashes in the
 * defaults ("ova/", "episode/") are decoration rather than part of the term, so
 * they are trimmed before the pattern is built.
 */
function termPattern(term: string): RegExp {
  const trimmed = term.trim().replace(/\/+$/, "");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(trimmed)}(?![\\p{L}\\p{N}])`, "iu");
}

function termMatchesCard(card: ComicCard, term: string): boolean {
  const haystack = `${card.title} ${card.tags.join(" ")} ${card.artists.join(" ")}`;
  return termPattern(term).test(haystack);
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
