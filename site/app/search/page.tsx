import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import TagRail from "@/components/TagRail";
import { popularTags, searchComics } from "@/lib/source";

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  if (!q) {
    const tags = await popularTags(24).catch(() => []);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-xl font-extrabold tracking-tight">Search</h1>
        <p className="text-sm text-muted">
          Type a title, tag or artist in the bar above — or start from a popular tag.
        </p>
        <TagRail title="Try a tag" tags={tags} />
      </div>
    );
  }

  try {
    const [listing, tags] = await Promise.all([searchComics(q, page), popularTags(24)]);
    return (
      <ListingView
        title={`Results for “${q}”`}
        subtitle="Titles and tags matching your query"
        listing={listing}
        base="/search"
        query={`q=${encodeURIComponent(q)}`}
        tags={tags}
      />
    );
  } catch (err) {
    return (
      <Notice
        message={`Search for “${q}” failed — the source may be temporarily unavailable.`}
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }
}
