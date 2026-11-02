import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/seo";

/**
 * robots.txt: crawl everything that earns traffic (catalogue, detail, tag,
 * artist, genre pages) and skip plumbing — API routes, search result pages
 * (infinite thin combinations) and reader pages (each is a slice of a comic
 * already represented by its detail page).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/search", "/read/"],
      },
    ],
    sitemap: absUrl("/sitemap.xml"),
  };
}