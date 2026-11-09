/**
 * Hidden page-view analytics.
 *
 * Storage is any Upstash-Redis-compatible REST endpoint (Vercel KV, Upstash
 * directly, or a local mock). It is reached over plain `fetch`, so the site
 * gains no dependency and works from the Node or Edge runtime.
 *
 * What is stored: integer counters and a random, first-party visitor id. No IP,
 * no user agent, no referrer history and no per-visitor browsing trail is kept
 * beyond the short dedupe keys, which expire on their own.
 *
 * Env (either naming pair works):
 *   KV_REST_API_URL / KV_REST_API_TOKEN                    (Vercel KV)
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN      (Upstash direct)
 *   ANALYTICS_ADMIN_TOKEN                                  (read the numbers)
 */

const TOTAL_KEY = "pv:total";
const UNIQUE_KEY = "pv:uniques";
const PATHS_KEY = "pv:paths";
const PREFIX = "pv";

/** A repeat view of the same path inside this window is not counted again. */
const SESSION_TTL_SECONDS = 30 * 60;
/** A visitor counts as "unique" at most once per window. */
const UNIQUE_TTL_SECONDS = 24 * 60 * 60;

/** How long a single REST round trip may take before we give up silently. */
const REQUEST_TIMEOUT_MS = 3000;

export const VISITOR_COOKIE = "kv_vid";

type Command = (string | number)[];
type RedisReply = { result?: unknown; error?: string };

export function visitorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

function restUrl() {
  return (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
}

function restToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

export function analyticsConfigured() {
  return Boolean(restUrl() && restToken());
}

function adminToken() {
  return process.env.ANALYTICS_ADMIN_TOKEN || "";
}

/** Constant-ish time comparison so the admin token is not guessable by timing. */
export function isAdmin(request: Request) {
  const expected = adminToken();
  if (!expected) return false;

  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (provided.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Runs a batch of commands in one HTTP request (Upstash `/pipeline`).
 * Replies come back in the same order, each `{ result }` or `{ error }`.
 */
async function redis(commands: Command[]): Promise<RedisReply[]> {
  const res = await fetch(`${restUrl()}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${restToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`analytics store responded ${res.status}`);
  }

  const json: unknown = await res.json();
  const replies = Array.isArray(json) ? (json as RedisReply[]) : [json as RedisReply];
  const failed = replies.find((reply) => reply?.error);
  if (failed) throw new Error(`analytics store error: ${failed.error}`);
  return replies;
}

function asNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Cache-key-safe, fixed-length digest of the path. */
function pathKey(path: string) {
  return encodeURIComponent(path.toLowerCase()).slice(0, 120);
}

const BOT_UA =
  /bot|crawler|spider|crawling|headless|phantomjs|slurp|bingpreview|facebookexternalhit|curl\/|wget\/|python-requests|axios\/|go-http-client|monitor|uptime|ahrefs|semrush|dataprovider/i;

export function looksLikeBot(userAgent: string | null) {
  return !userAgent || BOT_UA.test(userAgent);
}

/** Accepts only same-site paths; anything else is recorded as "/". */
export function normalisePath(raw: unknown) {
  if (typeof raw !== "string") return "/";
  const path = raw.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/") || path.length > 300) return "/";
  return path;
}

export type ViewResult = {
  counted: boolean;
  reason?: "duplicate" | "unconfigured";
  total?: number;
  uniques?: number;
};

/**
 * Records one page view for a visitor.
 *
 * Order matters: the dedupe key is claimed first, so two requests racing from
 * the same visitor cannot both count. Every key carries a TTL, so the store
 * self-cleans and never grows into a log of visits.
 */
export async function recordView(input: {
  visitorId: string;
  path: string;
  referrer?: string;
}): Promise<ViewResult> {
  if (!analyticsConfigured()) return { counted: false, reason: "unconfigured" };

  const sessionKey = `${PREFIX}:s:${input.visitorId}:${pathKey(input.path)}`;
  const claimed = await redis([["SET", sessionKey, "1", "NX", "EX", String(SESSION_TTL_SECONDS)]]);

  if (claimed[0]?.result !== "OK") {
    // Same visitor, same page, inside the window: not a new view.
    const [total, uniques] = await redis([
      ["GET", TOTAL_KEY],
      ["GET", UNIQUE_KEY],
    ]);
    return {
      counted: false,
      reason: "duplicate",
      total: asNumber(total?.result),
      uniques: asNumber(uniques?.result),
    };
  }

  const visitorKey = `${PREFIX}:v:${input.visitorId}`;
  const replies = await redis([
    ["INCR", TOTAL_KEY],
    ["ZINCRBY", PATHS_KEY, "1", input.path],
    ["SET", visitorKey, "1", "NX", "EX", String(UNIQUE_TTL_SECONDS)],
  ]);

  const total = asNumber(replies[0]?.result);
  const isNewVisitor = replies[2]?.result === "OK";

  let uniques: number | undefined;
  if (isNewVisitor) {
    const [inc] = await redis([["INCR", UNIQUE_KEY]]);
    uniques = asNumber(inc?.result);
  } else {
    const [get] = await redis([["GET", UNIQUE_KEY]]);
    uniques = asNumber(get?.result);
  }

  return { counted: true, total, uniques };
}

export type AnalyticsStats = {
  total: number;
  uniques: number;
  topPaths: { path: string; views: number }[];
  dedupeWindowMinutes: number;
  uniqueWindowHours: number;
};

/** Administrative read: totals plus the busiest paths. */
export async function readStats(): Promise<AnalyticsStats> {
  if (!analyticsConfigured()) throw new Error("analytics store is not configured");

  const [total, uniques, top] = await redis([
    ["GET", TOTAL_KEY],
    ["GET", UNIQUE_KEY],
    ["ZREVRANGE", PATHS_KEY, "0", "19", "WITHSCORES"],
  ]);

  const flat = Array.isArray(top?.result) ? (top.result as unknown[]) : [];
  const topPaths: { path: string; views: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    topPaths.push({ path: String(flat[i]), views: asNumber(flat[i + 1]) ?? 0 });
  }

  return {
    total: asNumber(total?.result) ?? 0,
    uniques: asNumber(uniques?.result) ?? 0,
    topPaths,
    dedupeWindowMinutes: SESSION_TTL_MINUTES(),
    uniqueWindowHours: UNIQUE_TTL_SECONDS / 3600,
  };
}

function SESSION_TTL_MINUTES() {
  return SESSION_TTL_SECONDS / 60;
}
