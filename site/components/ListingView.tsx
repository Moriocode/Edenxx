import Link from "next/link";
import { Fragment } from "react";
import AdSlot, { AD_EVERY } from "@/components/AdSlot";
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_264px] lg:gap-8">
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-fg">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
          </div>
          <span className="chip shrink-0 gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]">
            Page {listing.page}
            {listing.maxPage > 1 ? ` / ${listing.maxPage}` : ""}
            <span aria-hidden className="text-muted/40">
              ·
            </span>
            {listing.cards.length} comics
          </span>
        </div>

        {listing.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-panel/50 px-6 py-14 text-center">
            <p className="text-sm font-bold text-fg">No comics found here</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
              Try a different page, tag or search term.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link href="/browse" className="btn btn-primary">
                Browse catalogue
              </Link>
              <Link href="/tags" className="btn">
                Browse tags
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
            {listing.cards.map((card, i) => (
              <Fragment key={card.url}>
                <ComicCard card={card} priority={i < 5} />
                {/* Ad slot between cover rows: full-width so it forms its own band. */}
                {(i + 1) % AD_EVERY.listing === 0 && i + 1 < listing.cards.length ? (
                  <AdSlot id={`listing-${listing.page}-${i + 1}`} />
                ) : null}
              </Fragment>
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
