"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE, safeNextPath } from "@/lib/compliance";
import { SITE_NAME } from "@/lib/constants";

/**
 * Blocking age gate.
 *
 * Rendered by /age-check, which middleware rewrites to for any visitor without
 * the confirmation cookie. Because the request never reaches a gallery route,
 * no thumbnail, title or reader page exists in the DOM until this button is
 * pressed — the gate is a real barrier, not an overlay on loaded content.
 */
export default function AgeGate({ next }: { next?: string | null }) {
  // The gate owns the viewport while it is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function accept() {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${AGE_COOKIE}=1; Path=/; Max-Age=${AGE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    try {
      window.localStorage.setItem(AGE_COOKIE, "1");
    } catch {
      /* storage blocked: the cookie above is what the server checks */
    }
    window.location.replace(safeNextPath(next));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-copy"
      className="fixed inset-0 z-[100] overflow-y-auto bg-ink"
    >
      <div className="grid min-h-full place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-7 text-center">
          <div className="mb-6 flex items-center justify-center gap-2.5">
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
            <span className="rounded-md border border-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted">
              18+
            </span>
          </div>

          <h1 id="age-gate-title" className="text-xl font-extrabold tracking-tight text-fg">
            Adults only
          </h1>
          <p id="age-gate-copy" className="mt-2 text-sm leading-relaxed text-muted">
            This site contains sexually explicit comics and artwork. You must be at least 18 years
            old — or the age of majority where you live, if that is higher — to continue.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={accept} className="btn btn-primary h-11 w-full text-sm" autoFocus>
              I am 18 or older — enter
            </button>
            <a href="https://www.google.com" className="btn h-11 w-full text-sm font-semibold">
              Leave
            </a>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-muted/75">
            By entering you confirm that viewing adult material is legal in your jurisdiction. Every
            work indexed here is a fictional illustration; no actual human beings are depicted.
          </p>

          <p className="mt-4 text-[11px] text-muted/60">
            <Link href="/dmca" className="underline decoration-line underline-offset-2 hover:text-fg">
              Takedown policy
            </Link>
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <Link href="/terms" className="underline decoration-line underline-offset-2 hover:text-fg">
              Terms
            </Link>
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            <Link href="/privacy" className="underline decoration-line underline-offset-2 hover:text-fg">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
