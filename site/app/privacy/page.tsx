import type { Metadata } from "next";
import { LegalPage, List, Section } from "@/components/Legal";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What erofox collects, what it does not, how anonymous page-view counts work, how third-party image hosts are contacted, and your choices.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="9 November 2026"
      intro={
        <>
          This policy explains what {SITE_NAME} collects when you browse, why, and what you can do
          about it. It should be read together with our{" "}
          <a href="/terms" className="font-semibold text-accent hover:underline">
            Terms of Service
          </a>
          .
        </>
      }
    >
      <Section n={1} title="Summary">
        <p>
          {SITE_NAME} has no accounts, no advertising of its own and no third-party analytics or
          tracking scripts. We do not sell personal data. What we hold is ordinary web server data,
          anonymous totals of how often pages are opened, and a small amount of information stored in
          your own browser.
        </p>
      </Section>

      <Section n={2} title="What We Collect">
        <List
          items={[
            <>
              <span className="font-semibold text-white">Server logs.</span> Our host records the
              IP address, date and time, requested URL, HTTP status, user agent and referring page of
              each request. This is standard operational data, used to keep the site running and to
              detect abuse.
            </>,
            <>
              <span className="font-semibold text-white">Search queries.</span> Text you type into
              the search box is sent in the page URL so the results page can load. Like any URL, it
              appears in server logs and browser history.
            </>,
            <>
              <span className="font-semibold text-white">Reader preferences.</span> Your age
              confirmation and reading settings are stored locally in your browser (see below). They
              are not sent to us.
            </>,
            <>
              <span className="font-semibold text-white">Page-view counts.</span> Opening a page adds
              one to a set of anonymous totals: how many views in all, how many visitors, and which
              pages are opened. These are counters, not a record of your visits. Section 5 explains
              exactly what is and is not kept.
            </>,
          ]}
        />
        <p>
          We do not ask for, and do not want, your name, email address, payment details or any other
          sensitive personal information.
        </p>
      </Section>

      <Section n={3} title="Cookies & Local Storage">
        <p>
          The Site sets no advertising, cross-site or third-party cookies. The one cookie we do set
          exists only to count page views (section 5): it holds a random identifier generated when you
          first arrive, it is marked <span className="font-semibold text-white">HttpOnly</span> so
          page scripts cannot read it, it is never shared with anyone, and it expires after a year.
          Clear your cookies and you simply receive a new random identifier.
        </p>
        <p>
          We use your browser&rsquo;s local storage for one thing: remembering that you confirmed you
          are an adult, so the age gate does not reappear on every visit. Clearing your browser
          storage removes it and the gate will show again.
        </p>
      </Section>

      <Section n={4} title="Third-Party Content & Image Hosts">
        <p>
          Comics and cover images are loaded directly from third-party content delivery networks. As
          with any image on any website, those hosts receive your IP address, user agent and the time
          of the request, and their own privacy policies apply to that. We configure the Site to send
          no referrer information to them, so they are not told which page you are viewing.
        </p>
      </Section>

      <Section n={5} title="Analytics & Advertising">
        <p>
          Page views are counted in aggregate only. When you open a page, your browser sends one small
          background request that adds one to the overall total, to the count for that page, and — at
          most once a day — to a count of unique visitors. To keep a refresh from inflating the
          numbers, the Site uses the random first-party cookie described in section 3 and a short-lived
          marker for that page lasting 30 minutes; a returning visitor is counted as unique at most
          once every 24 hours.
        </p>
        <p>
          No IP address, user agent, referrer or browsing history is stored alongside those counts,
          and nothing is tied to an account because there are none. We only ever see totals, so we
          cannot build a profile of you from them, and we neither sell nor share the figures. Requests
          that signal Do Not Track or Global Privacy Control, and requests from known bots and
          crawlers, are skipped entirely.
        </p>
        <p>
          <span className="font-semibold text-white">The consent caveat.</span> Counting visits without
          consent is not settled law. We have deliberately limited this to non-identifying totals, but
          storing even a random identifier on your device may require your consent in the EEA, the UK
          and comparable jurisdictions. You can refuse it without losing anything: block or clear the
          cookie, or turn on Do Not Track / Global Privacy Control, and the Site works exactly as
          before — you are simply not counted. If we ever want more than these totals, such as
          per-visitor reporting or any third party, we will ask for consent first and name the service
          here.
        </p>
        <p>
          We use no advertising networks and no social tracking pixels.
        </p>
      </Section>

      <Section n={6} title="How We Use Information">
        <List
          items={[
            "serve pages and images, and diagnose errors and outages;",
            "protect the Site against abuse, scraping and attacks;",
            "understand aggregate usage so the catalogue and reader can be improved;",
            "comply with legal obligations and valid rights-holder requests.",
          ]}
        />
        <p>We do not use your data for profiling or automated decision-making.</p>
      </Section>

      <Section n={7} title="Legal Bases (EEA/UK Visitors)">
        <p>
          Where the GDPR or UK GDPR applies, we rely on our legitimate interests in operating and
          securing the Site, on your consent where we ask for it (for example the age confirmation),
          and on legal obligation where records must be kept or a valid request must be answered. We
          treat the page-view totals in section 5 as a legitimate-interest activity kept deliberately
          minimal; where local law requires consent for storing information on your device, section 5
          explains how to withhold it and still use the Site.
        </p>
      </Section>

      <Section n={8} title="Retention">
        <p>
          Server logs and cached upstream pages are kept only as long as needed for operations,
          security and debugging, and are rotated or deleted on a routine schedule. Cached content is
          refreshed regularly and is not tied to individual visitors.
        </p>
        <p>
          The page-view totals contain no personal data and are kept so trends remain comparable over
          time. The temporary marker that prevents double-counting a page expires on its own within 30
          minutes, the once-a-day visitor marker within 24 hours, and the random cookie in your browser
          after at most a year or whenever you clear it.
        </p>
      </Section>

      <Section n={9} title="Your Rights">
        <p>
          Depending on where you live, you may have the right to access, correct or delete personal
          data about you, to object to or restrict certain processing, and to lodge a complaint with
          your local data protection authority. Because we hold very little and do not operate
          accounts, we may be unable to identify you from a request — in that case we will explain
          what we can and cannot do.
        </p>
        <p>
          To make a request, write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section n={10} title="Children">
        <p>
          The Site is for adults only and is not directed to anyone under 18 (or the age of majority
          in their jurisdiction). We do not knowingly collect information from minors. If you believe
          a minor has used the Site, contact us and we will act on it.
        </p>
      </Section>

      <Section n={11} title="Security">
        <p>
          The Site is served over HTTPS and we keep the amount of data we hold to a minimum. No
          system is perfectly secure, so we cannot promise absolute security, but we do not store
          credentials, payment data or private messages because we never collect them.
        </p>
      </Section>

      <Section n={12} title="International Visitors">
        <p>
          The Site is operated from servers that may be located outside your country. By using it you
          understand that request data may be processed in jurisdictions with different privacy laws
          than your own.
        </p>
      </Section>

      <Section n={13} title="Changes to This Policy">
        <p>
          We may update this policy as the Site changes. The &ldquo;last updated&rdquo; date above
          will change accordingly, and material changes will be described on this page.
        </p>
      </Section>

      <Section n={14} title="Contact">
        <p>
          Privacy questions and data requests:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}
