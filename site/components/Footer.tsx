import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

const links = [
  { href: "/genres", label: "Genres" },
  { href: "/tags", label: "Tags" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/terms#dmca", label: "Rights-holder notices" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line/70 bg-panel/40">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-8 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="font-semibold text-white/70 transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-white/70 transition hover:text-accent"
          >
            Contact
          </a>

        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">
            {SITE_NAME.toUpperCase()} — adult comics, doujin &amp; manhwa reader
          </p>
          <p className="max-w-xl leading-relaxed text-muted/80">
            All comics and artwork are retrieved from third-party sources and remain the property of
            their respective authors. This site indexes and displays artwork only; it hosts no files.
            If you are an artist or rights holder and want something removed, see our{" "}
            <Link href="/terms#dmca" className="text-accent hover:underline">
              rights-holder notice
            </Link>{" "}
            process. 18+ only.
          </p>
        </div>
      </div>
    </footer>
  );
}
