import Link from "next/link";

function hrefFor(base: string, page: number, query?: string) {
  const params = new URLSearchParams(query || "");
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export default function Pager({
  page,
  maxPage,
  base = "/",
  query,
}: {
  page: number;
  maxPage: number;
  base?: string;
  query?: string;
}) {
  const last = Math.max(1, Math.min(maxPage, 5000));
  const windowStart = Math.max(1, Math.min(page - 2, last - 4));
  const windowEnd = Math.min(last, windowStart + 4);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  const cls = "rounded-md border px-3 py-1.5 text-sm font-semibold transition";
  const idle = "border-line bg-panel text-white/75 hover:border-accent/60 hover:text-accent";
  const active = "border-accent bg-accent text-black";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(base, page - 1, query)} className={`${cls} ${idle}`}>
          ← Prev
        </Link>
      ) : null}

      {windowStart > 1 ? (
        <>
          <Link href={hrefFor(base, 1, query)} className={`${cls} ${idle}`}>
            1
          </Link>
          {windowStart > 2 ? <span className="px-1 text-muted">…</span> : null}
        </>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(base, p, query)}
          aria-current={p === page ? "page" : undefined}
          className={`${cls} ${p === page ? active : idle}`}
        >
          {p}
        </Link>
      ))}

      {windowEnd < last ? (
        <>
          {windowEnd < last - 1 ? <span className="px-1 text-muted">…</span> : null}
          <Link href={hrefFor(base, last, query)} className={`${cls} ${idle}`}>
            {last}
          </Link>
        </>
      ) : null}

      {page < last ? (
        <Link href={hrefFor(base, page + 1, query)} className={`${cls} ${idle}`}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
