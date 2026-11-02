import ListingView from "@/components/ListingView";
import JsonLd from "@/components/JsonLd";
import Notice from "@/components/Notice";
import { listLatest, popularTags } from "@/lib/source";
import { absUrl, SITE_NAME } from "@/lib/seo";

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
      <>
        {/* Sitelinks search box: lets Google surface site search directly. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: absUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${absUrl("/search")}?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <ListingView
          title="Latest comics"
        subtitle="Freshly indexed adult comics, doujin and manhwa"
        listing={listing}
        base="/"
          tags={tags}
        />
      </>
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
