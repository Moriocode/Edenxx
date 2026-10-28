/**
 * Focused checks for the HTML cache. Run with: npm run test:cache
 *
 * Exercises the behaviour that matters on a flaky upstream: successful caching,
 * retry with backoff, stale-on-error, and no retry for permanent 404s.
 */
import { cacheStats, cachedHtml, clearCache } from "../lib/cache.ts";

let failures = 0;

function check(name: string, cond: boolean, extra = "") {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

const fail = (n: number) => {
  const err = new Error(`Upstream responded ${n} for test`);
  return err;
};

async function main() {
  clearCache();

  // 1. Caching: the loader runs once for a fresh entry.
  let calls = 0;
  const a1 = await cachedHtml("t:cache", async () => {
    calls += 1;
    return "body-1";
  });
  const a2 = await cachedHtml("t:cache", async () => {
    calls += 1;
    return "body-2";
  });
  check("caches a successful fetch", a1 === "body-1" && a2 === "body-1");
  check("loader not called again while fresh", calls === 1, `calls=${calls}`);

  // 2. Retry: fails twice with a transient 503, then succeeds.
  clearCache();
  let attempts = 0;
  const retried = await cachedHtml(
    "t:retry",
    async () => {
      attempts += 1;
      if (attempts < 3) throw fail(503);
      return "recovered";
    },
    1000,
  );
  check("retries transient 503 then succeeds", retried === "recovered" && attempts === 3, `attempts=${attempts}`);
  check("counts retries", cacheStats().retries === 2, JSON.stringify(cacheStats()));

  // 3. Permanent 404 is not retried.
  clearCache();
  let notFoundAttempts = 0;
  let threw = false;
  try {
    await cachedHtml("t:404", async () => {
      notFoundAttempts += 1;
      throw fail(404);
    });
  } catch {
    threw = true;
  }
  check("throws on permanent 404", threw);
  check("does not retry a 404", notFoundAttempts === 1, `attempts=${notFoundAttempts}`);

  // 4. Stale-on-error: good copy is served after the refresh fails.
  clearCache();
  const first = await cachedHtml("t:stale", async () => "good-copy", 60);
  check("initial fetch returns body", first === "good-copy");
  await new Promise((r) => setTimeout(r, 90)); // let the 60ms entry expire
  const stale = await cachedHtml("t:stale", async () => {
    throw fail(502);
  }, 60);
  check("serves stale copy when refresh fails", stale === "good-copy", `got=${stale}`);
  check("counts stale serves", cacheStats().staleServed >= 1);

  // 5. No stale copy available → the error surfaces instead of an empty page.
  clearCache();
  let surfaced = false;
  try {
    await cachedHtml("t:nostale", async () => {
      throw fail(500);
    });
  } catch {
    surfaced = true;
  }
  check("throws when there is nothing stale to serve", surfaced);

  console.log(`\n${failures === 0 ? "all cache checks passed" : `${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
