import Link from "next/link";
import LoadableImage from "@/components/LoadableImage";
import type { ComicCard as Card } from "@/lib/source";

/**
 * Gallery card.
 *
 * Every cover sits in the same 3:4 frame and is cropped with object-cover, so no
 * image stretches and rows stay aligned whatever the source returns. Hover is
 * limited to a border lift and a 2% scale — no overlay, no glow, no drop shadow.
 */
export default function ComicCard({ card, priority = false }: { card: Card; priority?: boolean }) {
  return (
    <Link
      href={`/comic/${card.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors duration-150 hover:border-edge focus-visible:border-accent"
    >
      <div className="card-cover relative overflow-hidden bg-panel2">
        {card.cover ? (
          <LoadableImage
            src={card.cover}
            alt={card.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            wrapperClassName="card-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-panel2">
            <span className="text-xl font-black lowercase tracking-tight text-line">erofox</span>
          </div>
        )}

        {card.pages ? (
          <span className="absolute right-1.5 top-1.5 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-fg/85 backdrop-blur-sm">
            {card.pages}p
          </span>
        ) : null}

        {card.age ? (
          <span className="absolute left-2 top-2 max-w-[55%] truncate rounded bg-ink/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg/80 backdrop-blur-sm">
            {card.age}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent">
          {card.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted">
          {card.views ? <span>{card.views} views</span> : null}
          {card.views && card.pages ? (
            <span aria-hidden className="text-muted/40">
              ·
            </span>
          ) : null}
          {card.pages ? <span>{card.pages} images</span> : null}
        </div>
      </div>
    </Link>
  );
}
