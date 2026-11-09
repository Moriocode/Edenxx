import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  analyticsConfigured,
  isAdmin,
  looksLikeBot,
  normalisePath,
  readStats,
  recordView,
  VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Hidden page-view counter.
 *
 * POST /api/visit  — called invisibly on every navigation; returns a boolean,
 *                    never the traffic numbers, unless the caller is an admin.
 * GET  /api/visit  — admin stats, requires `Authorization: Bearer <token>`.
 */

type Body = { path?: unknown; referrer?: unknown };

function isDuplicateKeyViolation(err: unknown) {
  return err instanceof Error && /NX|exists|duplicate/i.test(err.message);
}

export async function POST(request: Request) {
  if (!analyticsConfigured()) {
    // Nothing to count with; stay silent rather than erroring at the visitor's
    // console or spamming the function logs.
    return NextResponse.json(
      { ok: false, counted: false, reason: "analytics-not-configured" },
      { status: 202 },
    );
  }

  // Respect the browser's tracking preference and explicit opt-out.
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") {
    return NextResponse.json({ ok: true, counted: false, reason: "do-not-track" });
  }

  if (looksLikeBot(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, counted: false, reason: "bot" });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const path = normalisePath(body.path);

  const existing = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.slice(VISITOR_COOKIE.length + 1);

  let visitorId = existing && /^[a-f0-9-]{16,64}$/i.test(existing) ? existing : "";
  const isNewVisitor = !visitorId;
  if (!visitorId) visitorId = randomUUID();

  let counted = false;
  let total: number | undefined;
  let uniques: number | undefined;
  let reason: string | undefined;

  try {
    const result = await recordView({
      visitorId,
      path,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 200) : "",
    });
    counted = result.counted;
    total = result.total;
    uniques = result.uniques;
    reason = result.reason;
  } catch (err) {
    if (!isDuplicateKeyViolation(err)) {
      // Analytics must never surface to the visitor or break the page.
      return NextResponse.json({ ok: false, counted: false, reason: "store-unavailable" });
    }
    counted = false;
    reason = "duplicate";
  }

  const response = NextResponse.json(
    // Numbers are only exposed to a caller holding the admin token; an ordinary
    // visitor learns nothing about traffic apart from "recorded / not recorded".
    isAdmin(request)
      ? { ok: true, counted, reason, total, uniques, path }
      : { ok: true, counted, reason },
    { status: 200 },
  );

  if (isNewVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions());
  }
  // Never let this response be cached by a CDN or the browser.
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!analyticsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "analytics store is not configured" },
      { status: 503 },
    );
  }

  try {
    const stats = await readStats();
    return NextResponse.json(
      { ok: true, ...stats, checkedAt: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "stats unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
