import Link from "next/link";

const links = [
  { href: "/", label: "Latest comics" },
  { href: "/browse", label: "Browse the catalogue" },
  { href: "/tags", label: "Tag index" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-line bg-panel p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-accent2 text-2xl">
        🦊
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        That comic, tag or page doesn&apos;t exist here. It may have been removed from the source,
        or the link is mistyped.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              i === 0
                ? "rounded-lg bg-accent px-4 py-2 text-sm font-extrabold text-black transition hover:brightness-110"
                : "rounded-lg border border-line px-4 py-2 text-sm font-bold text-white/80 transition hover:border-accent/60 hover:text-accent"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        Or search for a title in the bar at the top of the page.
      </p>
    </div>
  );
}