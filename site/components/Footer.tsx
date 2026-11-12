import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

const browse = [
  { href: "/", label: "Latest" },
  { href: "/browse", label: "Browse catalogue" },
  { href: "/genres", label: "Genres" },
  { href: "/tags", label: "Tag index" },
];

const site = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/dmca", label: "DMCA & takedowns" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-panel/30">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-12">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/erofox-mark.png"
                alt=""
                width={320}
                height={315}
                className="h-8 w-auto"
              />
              <span className="text-[15px] font-black lowercase tracking-[-0.02em] text-fg">
                {SITE_NAME}
              </span>
              <span className="rounded-md border border-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                18+
              </span>
            </div>

            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">
              Adult comics, doujin and manhwa indexed from third-party sources. Artwork remains the
              property of its authors; this site hosts no files.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block text-xs font-semibold text-fg/80 transition-colors hover:text-accent"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <nav aria-label="Browse">
            <p className="eyebrow mb-3">Browse</p>
            <ul className="space-y-2 text-[13px]">
              {browse.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Site">
            <p className="eyebrow mb-3">Site</p>
            <ul className="space-y-2 text-[13px]">
              {site.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-muted transition-colors hover:text-fg"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-[11px] leading-relaxed text-muted">
          <span className="font-semibold text-fg/85">18 U.S.C. § 2257 Exemption Notice.</span>{" "}
          {SITE_NAME} contains solely fictional, illustrated depictions — drawings, comics and
          computer-generated artwork. No actual human beings are depicted, and we produce, commission
          or host no such depictions, so this index is exempt from the record-keeping requirements of
          18 U.S.C. § 2257 and 28 C.F.R. Part 75. Every character is presented as an adult. See the{" "}
          <Link
            href="/dmca"
            className="font-semibold text-fg/80 underline decoration-line underline-offset-2 hover:text-accent"
          >
            takedown policy
          </Link>{" "}
          for copyright and content reports.
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_NAME}. All rights to featured artwork belong to their respective owners.
          </p>
          <p className="text-muted/80">Adults only · not directed to anyone under 18</p>
        </div>
      </div>
    </footer>
  );
}
