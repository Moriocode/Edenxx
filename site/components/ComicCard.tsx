import Link from "next/link";
import LoadableImage from "@/components/LoadableImage";
import type { ComicCard as Card } from "@/lib/source";

export default function ComicCard({ card, priority = false }: { card: Card; priority?: boolean }) {
  return (
    <Link
      href={`/comic/${card.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition duration-200 hover:-translate-y-0.5 hover:border-edge hover:shadow-lift"
    >
      <div className="card-cover relative overflow-hidden bg-panel2">
        {card.cover ? (
          <LoadableImage
            src={card.cover}
            alt={card.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            wrapperClassName="card-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-panel2">
            <span className="text-xl font-black lowercase tracking-tight text-line">erofox</span>
          </div>
        )}

        {card.pages ? (
          <span className="absolute right-1.5 top-1.5 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold text-fg/85 backdrop-blur">
            {card.pages} pages
          </span>
        ) : null}

        {/* Outlined-only label: two dark pills side by side read as one bar on
            a 150px-wide card, so the source/age label carries no background. */}
        {card.age ? (
          <span className="absolute left-2 top-2 max-w-[55%] truncate text-[9px] font-bold uppercase tracking-[0.14em] text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
            {card.age}
          </span>
        ) : null}

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
        <span className="absolute inset-x-2 bottom-2 translate-y-1.5 rounded-md bg-accent py-1.5 text-center text-[11px] font-extrabold text-black opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          Read now
        </span>
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
