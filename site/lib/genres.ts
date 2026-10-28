/**
 * Curated genre index.
 *
 * Every slug here is a real upstream tag (verified against HentaiFox's
 * `/tag/<slug>/` pages), so the menu only ever links to pages that resolve to
 * actual comics. Groups are a presentation concern only — the site still routes
 * a genre through `/tag/<slug>` like any other tag.
 */
export type Genre = { slug: string; label: string };

export const GENRE_GROUPS: { title: string; genres: Genre[] }[] = [
  {
    title: "Popular",
    genres: [
      { slug: "big-breasts", label: "Big Breasts" },
      { slug: "schoolgirl-uniform", label: "Schoolgirl Uniform" },
      { slug: "milf", label: "MILF" },
      { slug: "netorare", label: "Netorare" },
      { slug: "ahegao", label: "Ahegao" },
      { slug: "yaoi", label: "Yaoi" },
      { slug: "yuri", label: "Yuri" },
      { slug: "futanari", label: "Futanari" },
    ],
  },
  {
    title: "Relationships",
    genres: [
      { slug: "incest", label: "Incest" },
      { slug: "harem", label: "Harem" },
      { slug: "group", label: "Group" },
      { slug: "sole-female", label: "Sole Female" },
      { slug: "sole-male", label: "Sole Male" },
      { slug: "tomboy", label: "Tomboy" },
      { slug: "tomgirl", label: "Tomgirl" },
    ],
  },
  {
    title: "Kinks",
    genres: [
      { slug: "bondage", label: "Bondage" },
      { slug: "femdom", label: "Femdom" },
      { slug: "exhibitionism", label: "Exhibitionism" },
      { slug: "tentacles", label: "Tentacles" },
      { slug: "monster", label: "Monster" },
      { slug: "mind-break", label: "Mind Break" },
      { slug: "nakadashi", label: "Nakadashi" },
    ],
  },
  {
    title: "Style & format",
    genres: [
      { slug: "doujinshi", label: "Doujinshi" },
      { slug: "manga", label: "Manga" },
      { slug: "full-color", label: "Full Color" },
      { slug: "stockings", label: "Stockings" },
      { slug: "pantyhose", label: "Pantyhose" },
      { slug: "glasses", label: "Glasses" },
    ],
  },
];

/** Flat genre list, for pages that don't want the grouping. */
export const GENRES: Genre[] = GENRE_GROUPS.flatMap((g) => g.genres);

/** Label lookup so tag pages can show a proper name instead of a slug. */
export function genreLabel(slug: string): string | undefined {
  return GENRES.find((g) => g.slug === slug)?.label;
}
