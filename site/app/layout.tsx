import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — adult comics, doujin & manhwa reader`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "adult comics",
    "doujinshi reader",
    "read manga online",
    "adult manhwa",
    "doujin online",
    "comic reader 18+",
    "artist tag browsing",
  ],
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — adult comics, doujin & manhwa reader`,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — adult comics, doujin & manhwa reader`,
    description: DEFAULT_DESCRIPTION,
  },
  // Upstream image hosts (HentaiFox's i3 CDN) answer 403 when a foreign Referer
  // is sent and 200 when there is none, so pages must never send one.
  referrer: "no-referrer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-white/90 antialiased">
        <AgeGate />
        <Header />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
