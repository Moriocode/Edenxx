import Link from "next/link";
import type { ComicCard as Card } from "@/lib/source";

export default function ComicCard({ card, priority = false }: { card: Card; priority?: boolean }) {
  return (
    <Link
      href={`/comic/${card.slug}`}
      className="group block overflow-hidden rounded-xl border border-line/70 bg-panel transition hover:border-accent/60 hover:bg-panel2"
    >
      <div className="relative card-cover overflow-hidden bg-black">
        {card.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.cover}
            alt={card.title}
            referrerPolicy="no-referrer"
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl opacity-30">🦊</div>
        )}

        {card.pages ? (
          <span className="absolute left-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-accent">
            {card.pages} pages
          </span>
        ) : null}

        {card.age ? (
          <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            {card.age}
          </span>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute inset-x-2 bottom-2 translate-y-2 rounded bg-accent px-2 py-1 text-center text-[11px] font-extrabold text-black opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          READ
        </span>
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/90 group-hover:text-accent">
          {card.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          {card.views ? <span>{card.views} views</span> : null}
          {card.views && card.pages ? <span className="opacity-40">•</span> : null}
          {card.pages ? <span>{card.pages} images</span> : null}
        </div>
      </div>
    </Link>
  );
}
