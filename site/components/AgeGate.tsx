"use client";

import { useEffect, useState } from "react";

const KEY = "kitsune-age-ok";

export default function AgeGate() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    let ok = false;
    try {
      ok = window.localStorage.getItem(KEY) === "1";
    } catch {
      ok = false;
    }
    setAllowed(ok);
    setReady(true);
  }, []);

  if (!ready || allowed) return null;

  function accept() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setAllowed(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/95 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-copy"
        className="w-full max-w-md rounded-2xl border border-line bg-panel p-7 text-center shadow-2xl"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-accent2 text-2xl">
          🔞
        </div>
        <h1 id="age-gate-title" className="text-xl font-extrabold tracking-tight">
          Adults only
        </h1>
        <p id="age-gate-copy" className="mt-2 text-sm leading-relaxed text-muted">
          This site contains sexually explicit comics and artwork. You must be at least 18 years old
          (or the age of majority where you live) to continue.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={accept}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-black transition hover:brightness-110"
          >
            I am 18 or older — enter
          </button>
          <a
            href="https://www.google.com"
            className="w-full rounded-lg border border-line px-4 py-3 text-sm font-semibold text-muted transition hover:bg-panel2 hover:text-white"
          >
            Leave
          </a>
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-muted/70">
          By entering you confirm it is legal to view adult material in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
