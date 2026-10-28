import Link from "next/link";
import type { Metadata } from "next";
import { GENRE_GROUPS } from "@/lib/genres";

export const metadata: Metadata = {
  title: "Genres — Kitsune",
  description: "Browse adult comics by genre: doujinshi, manhwa, yaoi, yuri, futanari and more.",
};

export default function GenresPage() {
  return (
    <div className="space-y-8">
      <header className="border-b border-line/70 pb-3">
        <h1 className="text-xl font-extrabold tracking-tight">Genres</h1>
        <p className="mt-0.5 text-xs text-muted">
          Pick a genre to jump straight into matching comics. 18+ only.
        </p>
      </header>

      {GENRE_GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-muted">
            <span className="h-3 w-1 rounded bg-accent" />
            {group.title}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {group.genres.map((genre) => (
              <Link
                key={genre.slug}
                href={`/tag/${genre.slug}`}
                className="rounded-lg border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:border-accent/60 hover:bg-panel2 hover:text-accent"
              >
                {genre.label}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted">
        Looking for something more specific? The{" "}
        <Link href="/tags" className="font-semibold text-accent hover:underline">
          full tag index
        </Link>{" "}
        lists every tag the sources publish.
      </p>
    </div>
  );
}
