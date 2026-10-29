export const dynamic = "force-dynamic";

/**
 * Streams one Hitomi image (cover, thumbnail or reader page).
 *
 * The gold-usergeneratedcontent.net CDN answers 404 to any request without
 * `Referer: https://hitomi.la`, so a browser loading these URLs directly would
 * always fail. This route re-sends the required Referer server-side and
 * streams the bytes back from our own origin — the same pattern as
 * /api/eh/image for E-Hentai.
 *
 * Only the known CDN host is accepted (never an arbitrary upstream), so the
 * route cannot be used as an open proxy.
 */

const ALLOWED_HOST = "gold-usergeneratedcontent.net";
const PATH_RE = /^\/[A-Za-z0-9/._-]+\.(?:webp|avif|jxl|jpg|jpeg|png)$/i;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") || "";

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const hostOk =
    target.protocol === "https:" &&
    (target.hostname === ALLOWED_HOST || target.hostname.endsWith(`.${ALLOWED_HOST}`));

  if (!hostOk || !PATH_RE.test(target.pathname)) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const upstream = await fetch(target.href, {
      headers: {
        // Required by the CDN; a foreign or missing Referer returns 404.
        Referer: "https://hitomi.la",
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(upstream.status === 404 ? "Not found" : "Upstream error", {
        status: upstream.status === 404 ? 404 : 502,
      });
    }

    const type = upstream.headers.get("content-type") || "image/webp";
    const headers: Record<string, string> = {
      "Content-Type": type,
      // Content-addressed bytes never change, so cache them hard.
      "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
    };
    const length = upstream.headers.get("content-length");
    if (length) headers["Content-Length"] = length;

    return new Response(upstream.body, { headers });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Upstream error", { status: 502 });
  }
}
