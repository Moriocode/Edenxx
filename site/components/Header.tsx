import Link from "next/link";
import GenreMenu from "@/components/GenreMenu";

const nav = [
  { href: "/", label: "Latest" },
  { href: "/browse", label: "Browse" },
  { href: "/tags", label: "Tags" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent2 text-lg shadow-lg shadow-accent/20">
            🦊
          </span>
          <span className="text-[19px] font-extrabold tracking-tight">
            KITSU<span className="text-accent">NE</span>
          </span>
        </Link>

        <GenreMenu />

        {/* Single nav element: inline on md+, a full-width scrollable strip on mobile
            so Browse/Tags stay reachable below the md breakpoint. */}
        <nav
          aria-label="Primary"
          className="flex w-full items-center gap-0.5 overflow-x-auto md:w-auto md:gap-1 md:overflow-x-visible"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-panel2 hover:text-white md:py-2 md:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          action="/search"
          className="flex w-full items-center gap-2 md:ml-auto md:w-auto md:max-w-md md:flex-1"
        >
          <label htmlFor="q" className="sr-only">
            Search comics
          </label>
          <div className="relative flex-1">
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Search comics, doujin, manhwa…"
              autoComplete="off"
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 pl-9 text-sm text-white placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-black transition hover:brightness-110"
          >
            Go
          </button>
        </form>
      </div>
    </header>
  );
}
