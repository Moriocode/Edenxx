import type { Metadata } from "next";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  title: "Age verification",
  robots: { index: false, follow: false },
};

/**
 * Middleware rewrites every unverified request here, so this page is the only
 * document the server sends until the visitor confirms they are an adult.
 */
export default async function AgeCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;

  return <AgeGate next={next ?? "/"} />;
}
