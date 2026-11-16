/**
 * Shared constants for the 18+ gate.
 *
 * The gate is enforced in middleware (a request without the confirmation
 * cookie is rewritten to /age-check), so gallery HTML never reaches the browser
 * before the visitor confirms their age. The cookie is first-party, readable by
 * the client (the gate page writes it), and scoped to the whole site.
 */

export const AGE_COOKIE = "erofox_age_ok";
export const AGE_GATE_PATH = "/age-check";

/** One year, in seconds. */
export const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Pages that stay public without age confirmation.
 *
 * Rights holders, compliance officers and hosting providers need to be able to
 * read the takedown process, the terms and the privacy policy immediately —
 * before clicking through anything — and none of these pages carries imagery.
 */
const PUBLIC_LEGAL_PREFIXES = ["/dmca", "/terms", "/privacy"];

export function isAgeGateExempt(pathname: string): boolean {
  return PUBLIC_LEGAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Reads one cookie out of a raw `Cookie` request header. */
export function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

/**
 * Guard for the image proxy routes (/api/eh/image, /api/hitomi/image).
 *
 * Those routes fetch upstream bytes on our behalf, so an open endpoint is a
 * bandwidth tap for anyone who finds the URL. A request is allowed when it
 * carries the age confirmation the reader already has, or when it demonstrably
 * comes from our own pages. Note the site sends `Referrer-Policy: no-referrer`,
 * so the cookie is the normal path and the Referer is the fallback.
 */
export function isProxyAllowed(request: Request): boolean {
  if (cookieValue(request.headers.get("cookie"), AGE_COOKIE) === "1") return true;

  // Compare hosts rather than full origins: behind a proxy the scheme and even
  // the host in `request.url` can differ from what the browser used, while the
  // Host header and the Referer always agree for a real same-site request.
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (!referer || !host) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

/** Only allow in-site redirect targets after the gate. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith(AGE_GATE_PATH)) return "/";
  return next;
}
