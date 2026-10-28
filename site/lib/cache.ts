/**
 * Small in-process cache for scraped HTML.
 *
 * Four jobs:
 *  1. Avoid re-fetching the same upstream page within the TTL.
 *  2. Coalesce concurrent requests for the same URL into one fetch.
 *  3. Retry transient upstream failures with a short backoff.
 *  4. Serve the last good copy if a refresh fails ("stale-on-error"), because a
 *     slightly old page beats an error screen when a source hiccups.
 *
 * Deliberately process-local: no extra infrastructure, and pages are cheap to refill
 * after a restart.
 */

type Entry = {
  expiresAt: number;
  value: Promise<string>;
  /** Last successfully fetched body, kept past expiry so it can be served stale. */
  lastGood?: string;
  /** True until the fetch settles — only in-flight fetches may be joined. */
  pending: boolean;
};

type Stats = {
  hits: number;
  misses: number;
  coalesced: number;
  retries: number;
  staleServed: number;
  evictions: number;
};

type CacheState = {
  store: Map<string, Entry>;
  stats: Stats;
};

const MAX_ENTRIES = 300;
const STATE_KEY = "__kitsuneHtmlCache";

function state(): CacheState {
  const g = globalThis as unknown as Record<string, CacheState | undefined>;
  if (!g[STATE_KEY]) {
    g[STATE_KEY] = {
      store: new Map<string, Entry>(),
      stats: { hits: 0, misses: 0, coalesced: 0, retries: 0, staleServed: 0, evictions: 0 },
    };
  }
  return g[STATE_KEY]!;
}

function evictIfNeeded({ store, stats }: CacheState) {
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
    stats.evictions += 1;
  }
}

/** 4xx responses are permanent; anything else is worth one more attempt. */
function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = Number((msg.match(/responded (\d{3})/) || [])[1]);
  if (status) return status >= 500 || status === 429 || status === 408;
  return true; // network/timeout/DNS
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(loader: () => Promise<string>, attempts: number, stats: Stats) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await loader();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      stats.retries += 1;
      await sleep(250 * 2 ** i); // 250ms, 500ms, …
    }
  }
  throw lastErr;
}

export async function cachedHtml(
  key: string,
  loader: () => Promise<string>,
  ttlMs = 10 * 60 * 1000,
): Promise<string> {
  const { store, stats } = state();
  const now = Date.now();
  const hit = store.get(key);

  if (hit && hit.expiresAt > now) {
    stats.hits += 1;
    try {
      return await hit.value;
    } catch (err) {
      // A failed in-flight fetch must not be cached — fall back to the last good copy.
      store.delete(key);
      if (hit.lastGood) {
        stats.staleServed += 1;
        return hit.lastGood;
      }
      throw err;
    }
  }

  if (hit?.pending) {
    // Expired but still in flight: join it rather than stacking a second scrape.
    // A settled (non-pending) expired entry must NOT be returned here, or the page
    // would never refresh.
    stats.coalesced += 1;
    try {
      return await hit.value;
    } catch (err) {
      if (hit.lastGood) {
        stats.staleServed += 1;
        return hit.lastGood;
      }
      throw err;
    }
  }

  stats.misses += 1;
  const previous = hit?.lastGood;

  const entry: Entry = {
    expiresAt: now + ttlMs,
    pending: true,
    value: withRetry(loader, 3, stats).then(
      (html) => {
        entry.pending = false;
        entry.lastGood = html;
        return html;
      },
      (err) => {
        entry.pending = false;
        // Refresh failed: keep serving the previous body if we have one.
        if (previous) {
          entry.lastGood = previous;
          entry.expiresAt = Date.now() + Math.min(ttlMs, 60_000); // retry sooner than a full TTL
          stats.staleServed += 1;
          return previous;
        }
        store.delete(key);
        throw err;
      },
    ),
  };

  store.set(key, entry);
  evictIfNeeded(state());
  return entry.value;
}

export type CacheStats = {
  entries: number;
  fresh: number;
  staleAvailable: number;
  maxEntries: number;
  hits: number;
  misses: number;
  coalesced: number;
  retries: number;
  staleServed: number;
  evictions: number;
  hitRate: number;
};

export function cacheStats(): CacheStats {
  const { store, stats } = state();
  const now = Date.now();
  let live = 0;
  let staleAvailable = 0;
  for (const entry of store.values()) {
    if (entry.expiresAt > now) live += 1;
    if (entry.lastGood) staleAvailable += 1;
  }
  const lookups = stats.hits + stats.misses;
  return {
    entries: store.size,
    fresh: live,
    staleAvailable,
    maxEntries: MAX_ENTRIES,
    ...stats,
    hitRate: lookups === 0 ? 0 : Number((stats.hits / lookups).toFixed(3)),
  };
}

export function clearCache() {
  const { store, stats } = state();
  store.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.coalesced = 0;
  stats.retries = 0;
  stats.staleServed = 0;
  stats.evictions = 0;
}
