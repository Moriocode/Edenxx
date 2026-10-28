import { NextResponse } from "next/server";
import { cacheStats } from "@/lib/cache";
import { activeSourceId, chainHealth } from "@/lib/source-selector";
import { ehImageCacheStats } from "@/lib/sources/ehentai";
import { routingSnapshot } from "@/lib/source-routing";
import { sourceChain } from "@/lib/source";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = activeSourceId();
  const [sourceChain, cache] = await Promise.all([chainHealth(), cacheStats()]);

  // The site fails over between sources, so it is healthy while any one of them
  // answers — not only the one currently preferred.
  const ok = sourceChain.some((s) => s.ok);

  return NextResponse.json(
    {
      activeSource: active,
      sourceChain,
      routing: routingSnapshot(sourceChain.map((s) => s.id)),
      cache,
      ehentaiImages: ehImageCacheStats(),
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
