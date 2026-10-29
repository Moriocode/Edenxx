/**
 * Reserved advertising placement, ready to be wired to an ad network.
 *
 * The slot renders a fixed-height, labelled container between image grids so
 * the layout never shifts when an ad later fills it. To go live with a
 * network (e.g. AdSense), drop its unit inside this container —
 *
 *   <ins className="adsbygoogle" data-ad-client="ca-pub-…" data-ad-slot="…" />
 *
 * — and load the network script once from `app/layout.tsx`. The
 * `data-ad-slot` attribute on the wrapper is the stable hook a script can
 * target (or a selector like `[data-ad-slot]` for lazy rendering).
 *
 * AD_EVERY below is the single place to tune how often slots appear per
 * surface; each consumer picks the interval it needs.
 */

/** How many images sit between two ad slots, per surface. */
export const AD_EVERY = {
  /** Cover grids: home, browse, tag, artist, search. */
  listing: 8,
  /** Page-thumbnail grid on a comic's detail page. */
  thumbs: 16,
  /** Between full-size pages in the reader. */
  reader: 6,
} as const;

export default function AdSlot({
  id,
  variant = "grid",
  className = "",
}: {
  /** Unique placement id, e.g. "listing-1-8". Doubles as the data-ad-slot hook. */
  id: string;
  /** "grid" spans a whole row of an image grid; "reader" is an in-column block. */
  variant?: "grid" | "reader";
  className?: string;
}) {
  const inReader = variant === "reader";

  return (
    <aside
      data-ad-slot={id}
      data-ad-variant={variant}
      aria-label="Advertisement"
      className={[
        inReader ? "w-full my-4 px-4 py-6" : "col-span-full px-4 py-5",
        "flex min-h-[112px] flex-col items-center justify-center gap-1",
        "rounded-xl border border-dashed border-line bg-panel/40",
        className,
      ].join(" ")}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/70">
        Advertisement
      </span>
      <span className="text-[11px] text-muted/50">{id}</span>
    </aside>
  );
}
