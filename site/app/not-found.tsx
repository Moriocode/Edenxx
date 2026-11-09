import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Latest comics" },
  { href: "/browse", label: "Browse the catalogue" },
  { href: "/tags", label: "Tag index" },
];

export default function NotFound() {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-line bg-panel p-8 text-center sm:p-10">
      <Image
        src="/erofox-mark.png"
        alt=""
        width={320}
        height={315}
        className="mx-auto h-14 w-auto opacity-90"
      />

      <p className="eyebrow mt-5 text-accent">404</p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        That comic, tag or page doesn&apos;t exist here. It may have been removed from the source,
        or the link is mistyped.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={i === 0 ? "btn btn-primary h-10 px-4 text-sm" : "btn h-10 px-4 text-sm"}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        Or search for a title in the bar at the top of the page.
      </p>
    </div>
  );
}
