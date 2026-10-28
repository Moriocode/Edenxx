import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import { listArtist, popularTags } from "@/lib/source";

export const revalidate = 600;

function pretty(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  try {
    const [listing, tags] = await Promise.all([listArtist(slug, page), popularTags(24)]);
    return (
      <ListingView
        title={pretty(slug)}
        subtitle="Comics by this artist"
        listing={listing}
        base={`/artist/${slug}`}
        tags={tags}
      />
    );
  } catch (err) {
    return (
      <Notice
        title="Artist not available"
        message={`Couldn't load comics by “${pretty(slug)}”.`}
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}
