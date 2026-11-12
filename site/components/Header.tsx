"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import GenreMenu from "@/components/GenreMenu";
import { SITE_NAME } from "@/lib/constants";

const NAV = [
  { href: "/", label: "Latest" },
  { href: "/browse", label: "Browse" },
  { href: "/tags", label: "Tags" },
] as const;

/** "/" only matches itself; every other entry also owns its children. */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // Any navigation closes the drawer, including same-page links.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/70">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <Image
            src="/erofox-mark.png"
            alt=""
            width={320}
            height={315}
            priority
            className="h-9 w-auto transition-transform duration-200 group-hover:scale-[1.06]"
          />
          <span className="flex flex-col">
            <span className="text-[17px] font-black lowercase leading-none tracking-[-0.03em] text-fg">
              {SITE_NAME}
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-muted">
              18+ comics
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                  active ? "text-fg" : "text-muted hover:bg-panel2 hover:text-fg"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <GenreMenu />
        </div>

        <form
          action="/search"
          role="search"
          className="ml-auto hidden w-full max-w-sm items-center gap-2 md:flex lg:max-w-md"
        >
          <div className="relative flex-1">
            <label htmlFor="q" className="sr-only">
              Search comics
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Search titles, tags, artists…"
              autoComplete="off"
              className="input py-2 pl-9 text-[13px]"
            />
          </div>
          <button type="submit" className="btn btn-primary h-9 shrink-0 px-3">
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="btn btn-icon ml-auto md:hidden"
        >
          {open ? (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="animate-menu-in border-t border-line bg-ink md:hidden">
          <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-4 sm:px-6">
            <form action="/search" role="search" className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <label htmlFor="q-mobile" className="sr-only">
                  Search comics
                </label>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="q-mobile"
                  name="q"
                  type="search"
                  placeholder="Search titles, tags, artists…"
                  autoComplete="off"
                  className="input py-2.5 pl-9 text-[13px]"
                />
              </div>
              <button type="submit" className="btn btn-primary h-10 shrink-0 px-3">
                Search
              </button>
            </form>

            <nav aria-label="Mobile" className="grid gap-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-panel2 text-fg" : "text-muted hover:bg-panel2 hover:text-fg"
                    }`}
                  >
                    {item.label}
                    {active ? (
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                  </Link>
                );
              })}
              <Link
                href="/genres"
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(pathname, "/genres")
                    ? "bg-panel2 text-fg"
                    : "text-muted hover:bg-panel2 hover:text-fg"
                }`}
              >
                Genres
                <span aria-hidden className="text-xs text-muted">
                  →
                </span>
              </Link>
            </nav>

            <div className="mt-4 border-t border-line pt-4">
              <p className="eyebrow mb-2">Jump to</p>
              <div className="flex flex-wrap gap-1.5">
                <Link href="/genres" className="chip">
                  All genres
                </Link>
                <Link href="/tags" className="chip">
                  Tag index
                </Link>
                <Link href="/privacy" className="chip">
                  Privacy
                </Link>
                <Link href="/terms" className="chip">
                  Terms
                </Link>
                <Link href="/dmca" className="chip">
                  DMCA
                </Link>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Adults only. Comics are indexed from third-party sources; this site hosts no files.
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
