import type { SourceId } from "@/lib/source";

/**
 * Hidden source router.
 *
 * The site presents one catalogue and never shows which upstream answered. This
 * module is the "auto picker": it remembers which sources answered, takes a
 * failing source out of rotation for a growing cooldown, and puts it back the
 * moment it works again. No UI control, no visible source labels.
 *
 * Rules:
 *  - A source needs FAILURE_THRESHOLD consecutive failures before it is rested.
 *    One flaky request shouldn't flip the whole catalogue.
 *  - While rested it is skipped entirely, so the user never pays its timeout.
 *  - Cooldown starts at 60s and doubles on each consecutive outage (max 10min).
 *    That keeps a long outage from costing a retry every minute, while a blip
 *    costs at most a minute away.
 *  - Any success resets the record, so the site drifts back to the preferred
 *    source (the head of the canonical chain) on its own.
 *
 * State lives on globalThis so Fast Refresh / module reloads in dev don't reset
 * it mid-session.
 */

type SourceRecord = {
  failures: number;
  /** How many times in a row this source has been taken out of rotation. */
  strikes: number;
  downUntil: number;
  lastError?: string;
  lastFailureAt: number;
};

type RouterState = {
  records: Partial<Record<SourceId, SourceRecord>>;
  lastGood?: SourceId;
  switches: number;
  lastSwitchAt?: number;
};

const STATE_KEY = "__kitsuneSourceRouter";
export const FAILURE_THRESHOLD = 2;
export const BASE_COOLDOWN_MS = 60_000;
export const MAX_COOLDOWN_MS = 10 * 60_000;
const FAILURE_WINDOW_MS = 5 * 60_000;

function state(): RouterState {
  const g = globalThis as unknown as Record<string, RouterState | undefined>;
  if (!g[STATE_KEY]) g[STATE_KEY] = { records: {}, switches: 0 };
  return g[STATE_KEY]!;
}

function recordFor(id: SourceId): SourceRecord {
  const s = state();
  if (!s.records[id]) {
    s.records[id] = { failures: 0, strikes: 0, downUntil: 0, lastFailureAt: 0 };
  }
  return s.records[id]!;
}

function coolingDown(id: SourceId, now = Date.now()): boolean {
  return (state().records[id]?.downUntil ?? 0) > now;
}

export function noteSuccess(id: SourceId) {
  const s = state();
  const record = recordFor(id);
  record.failures = 0;
  record.strikes = 0;
  record.downUntil = 0;
  record.lastError = undefined;

  if (s.lastGood !== id) {
    s.lastGood = id;
    s.switches += 1;
    s.lastSwitchAt = Date.now();
  }
}

export function noteFailure(id: SourceId, error: string) {
  const record = recordFor(id);
  const now = Date.now();

  if (now - record.lastFailureAt > FAILURE_WINDOW_MS) record.failures = 0;
  record.failures += 1;
  record.lastFailureAt = now;
  record.lastError = error;

  if (record.failures >= FAILURE_THRESHOLD && record.downUntil <= now) {
    record.strikes += 1;
    const cooldown = Math.min(BASE_COOLDOWN_MS * 2 ** (record.strikes - 1), MAX_COOLDOWN_MS);
    record.downUntil = now + cooldown;
  }
}

/**
 * Order to try for one request: the preferred source first, failing sources last.
 *
 * The canonical head stays preferred while it is healthy, so the site always
 * drifts back to it after a blip. Only when the head is resting does the last
 * source that actually answered get promoted — and the resting sources remain at
 * the tail as a last resort, so a bad heuristic can never make every source
 * unavailable.
 */
export function routeOrder(canonical: SourceId[]): SourceId[] {
  if (canonical.length <= 1) return [...canonical];

  const now = Date.now();
  const head = canonical[0];
  if (!coolingDown(head, now)) return [...canonical];

  const healthy = canonical.filter((id) => !coolingDown(id, now));
  const resting = canonical.filter((id) => coolingDown(id, now));
  const good = state().lastGood;
  const preferred =
    good && good !== head && healthy.includes(good) ? [good, ...healthy.filter((id) => id !== good)] : healthy;

  return [...preferred, ...resting];
}

export type RoutingSnapshot = {
  lastGood?: SourceId;
  switches: number;
  lastSwitchAt?: string;    sources: {
      id: SourceId;
      state: "ok" | "cooling";
    failures: number;
    retryInMs: number;
    lastError?: string;
  }[];
};

export function routingSnapshot(canonical: SourceId[]): RoutingSnapshot {
  const s = state();
  const now = Date.now();

  return {
    lastGood: s.lastGood,
    switches: s.switches,
    lastSwitchAt: s.lastSwitchAt ? new Date(s.lastSwitchAt).toISOString() : undefined,
    sources: canonical.map((id) => {
      const record = s.records[id];
      const retryInMs = Math.max(0, (record?.downUntil ?? 0) - now);
      const cooling = retryInMs > 0;
      return {
        id,
        state: cooling ? ("cooling" as const) : ("ok" as const),
        failures: record?.failures ?? 0,
        retryInMs,
        lastError: cooling ? record?.lastError : undefined,
      };
    }),
  };
}
