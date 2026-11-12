import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingView from "@/components/ListingView";
import Notice from "@/components/Notice";
import { isBlockedTag } from "@/lib/moderation";
import { listTag, popularTags } from "@/lib/source";
import { listingMeta } from "@/lib/seo";

export const revalidate = 600;

function pretty(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = pretty(slug);
  return listingMeta({
    title: `${name} comics`,
    description: `Read ${name} comics online for free — browse the latest doujin, manga and manhwa tagged ${slug.replace(/-/g, " ")}.`,
    path: `/tag/${slug}`,
  });
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

  // Blocklisted tags have no index page at all.
  if (isBlockedTag(slug)) notFound();

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
