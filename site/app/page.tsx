import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import { listLatest, popularTags } from "@/lib/source";

export const revalidate = 600;

export default async function HomePage({
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
        title="Latest comics"
        subtitle="Freshly indexed adult comics, doujin and manhwa"
        listing={listing}
        base="/"
        tags={tags}
      />
    );
  } catch (err) {
    return (
      <Notice
        message="Couldn't reach the comic source. It may be rate-limiting or briefly offline — try again in a moment."
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}
