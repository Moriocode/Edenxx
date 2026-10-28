import Notice from "@/components/Notice";
import Reader from "@/components/Reader";
import { getComic } from "@/lib/source";

export const revalidate = 600;

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialPage = Math.max(1, Number(sp.page) || 1);
  const path = "/" + slug.join("/") + "/";

  let comic;
  try {
    comic = await getComic(path);
  } catch (err) {
    return (
      <Notice
        title="Reader unavailable"
        message="This comic couldn't be loaded from the source."
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }

  if (comic.images.length === 0) {
    return (
      <Notice
        title="No pages found"
        message="The source didn't return any readable pages for this comic. It may have been removed."
      />
    );
  }

  return (
    <Reader
      title={comic.title}
      images={comic.images}
      backHref={`/comic/${comic.slug}`}
      initialPage={initialPage}
    />
  );
}
