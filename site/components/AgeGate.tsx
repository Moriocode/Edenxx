"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/constants";

const KEY = "erofox-age-ok";
/** Visitors who accepted under the previous brand keep their confirmation. */
const LEGACY_KEY = "kitsune-age-ok";

export default function AgeGate() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    let ok = false;
    try {
      ok = window.localStorage.getItem(KEY) === "1" || window.localStorage.getItem(LEGACY_KEY) === "1";
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
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* storage unavailable: the gate simply reappears next visit */
    }
    setAllowed(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-copy"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/80"
      >
        <div aria-hidden className="h-0.5 w-full bg-gradient-to-r from-accent via-accent2 to-transparent" />

        <div className="p-7 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center gap-2.5">
            <Image
              src="/erofox-mark.png"
              alt=""
              width={320}
              height={315}
              priority
              className="h-10 w-auto"
            />
            <span className="text-[17px] font-black lowercase tracking-[-0.02em] text-fg">
              {SITE_NAME}
            </span>
          </div>

          <span className="chip mx-auto mb-4 border-accent/30 bg-accent/10 text-accent">
            18+ only
          </span>

          <h1 id="age-gate-title" className="text-xl font-extrabold tracking-tight text-fg">
            Adults only
          </h1>
          <p id="age-gate-copy" className="mt-2 text-sm leading-relaxed text-muted">
            This site contains sexually explicit comics and artwork. You must be at least 18 years old
            (or the age of majority where you live) to continue.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={accept}
              className="btn btn-primary h-11 w-full text-sm"
              autoFocus
            >
              I am 18 or older — enter
            </button>
            <a
              href="https://www.google.com"
              className="btn h-11 w-full text-sm font-semibold"
            >
              Leave
            </a>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-muted/70">
            By entering you confirm it is legal to view adult material in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
