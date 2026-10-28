import type { Metadata } from "next";
import { LegalPage, List, Section } from "@/components/Legal";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy — Kitsune",
  description:
    "What Kitsune collects, what it does not, how third-party image hosts are contacted, and your choices.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="28 October 2026"
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
          {SITE_NAME} has no accounts and no advertising of its own. We do not sell personal data
          and we do not run third-party analytics or tracking scripts. What we hold is ordinary web
          server data and a small amount of information stored in your own browser.
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
          ]}
        />
        <p>
          We do not ask for, and do not want, your name, email address, payment details or any other
          sensitive personal information.
        </p>
      </Section>

      <Section n={3} title="Cookies & Local Storage">
        <p>
          The Site does not set advertising or analytics cookies. We use your browser&rsquo;s local
          storage for one thing: remembering that you confirmed you are an adult, so the age gate does
          not reappear on every visit. Clearing your browser storage removes it and the gate will show
          again.
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
          We currently use no analytics, no advertising networks and no social tracking pixels. If
          that ever changes, this page will be updated first, and any third-party service will be
          named here along with a link to its policy.
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
          and on legal obligation where records must be kept or a valid request must be answered.
        </p>
      </Section>

      <Section n={8} title="Retention">
        <p>
          Server logs and cached upstream pages are kept only as long as needed for operations,
          security and debugging, and are rotated or deleted on a routine schedule. Cached content is
          refreshed regularly and is not tied to individual visitors.
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
