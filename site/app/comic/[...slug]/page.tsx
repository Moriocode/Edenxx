import Link from "next/link";
import ComicCard from "@/components/ComicCard";
import Notice from "@/components/Notice";
import { getComic } from "@/lib/source";

export const revalidate = 600;

function pretty(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const name = pretty(slug.join("/"));
  return { title: `${name} — Kitsune` };
}

export default async function ComicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = "/" + slug.join("/") + "/";

  let comic;
  try {
    comic = await getComic(path);
  } catch (err) {
    return (
      <Notice
        title="Comic unavailable"
        message="This comic couldn't be loaded from the source. It may have been removed or the source is offline."
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }

  return (
    <div className="space-y-10">
      <nav className="flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span className="opacity-40">/</span>
        <span className="text-white/70">{comic.title}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-line bg-black">
            {comic.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comic.cover}
                alt={comic.title}
                referrerPolicy="no-referrer"
                className="w-full object-cover"
              />
            ) : (
              <div className="card-cover grid place-items-center text-4xl opacity-30">🦊</div>
            )}
          </div>

          <Link
            href={`/read/${comic.slug}`}
            className="block rounded-lg bg-accent px-4 py-3 text-center text-sm font-extrabold text-black transition hover:brightness-110"
          >
            Read comic · {comic.images.length} pages
          </Link>
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{comic.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>{comic.images.length} pages</span>
            {comic.views ? (
              <>
                <span className="opacity-40">•</span>
                <span>{comic.views} views</span>
              </>
            ) : null}
            <span className="opacity-40">•</span>
            <span>Full colour gallery</span>
          </div>

          {comic.artists.length > 0 ? (
            <div className="mt-5">
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
                Artist
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {comic.artists.map((a) => (
                  <Link
                    key={a}
                    href={`/artist/${a.toLowerCase().replace(/\s+/g, "-")}`}
                    className="rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[12px] font-semibold text-accent transition hover:bg-accent hover:text-black"
                  >
                    {a}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {comic.tags.length > 0 ? (
            <div className="mt-5">
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {comic.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/tag/${t.toLowerCase().replace(/\s+/g, "-")}`}
                    className="rounded-md border border-line bg-panel2 px-2.5 py-1 text-[12px] font-semibold text-white/75 transition hover:border-accent/60 hover:text-accent"
                  >
                    {t.replace(/^[a-z]+:/, "").replace(/\+/g, " ")}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs leading-relaxed text-muted">
              Read from page 1 with keyboard and click navigation, or jump straight to any page below.
              Artwork is loaded from the original source and credits belong to the original author.
            </p>
          </div>
        </div>
      </div>

      {comic.images.length > 0 ? (
        <section>
          <h2 className="mb-3 border-b border-line/70 pb-2 text-sm font-extrabold uppercase tracking-widest text-muted">
            Pages
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {comic.images.map((src, i) => (
              <Link
                key={src}
                href={`/read/${comic.slug}?page=${i + 1}`}
                className="group relative overflow-hidden rounded-lg border border-line bg-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Page ${i + 1}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="h-full w-full object-cover opacity-85 transition group-hover:scale-105 group-hover:opacity-100"
                />
                <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                  {i + 1}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {comic.related.length > 0 ? (
        <section>
          <h2 className="mb-3 border-b border-line/70 pb-2 text-sm font-extrabold uppercase tracking-widest text-muted">
            More like this
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
            {comic.related.map((c) => (
              <ComicCard key={c.url} card={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
