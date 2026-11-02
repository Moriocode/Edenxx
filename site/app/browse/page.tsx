import type { Metadata } from "next";
import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import { listLatest, popularTags } from "@/lib/source";
import { listingMeta } from "@/lib/seo";

export const revalidate = 600;

export const metadata: Metadata = listingMeta({
  title: "Browse the catalogue",
  description:
    "Every adult comic, doujin and manhwa in the index, newest first — free to read online.",
  path: "/browse",
});

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  try {
    const [listing, tags] = await Promise.all([listLatest(page), popularTags(24)]);
    return (
      <ListingView
        title="Browse the catalogue"
        subtitle="Every comic in the index, newest first"
        listing={listing}
        base="/browse"
        tags={tags}
      />
    );
  } catch (err) {
    return (
      <Notice
        message="Couldn't load the catalogue right now."
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}
