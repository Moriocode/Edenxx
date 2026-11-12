import type { ComicCard, ComicDetail, Listing } from "@/lib/source";

/**
 * Server-side content moderation.
 *
 * Every gallery returned by a scraper passes through this module before it can
 * reach a route, an API response or the rendered page. Three categories are
 * hard-blocked:
 *
 *   1. sexualised depictions of minors (or tags that present as such),
 *   2. non-consensual sexual content,
 *   3. tags that exist to solicit the above.
 *
 * The list is deliberately hard-coded rather than stored in the database or
 * exposed to an admin screen: nothing served from an upstream source, and no
 * runtime configuration, can re-enable a work that matches it. Extend the lists
 * below and ship a deploy to change the policy.
 *
 * Matching is token-based, so a tag like "childhood friends" is not caught by
 * the "child" rule, while "lolicon", "loli", "shotacon" and "shotacon" are.
 */

/** Whole tokens that describe a minor in a sexual context. */
const MINOR_TOKENS = new Set([
  "child",
  "children",
  "childlike",
  "underage",
  "preteen",
  "toddler",
  "toddlers",
  "infant",
  "infants",
  "minor",
  "minors",
  "kid",
  "kids",
  "baby",
  "babies",
  "kindergarten",
  "preschool",
  "elementary",
]);

/** Compound tags upstreams use for the same material (lolicon, shotacon …). */
const MINOR_PREFIXES = ["loli", "shota", "pedo", "paedo"];

/** Whole tokens describing non-consensual sexual content. */
const NON_CONSENT_TOKENS = new Set(["snuff", "forced", "drugged"]);

/** Compounds such as rapeplay, noncon, molestation. */
const NON_CONSENT_PREFIXES = ["rape", "noncon", "molest"];

/** Multi-word forms, matched as normalised phrases (spaces, not hyphens). */
const BANNED_PHRASES = [
  "under age",
  "pre teen",
  "junior high",
  "non con",
  "non consensual",
  "sexual assault",
  "forced sex",
  "child porn",
  "child pornography",
];

/** Lower-case, strip accents and punctuation, collapse to single spaces. */
export function normaliseTag(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Returns the offending term, or null when every value is clean.
 * Runs on titles, tags and artist names alike.
 */
export function blockedTermIn(values: readonly string[]): string | null {
  for (const raw of values) {
    if (!raw) continue;
    const text = normaliseTag(raw);
    if (!text) continue;

    for (const phrase of BANNED_PHRASES) {
      if (text.includes(phrase)) return phrase;
    }

    for (const token of text.split(" ")) {
      if (!token) continue;
      if (MINOR_TOKENS.has(token) || NON_CONSENT_TOKENS.has(token)) return token;
      if (MINOR_PREFIXES.some((prefix) => token.startsWith(prefix))) return token;
      if (NON_CONSENT_PREFIXES.some((prefix) => token.startsWith(prefix))) return token;
    }
  }
  return null;
}

/** True when a single tag/slug/label falls under the blocklist. */
export function isBlockedTag(tag: string): boolean {
  return blockedTermIn([tag]) !== null;
}

/**
 * Thrown by the source layer when a scraper returns a gallery that must never
 * be shown. Routes catch it and answer 404, so a blocked work looks exactly like
 * one that no longer exists.
 */
export class ContentBlockedError extends Error {
  readonly term: string;
  readonly ref?: string;

  constructor(term: string, ref?: string) {
    super(`Blocked by content policy: ${term}`);
    this.name = "ContentBlockedError";
    this.term = term;
    this.ref = ref;
  }
}

export function isContentBlocked(error: unknown): error is ContentBlockedError {
  return error instanceof ContentBlockedError;
}

export function isCardBlocked(card: ComicCard): boolean {
  return blockedTermIn([card.title, ...card.tags, ...card.artists]) !== null;
}

/** Drops every blocked card from a listing. */
export function screenListing(listing: Listing): Listing {
  const cards = listing.cards.filter((card) => !isCardBlocked(card));
  return cards.length === listing.cards.length ? listing : { ...listing, cards };
}

/**
 * Validates a detail page; throws when the work itself is blocked and filters
 * the "related" rail so a blocked gallery cannot reappear there.
 */
export function screenDetail(detail: ComicDetail): ComicDetail {
  const term = blockedTermIn([detail.title, ...detail.tags, ...detail.artists]);
  if (term) throw new ContentBlockedError(term, detail.slug);

  const related = detail.related.filter((card) => !isCardBlocked(card));
  return related.length === detail.related.length ? detail : { ...detail, related };
}

/** Keeps blocked tags out of every tag index, rail and sitemap. */
export function screenTagList<T extends { slug: string; label?: string }>(tags: T[]): T[] {
  return tags.filter((tag) => !isBlockedTag(tag.slug) && !isBlockedTag(tag.label ?? ""));
}
