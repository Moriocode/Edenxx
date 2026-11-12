import type { Metadata } from "next";
import { LegalPage, List, Section } from "@/components/Legal";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "DMCA & Takedown Policy",
  description:
    "How to submit a copyright or content takedown notice to erofox, what happens to a reported gallery, and how our blocklist works.",
};

export default function DmcaPage() {
  return (
    <LegalPage
      title="DMCA & Takedown Policy"
      updated="12 November 2026"
      intro={
        <>
          {SITE_NAME} is a search index. We do not host, upload or store comic files — we link to
          material published by third parties. This page explains how rights holders and others can
          have a gallery removed from our index, and what we do when we receive a valid request.
        </>
      }
    >
      <Section n={1} title="What We Are, and What We Are Not">
        <p>
          {SITE_NAME} is an automated search index and aggregator. Titles, covers and page images are
          retrieved from third-party publishers and displayed from their own servers. We do not
          operate a file host, we do not accept uploads, and no comic files are stored on our
          infrastructure.
        </p>
        <p>
          Because of that, a takedown sent to us can remove a title from <em>our index</em>. It cannot
          delete the underlying file, which remains on the publisher&rsquo;s servers. Where the work
          is genuinely infringing, the most effective notice goes to the host that stores it; we will
          delist the title from {SITE_NAME} as well.
        </p>
      </Section>

      <Section n={2} title="How to Submit a Takedown Notice">
        <p>
          Send your notice by email to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject line <span className="font-semibold text-fg">“Takedown — &lt;gallery URL&gt;”</span>.
          A notice must be in writing and include all of the following:
        </p>
        <List
          items={[
            "identification of the copyrighted work or other right you say is infringed (a title, registration number or link to the original publication is enough);",
            "the exact URL(s) on this site where the material appears, for example https://…/comic/hf-4316238 — a search term or a description is not sufficient;",
            "your name, organisation (if any), postal address, telephone number and a working email address;",
            "a statement that you have a good-faith belief that the use is not authorised by the rights holder, its agent or the law;",
            "a statement, under penalty of perjury, that the information in the notice is accurate and that you are the rights holder or are authorised to act on their behalf; and",
            "your physical or electronic signature.",
          ]}
        />
        <p>
          Incomplete notices cannot be actioned. If something is missing we will reply and tell you
          what is needed rather than discard the request.
        </p>
      </Section>

      <Section n={3} title="What Happens After a Valid Notice">
        <List
          items={[
            "we acknowledge the notice by email, normally within two business days;",
            "the gallery is added to a server-side blocklist, which removes it from listings, search, tag pages, sitemaps and related rails;",
            "direct requests for the gallery answer 451 Unavailable for Legal Reasons (or 404 where the request asks for a silent removal) instead of serving the page;",
            "the blocklist is checked in middleware on every request, so removal takes effect immediately and survives caching;",
            "we keep a record of the notice and the action taken so the same title is not re-indexed later.",
          ]}
        />
        <p>
          If a notice covers a tag, artist or entire source rather than a single gallery, say so
          explicitly — we can block at that level too.
        </p>
      </Section>

      <Section n={4} title="Counter-Notice">
        <p>
          If you believe a gallery was removed in error — for example because you hold the rights, or
          the work is authorised — reply to the same address with the URL, the reason you believe the
          removal was mistaken, your contact details and a statement that you consent to jurisdiction
          in the courts that apply to you.
        </p>
        <p>
          We may restore an indexed listing after reviewing a counter-notice. We cannot restore
          anything on a third-party publisher&rsquo;s servers, and we will not restore material that
          falls under our content blocklist (below).
        </p>
      </Section>

      <Section n={5} title="Content Blocklist — Minors and Non-Consent">
        <p>
          Independent of any notice, every gallery returned by our sources is screened server-side
          against a hard-coded blocklist. Works that sexualise minors, or that depict non-consensual
          sexual content, are dropped before they reach the site: they never appear in a listing,
          search result or reader, and direct links to them return a 404.
        </p>
        <p>
          This filter cannot be disabled from the interface or overridden by an upstream source.
          Suspected illegal material should be reported to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          — and, where a child is at risk, to the relevant national authority or to NCMEC
          (report.cybertip.org) immediately.
        </p>
      </Section>

      <Section n={6} title="Repeat Infringers">
        <p>
          Titles, artists or sources that are the subject of repeated valid notices are removed from
          the index permanently and excluded from future crawls. We do not restore listings for
          repeat infringers.
        </p>
      </Section>

      <Section id="2257" n={7} title="18 U.S.C. § 2257 Exemption Notice">
        <p>
          {SITE_NAME} contains <span className="font-semibold text-fg">solely fictional, illustrated
          depictions</span> — drawings, comics and computer-generated artwork. No actual human beings
          are depicted engaging in sexually explicit conduct, and we do not produce, commission or
          host any such depictions.
        </p>
        <p>
          Because no depiction of an actual human being is produced by us, {SITE_NAME} is exempt from
          the record-keeping requirements of 18 U.S.C. § 2257 and 28 C.F.R. Part 75. Any records that
          do exist are held by the third-party publishers of the works, on their own domains. Every
          character in the material we index is presented as an adult.
        </p>
      </Section>

      <Section n={8} title="Other Reports">
        <p>
          Abuse, privacy, defamation and law-enforcement requests go to the same address and are
          handled under the same procedure. Please include the URL and enough detail for us to
          identify the material.
        </p>
        <p>
          Related reading: our{" "}
          <a href="/terms" className="font-semibold text-accent hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="font-semibold text-accent hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
