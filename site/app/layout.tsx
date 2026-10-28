import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kitsune — adult comics, doujin & manhwa reader",
  description:
    "Browse and read adult comics, doujin and manhwa. Tag and artist browsing, instant reader.",
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
