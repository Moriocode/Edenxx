import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import { listTag, popularTags } from "@/lib/source";

export const revalidate = 600;

function pretty(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function TagPage({
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
    const [listing, tags] = await Promise.all([listTag(slug, page), popularTags(24)]);
    return (
      <ListingView
        title={pretty(slug)}
        subtitle={`Comics tagged “${slug.replace(/-/g, " ")}”`}
        listing={listing}
        base={`/tag/${slug}`}
        tags={tags}
      />
    );
  } catch (err) {
    return (
      <Notice
        title="Tag not available"
        message={`Couldn't load comics tagged “${pretty(slug)}”.`}
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}
