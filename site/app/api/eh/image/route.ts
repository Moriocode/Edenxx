import { ehImageForPage } from "@/lib/sources/ehentai";

export const dynamic = "force-dynamic";

/**
 * Streams one E-Hentai reader page.
 *
 * E-Hentai page images are hotlink protected and carry expiring `keystamp`
 * URLs, so the browser cannot load them directly. This route resolves the
 * current image for (gallery, page), caches the bytes briefly and serves them
 * from our own origin.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const gid = (params.get("g") || "").replace(/\D/g, "");
  const token = (params.get("t") || "").toLowerCase().replace(/[^0-9a-f]/g, "");
  const page = Number(params.get("n"));

  if (!gid || !token || !Number.isFinite(page) || page < 1) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const image = await ehImageForPage(gid, token, page);
    if (!image) return new Response("Not found", { status: 404 });

    return new Response(new Blob([image.bytes], { type: image.type }), {
      headers: {
        "Content-Type": image.type,
        "Content-Length": String(image.bytes.byteLength),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Upstream error", { status: 502 });
  }
}
