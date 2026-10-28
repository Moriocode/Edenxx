import type { SourceId } from "@/lib/source";
import { sourceChain, sourceFor, hdporncomicsHealth } from "@/lib/source";
import { hentaifoxHealth } from "@/lib/sources/hentaifox";
import { ehHealth } from "@/lib/sources/ehentai";

export type SourceAttempt<T> = {
  source: SourceId;
  ok: boolean;
  error?: string;
  result?: T;
  latencyMs: number;
};

/**
 * Ordered source chain.
 *
 * Start with one real source (hdporncomics). When another source is added and
 * verified live from this environment, add it to the list here and decide
 * whether fallback is per-route (better UX) or only on hard errors.
 */
export const SOURCE_CHAIN: SourceId[] = sourceChain();

export function activeSourceId(): SourceId {
  return sourceFor();
}

export async function withSource<T>(
  run: (source: SourceId) => Promise<T>,
  options?: { sources?: SourceId[]; stopOnSuccess?: boolean },
): Promise<{ value: T; attempts: SourceAttempt<T>[] }> {
  const list = options?.sources ?? SOURCE_CHAIN;
  const stopOnSuccess = options?.stopOnSuccess ?? true;

  const attempts: SourceAttempt<T>[] = [];
  for (const source of list) {
    const started = Date.now();
    let result: T | undefined;
    let error: string | undefined;
    let ok = false;
    try {
      result = await run(source);
      ok = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    attempts.push({ source, ok, error, result, latencyMs: Date.now() - started });
    if (ok && stopOnSuccess) break;
  }

  const first = attempts.find((a) => a.ok);
  if (!first) {
    throw new Error(
      `All ${attempts.length} source(s) failed: ${attempts.map((a) => `${a.source}: ${a.error}`).join("; ")}`,
    );
  }

  return { value: first.result!, attempts };
}

/**
 * Health for every source in the chain, in chain order.
 * Useful for /api/health or a future source-picker UI.
 */
export async function chainHealth() {
  const results = await Promise.all(
    sourceChain().map(async (id) => {
      const started = Date.now();
      let ok = false;
      let status: number | undefined;
      let error: string | undefined;
      let url = "";

      try {
        if (id === "hentaifox") {
          const h = await hentaifoxHealth();
          ok = h.ok;
          status = h.status;
          error = h.error;
          url = h.url;
        } else if (id === "ehentai") {
          const h = await ehHealth();
          ok = h.ok;
          status = h.status;
          error = h.error;
          url = h.url;
        } else if (id === "hdporncomics") {
          const h = await hdporncomicsHealth();
          ok = h.ok;
          status = h.status;
          error = h.error;
          url = h.url;
        } else {
          error = `No health probe wired for source “${id}” yet`;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      return {
        id,
        default: id === activeSourceId(),
        ok,
        url,
        status,
        latencyMs: Date.now() - started,
        error: error,
      };
    }),
  );

  return results;
}
