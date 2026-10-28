import { NextResponse } from "next/server";
import { SOURCES, sourceHealth, sourceFor } from "@/lib/source";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = sourceFor();
  const health = await sourceHealth();

  const sources = SOURCES.map((id) => {
    const isDefault = id === active;
    // The health probe today targets the active source. Keep this route honest:
    // every listed source is present in the codebase, but only the active one is
    // probed from this endpoint.
    return {
      id,
      default: isDefault,
      probed: isDefault,
      url: isDefault ? health.url : undefined,
      ok: isDefault ? health.ok : undefined,
      status: isDefault ? health.status : undefined,
      latencyMs: isDefault ? health.latencyMs : undefined,
      error: isDefault && !health.ok ? health.error : undefined,
    };
  });

  return NextResponse.json(
    {
      active: active,
      sources,
      checkedAt: new Date().toISOString(),
    },
    { status: health.ok ? 200 : 503 },
  );
}
