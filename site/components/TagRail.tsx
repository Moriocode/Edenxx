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
    <section className="surface p-3.5">
      <h2 className="eyebrow mb-2.5 flex items-center gap-2 px-0.5">
        <span aria-hidden className="h-3 w-0.5 rounded-full bg-accent" />
        {title}
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Link key={t.slug} href={`/tag/${t.slug}`} title={label(t.slug)} className="chip">
            {label(t.slug)}
            {t.count ? <span className="text-muted/60">{t.count}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
