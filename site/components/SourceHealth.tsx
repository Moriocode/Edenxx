"use client";

import { useState } from "react";
import type { SourceId } from "@/lib/source";

/** Response shape of GET /api/health (app/api/health/route.ts), fields we render. */
type ChainEntry = {
  id: SourceId;
  default: boolean;
  ok: boolean;
  url: string;
  status?: number;
  latencyMs: number;
  error?: string;
};

type HealthPayload = {
  activeSource: SourceId;
  sourceChain: ChainEntry[];
  checkedAt: string;
};

type State =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "failed"; message: string }
  | { phase: "ready"; data: HealthPayload };

/**
 * Footer status control bound to the existing GET /api/health route handler.
 * Checks run on demand (never on page load) so browsing never triggers extra
 * upstream probes; all async state is mapped to visible UI states.
 */
export default function SourceHealth() {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function check() {
    setState({ phase: "checking" });
    try {
      const res = await fetch("/api/health", { headers: { accept: "application/json" } });
      const body: Partial<HealthPayload> = await res.json();
      if (!Array.isArray(body.sourceChain) || !body.activeSource) {
        throw new Error(`Health endpoint responded ${res.status}`);
      }
      setState({ phase: "ready", data: body as HealthPayload });
    } catch (err) {
      setState({ phase: "failed", message: err instanceof Error ? err.message : String(err) });
    }
  }

  const checking = state.phase === "checking";

  if (state.phase === "ready") {
    const up = state.data.sourceChain.filter((s) => s.ok);
    const healthy = up.length > 0;
    const active = state.data.sourceChain.find((s) => s.default) ?? state.data.sourceChain[0];

    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1"
      >
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${healthy ? "bg-emerald-400" : "bg-accent2"}`}
        />
        <span className="font-semibold text-white/75">
          {healthy ? "Sources online" : "Sources degraded"}
        </span>
        <span className="text-muted">
          {active ? `${active.id} · ${active.latencyMs}ms` : `${up.length} up`}
        </span>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="font-bold text-accent transition hover:underline disabled:opacity-50"
        >
          Re-check
        </button>
      </p>
    );
  }

  if (state.phase === "failed") {
    return (
      <p role="status" className="flex items-center gap-2 text-xs">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent2" />
        <span className="font-semibold text-white/75">Status unavailable</span>
        <span className="max-w-[16rem] truncate text-muted" title={state.message}>
          {state.message}
        </span>
        <button
          type="button"
          onClick={check}
          className="font-bold text-accent transition hover:underline"
        >
          Retry
        </button>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={check}
      disabled={checking}
      aria-busy={checking}
      className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-bold text-white/75 transition hover:border-accent/60 hover:text-accent disabled:opacity-70"
    >
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full ${checking ? "animate-pulse bg-accent" : "bg-muted/60"}`}
      />
      {checking ? "Checking sources…" : "Source status"}
    </button>
  );
}