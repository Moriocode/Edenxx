import { NextResponse, type NextRequest } from "next/server";
import { AGE_COOKIE, AGE_GATE_PATH } from "@/lib/compliance";
import { isBlockedTag } from "@/lib/moderation";
import { takedownForPath, type TakedownEntry } from "@/lib/takedowns";

/**
 * Request-level compliance gate.
 *
 * Runs before any page renders, which is what makes both policies real:
 *
 *  - A taken-down gallery (or a blocklisted tag) never reaches React at all.
 *    Middleware answers with a proper 404/451 document, so a cached RSC payload
 *    or a stale sitemap cannot keep serving it.
 *  - A visitor without the age-confirmation cookie is rewritten to /age-check.
 *    Gallery thumbnails, titles and reader pages are therefore absent from the
 *    HTML entirely — not hidden behind an overlay.
 *
 * Legal pages (/dmca, /terms, /privacy), API routes and static assets in turn
 * sit behind the gate like everything else: the only document a new visitor can
 * open is the age confirmation, and the takedown and policy pages are reachable
 * from the site footer once they have entered.
 */

const GONE_STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px;
    background: #121212; color: #ededed;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  }
  main { width: 100%; max-width: 520px; border: 1px solid #2a2a2a; background: #1e1e1e;
    border-radius: 14px; padding: 32px; text-align: center; }
  p.code { margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: #d0617a; }
  h1 { margin: 0 0 10px; font-size: 20px; letter-spacing: -.01em; }
  p { margin: 0 0 14px; font-size: 13.5px; line-height: 1.65; color: #9e9e9e; }
  .links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
  a { display: inline-block; padding: 9px 14px; border-radius: 8px; font-size: 12.5px;
    font-weight: 700; text-decoration: none; border: 1px solid #2a2a2a; color: #ededed; }
  a.primary { background: #d0617a; border-color: #d0617a; color: #170b0f; }
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character] ?? character;
  });
}

function gonePage({
  status,
  heading,
  body,
  reason,
}: {
  status: 404 | 451;
  heading: string;
  body: string;
  reason?: string;
}): NextResponse {
  const detail = reason
    ? `<p><strong style="color:#d4d4d4">Reference:</strong> ${escapeHtml(reason)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${status} — erofox</title>
<style>${GONE_STYLE}</style>
</head>
<body>
<main>
  <p class="code">${status}</p>
  <h1>${escapeHtml(heading)}</h1>
  <p>${escapeHtml(body)}</p>
  ${detail}
  <div class="links">
    <a class="primary" href="/">Back to latest</a>
    <a href="/dmca">Takedown policy</a>
  </div>
</main>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function takedownResponse(entry: TakedownEntry): NextResponse {
  const status = entry.status === 404 ? 404 : 451;
  return gonePage({
    status,
    heading: status === 451 ? "Unavailable for legal reasons" : "Not found",
    body: "This gallery has been removed from the index following a takedown request, so it can no longer be browsed here.",
    reason: entry.reason,
  });
}

/** True when the URL is a tag page whose tag is on the moderation blocklist. */
function blockedTagIn(pathname: string): boolean {
  const match = pathname.match(/^\/tag\/([^/]+)\/?$/);
  if (!match) return false;
  let slug = match[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* malformed escape: test the raw segment */
  }
  return isBlockedTag(slug);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Takedowns take precedence over everything, including the age gate.
  const takedown = takedownForPath(pathname);
  if (takedown) return takedownResponse(takedown);

  // 2. Tags the moderation blocklist forbids have no index page at all.
  if (blockedTagIn(pathname)) {
    return gonePage({
      status: 404,
      heading: "Not found",
      body: "That tag is not indexed on this site.",
    });
  }

  // 3. Age verification: the gate is the only page an unverified visitor sees.
  if (pathname === AGE_GATE_PATH) return NextResponse.next();
  if (request.cookies.get(AGE_COOKIE)?.value === "1") return NextResponse.next();

  const gate = request.nextUrl.clone();
  gate.pathname = AGE_GATE_PATH;
  gate.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.rewrite(gate);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
