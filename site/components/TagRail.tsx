import Link from "next/link";

type Tag = { slug: string; count?: number };

function label(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TagRail({
  title = "Popular tags",
  tags,
}: {
  title?: string;
  tags: Tag[];
}) {
  return (
    <section className="rounded-xl border border-line/70 bg-panel p-3">
      <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[12px] font-extrabold uppercase tracking-widest text-muted">
        <span className="h-3 w-1 rounded bg-accent" />
        {title}
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Link
            key={t.slug}
            href={`/tag/${t.slug}`}
            title={label(t.slug)}
            className="rounded-md border border-line bg-panel2 px-2 py-1 text-[11px] font-semibold text-white/75 transition hover:border-accent/60 hover:text-accent"
          >
            {label(t.slug)}
            {t.count ? <span className="ml-1 text-muted/60">{t.count}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
