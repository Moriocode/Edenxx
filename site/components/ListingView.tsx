import ComicCard from "@/components/ComicCard";
import TagRail from "@/components/TagRail";
import Pager from "@/components/Pager";
import type { Listing } from "@/lib/source";

export default function ListingView({
  title,
  subtitle,
  listing,
  base,
  query,
  tags,
}: {
  title: string;
  subtitle?: string;
  listing: Listing;
  base: string;
  query?: string;
  tags: { slug: string; count?: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_264px]">
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-line/70 pb-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            page {listing.page}
            {listing.maxPage > 1 ? ` / ${listing.maxPage}` : ""} · {listing.cards.length} comics
          </span>
        </div>

        {listing.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-panel/50 p-10 text-center">
            <p className="text-sm font-semibold text-white/80">No comics found here</p>
            <p className="mt-1 text-xs text-muted">
              Try a different page, tag, or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {listing.cards.map((card, i) => (
              <ComicCard key={card.url} card={card} priority={i < 5} />
            ))}
          </div>
        )}

        <Pager page={listing.page} maxPage={listing.maxPage} base={base} query={query} />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <TagRail tags={tags} />
        </div>
      </aside>
    </div>
  );
}
