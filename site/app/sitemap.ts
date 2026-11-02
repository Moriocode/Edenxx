import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/seo";
import { popularTags } from "@/lib/source";

export const revalidate = 86400; // rebuild daily

/**
 * Sitemap: stable routes plus the most popular tag pages (the site's main
 * entry points from search). Tag data comes from the active source, so a
 * source hiccup must never break the sitemap — failures degrade to the
 * static routes only.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: absUrl("/browse"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absUrl("/genres"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absUrl("/tags"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: absUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let tagRoutes: MetadataRoute.Sitemap = [];
  try {
    const tags = await popularTags(60);
    tagRoutes = tags.map((tag) => ({
      url: absUrl(`/tag/${tag.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch {
    // Tags are enrichment only.
  }

  return [...staticRoutes, ...tagRoutes];
}
