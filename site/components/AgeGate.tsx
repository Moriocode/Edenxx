"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE, safeNextPath } from "@/lib/compliance";
import { SITE_NAME } from "@/lib/constants";

/**
 * Set right before navigating away after accepting. If we come back to the gate
 * within a few seconds, the browser refused to keep the confirmation cookie and
 * the visitor is shown a way out instead of being bounced in a loop.
 */
const RETRY_KEY = "erofox_age_retry_at";
const RETRY_WINDOW_MS = 20_000;

/** True when the page is rendered inside a frame (the preview panel does this). */
function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access to top throws, which only happens in a frame.
    return true;
  }
}

/**
 * Blocking age gate.
 *
 * Rendered by /age-check, which middleware rewrites to for any visitor without
 * the confirmation cookie. Because the request never reaches a gallery route,
 * no thumbnail, title or reader page exists in the DOM until this button is
 * pressed — the gate is a real barrier, not an overlay on loaded content.
 *
 * The confirmation cookie is SameSite=None over https: an embedded view counts
 * as a third-party context, and a Lax cookie is dropped there, which used to
 * send every navigation straight back to this page.
 */
export default function AgeGate({ next }: { next?: string | null }) {
  const [blocked, setBlocked] = useState(false);
  const target = safeNextPath(next);

  // The gate owns the viewport while it is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // If we were sent straight back here right after accepting, the browser is
  // discarding the cookie (private mode, or a frame with strict storage rules).
  useEffect(() => {
    try {
      const at = Number(window.sessionStorage.getItem(RETRY_KEY) || "0");
      if (at && Date.now() - at < RETRY_WINDOW_MS) setBlocked(true);
    } catch {
      /* no session storage: treat as a normal visit */
    }
  }, []);

  function accept() {
    const secure = window.location.protocol === "https:";
    // Over https the cookie must be SameSite=None + Secure to survive inside a
    // frame; over http (local development) Lax is the only valid combination.
    const attributes = secure ? "SameSite=None; Secure" : "SameSite=Lax";
    document.cookie = `${AGE_COOKIE}=1; Path=/; Max-Age=${AGE_COOKIE_MAX_AGE}; ${attributes}`;
    try {
      window.localStorage.setItem(AGE_COOKIE, "1");
    } catch {
      /* storage blocked: the cookie above is what the server checks */
    }
    try {
      if (isEmbedded()) window.sessionStorage.setItem(RETRY_KEY, String(Date.now()));
    } catch {
      /* nothing to remember with */
    }
    window.location.replace(target);
  }

  function openOutside() {
    try {
      window.sessionStorage.removeItem(RETRY_KEY);
    } catch {
      /* ignore */
    }
    window.open(new URL(target, window.location.origin).href, "_blank", "noopener");
  }

  function retry() {
    try {
      window.sessionStorage.removeItem(RETRY_KEY);
    } catch {
      /* ignore */
    }
    setBlocked(false);
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

          {blocked ? (
            <>
              <h1 id="age-gate-title" className="text-xl font-extrabold tracking-tight text-fg">
                This view blocks cookies
              </h1>
              <p id="age-gate-copy" className="mt-2 text-sm leading-relaxed text-muted">
                Your confirmation can&rsquo;t be saved here, so the site keeps returning to this
                screen. Open it in its own tab to continue — or try again if this was a one-off.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <button type="button" onClick={openOutside} className="btn btn-primary h-11 w-full text-sm">
                  Open in a new tab
                </button>
                <button type="button" onClick={retry} className="btn h-11 w-full text-sm font-semibold">
                  Try again
                </button>
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-muted/75">
                Nothing is stored until you enter: this screen is the only page the server sends
                before you confirm that you are an adult.
              </p>
            </>
          ) : (
            <>
              <h1 id="age-gate-title" className="text-xl font-extrabold tracking-tight text-fg">
                Adults only
              </h1>
              <p id="age-gate-copy" className="mt-2 text-sm leading-relaxed text-muted">
                This site contains sexually explicit comics and artwork. You must be at least 18
                years old — or the age of majority where you live, if that is higher — to continue.
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
                By entering you confirm that viewing adult material is legal in your jurisdiction.
                Every work indexed here is a fictional illustration; no actual human beings are
                depicted.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
