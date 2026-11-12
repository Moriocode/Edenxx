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
 * Pages that must stay reachable without age confirmation: rights holders and
 * regulators need the DMCA/legal text, and none of it contains imagery.
 */
const EXEMPT_PREFIXES = ["/dmca", "/terms", "/privacy"];

export function isAgeGateExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Only allow in-site redirect targets after the gate. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith(AGE_GATE_PATH)) return "/";
  return next;
}
