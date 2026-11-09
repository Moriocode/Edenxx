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

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(base, page - 1, query)} className="btn" rel="prev">
          ← Prev
        </Link>
      ) : null}

      {windowStart > 1 ? (
        <>
          <Link href={hrefFor(base, 1, query)} className="btn w-9">
            1
          </Link>
          {windowStart > 2 ? (
            <span aria-hidden className="px-1 text-muted">
              …
            </span>
          ) : null}
        </>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(base, p, query)}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={`btn w-9 ${p === page ? "btn-primary" : ""}`}
        >
          {p}
        </Link>
      ))}

      {windowEnd < last ? (
        <>
          {windowEnd < last - 1 ? (
            <span aria-hidden className="px-1 text-muted">
              …
            </span>
          ) : null}
          <Link href={hrefFor(base, last, query)} className="btn w-9" aria-label={`Page ${last}`}>
            {last}
          </Link>
        </>
      ) : null}

      {page < last ? (
        <Link href={hrefFor(base, page + 1, query)} className="btn" rel="next">
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
