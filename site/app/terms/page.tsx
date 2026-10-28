import type { Metadata } from "next";
import { LegalPage, List, Section } from "@/components/Legal";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service — Kitsune",
  description:
    "Terms of Service for Kitsune, including acceptable use, rights-holder notices, the no-minors policy and limitations of liability.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="28 October 2026"
      intro={
        <>
          Please read these Terms carefully before using {SITE_NAME}. By accessing or using the
          site you agree to be bound by them. If you do not agree, do not use the site.
        </>
      }
    >
      <Section n={1} title="Acceptance of These Terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of{" "}
          {SITE_NAME} (the &ldquo;Site&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By browsing,
          searching, reading or otherwise using the Site, you confirm that you have read, understood
          and agree to these Terms together with our{" "}
          <a href="/privacy" className="font-semibold text-accent hover:underline">
            Privacy Policy
          </a>
          . If you do not agree, you must stop using the Site.
        </p>
      </Section>

      <Section n={2} title="Eligibility — Adults Only">
        <p>
          The Site contains sexually explicit material intended exclusively for adults. You must be
          at least 18 years old, or the age of majority in your jurisdiction if that is higher, to
          access it. By using the Site you represent and warrant that you meet that requirement and
          that viewing adult material is legal where you are located.
        </p>
        <p>
          We do not knowingly permit use of the Site by minors. If you are under the applicable age
          of majority, you must leave immediately.
        </p>
      </Section>

      <Section n={3} title="What the Site Is — and Is Not">
        <p>
          {SITE_NAME} is a search and reading interface. It indexes and displays comics, doujin and
          manhwa that are published by independent third-party sites, and it links to those sites&rsquo;
          material. We do not host, upload, own, produce or control that content, and we claim no
          rights in it. All artwork, characters, titles and text remain the property of their
          respective authors, publishers and rights holders.
        </p>
        <p>
          Because content is retrieved live from third parties, we do not guarantee that any
          particular title will be available, complete, correctly described or lawful in your
          jurisdiction.
        </p>
      </Section>

      <Section n={4} title="Acceptable Use">
        <p>You agree not to:</p>
        <List
          items={[
            "use the Site if you are under the age of majority, or allow any minor to access it;",
            "copy, scrape, mirror, resell or systematically extract content or data from the Site, or circumvent rate limits or technical protections;",
            "interfere with the operation of the Site, including by introducing malware, overloading it, or attempting to gain unauthorised access to any system;",
            "use the Site to harass, defame, threaten or harm any person, or to infringe anyone's intellectual property or privacy rights;",
            "misrepresent your identity or affiliation, or use the Site for any unlawful purpose.",
          ]}
        />
      </Section>

      <Section n={5} title="Intellectual Property">
        <p>
          The Site&rsquo;s own interface, design and original text are owned by {SITE_NAME} and may
          not be reproduced without permission. Third-party artwork and comics displayed or linked
          through the Site belong to their respective owners and are used for indexing and reference
          purposes only.
        </p>
      </Section>

      <Section id="dmca" n={6} title="Copyright Complaints & Rights-Holder Notices">
        <p>
          If you are a rights holder or believe content violates the law or these Terms, send a
          notice to <span className="font-semibold text-white">{CONTACT_EMAIL}</span> including:
        </p>
        <List
          items={[
            "(i) the specific URL(s) of the allegedly infringing material;",
            "(ii) a description of the copyrighted work or right claimed;",
            "(iii) your contact information;",
            "(iv) a statement of good-faith belief that use is not authorised; and",
            "(v) a statement, under penalty of perjury, that the information is accurate and that you are authorised to act on behalf of the rights holder.",
          ]}
        />
        <p>
          Upon receiving a valid notice, we will promptly remove or disable access to the material
          and, where appropriate, notify the uploader. Where the material is hosted by a third-party
          source rather than by us, we will remove our link or listing and, where we can, pass your
          notice to that source.
        </p>
        <p>
          We maintain a repeat-infringer policy that can result in the removal of listings or the
          termination of access.
        </p>
      </Section>

      <Section n={7} title="No Minors Policy & Age Claims">
        <p>
          All content referenced through {SITE_NAME} must depict adults only. Works that appear to
          depict or suggest minors — including so-called &ldquo;lolicon&rdquo; or
          &ldquo;shotacon&rdquo; material, or any content sexualising minors — are strictly
          prohibited on the Site, will be removed, and will be reported where required by law. See
          also our separate 2257 Statement below.
        </p>
        <p className="rounded-lg border border-line bg-panel px-3 py-2 text-[12.5px]">
          <span className="font-bold text-white">2257 Statement.</span> {SITE_NAME} is not a
          producer of the content it indexes. We do not create, host or upload any depiction of
          actual sexually explicit conduct, and we therefore do not maintain records under 18 U.S.C.
          § 2257. Records for any such content are held by the third-party publishers that produce
          it and are served from their own domains.
        </p>
      </Section>

      <Section n={8} title="Accounts & Security">
        <p>
          The Site is currently usable without an account. If account features are introduced, you
          must keep your credentials confidential, you are responsible for all activity under your
          account, and you must notify us immediately of any unauthorised use or security issue.
        </p>
      </Section>

      <Section n={9} title="Third-Party Links, Services & Advertising">
        <p>
          The Site links to and displays content served from third-party websites and services,
          which may include advertising networks. Those are not controlled by {SITE_NAME}, and their
          own terms and policies apply. We are not responsible for third-party content,
          advertisements, availability or practices.
        </p>
      </Section>

      <Section n={10} title="Privacy & Cookies">
        <p>
          Your use of the Site is also governed by our{" "}
          <a href="/privacy" className="font-semibold text-accent hover:underline">
            Privacy Policy
          </a>
          , which explains what we collect (for example IP address and request logs), how we use it,
          and your choices, including third-party cookies. By using the Site you consent to those
          practices.
        </p>
      </Section>

      <Section n={11} title="Disclaimers">
        <p>
          The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. To
          the maximum extent permitted by law, {SITE_NAME} disclaims all warranties, express or
          implied, including merchantability, fitness for a particular purpose and non-infringement.
          We do not guarantee that content will be accurate, lawful, available, complete or free of
          objectionable material.
        </p>
      </Section>

      <Section n={12} title="Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, {SITE_NAME} and its affiliates will not
          be liable for any indirect, incidental, special, consequential, exemplary or punitive
          damages, or for lost profits, revenues, data or goodwill, arising from or related to your
          use of the Site — even if advised of the possibility of such damages. Our aggregate
          liability for any claim shall not exceed the greater of USD $50 or the amount you paid to
          use the Service in the 12 months preceding the claim. Nothing in these Terms limits
          liability that cannot be limited under applicable mandatory law.
        </p>
      </Section>

      <Section n={13} title="Indemnification">
        <p>
          You agree to defend, indemnify and hold harmless {SITE_NAME} and its affiliates, officers,
          employees and agents from and against any claims, damages, liabilities, costs and expenses
          (including reasonable attorneys&rsquo; fees) arising out of or related to: (a) your content
          or conduct; (b) your violation of these Terms or applicable laws; or (c) your infringement
          of any third-party rights.
        </p>
      </Section>

      <Section n={14} title="Termination">
        <p>
          We may suspend or terminate your access at any time for any reason, including violations of
          these Terms or legal requests. You may stop using the Site at any time. Certain provisions
          (including ownership, disclaimers, limitation of liability and indemnification) survive
          termination.
        </p>
      </Section>

      <Section n={15} title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. The &ldquo;last updated&rdquo; date above
          will change, and material changes will be reflected on this page. Continued use of the
          Site after an update means you accept the revised Terms.
        </p>
      </Section>

      <Section n={16} title="Miscellaneous">
        <p>
          <span className="font-bold text-white">Entire Agreement.</span> These Terms, together with
          the Privacy Policy and any other policies referenced herein, constitute the entire
          agreement between you and {SITE_NAME} regarding the Service.
        </p>
        <p>
          <span className="font-bold text-white">Severability.</span> If any provision is found
          unenforceable, the remaining provisions remain in full force and effect.
        </p>
        <p>
          <span className="font-bold text-white">No Waiver.</span> Our failure to enforce any
          provision is not a waiver of that provision.
        </p>
        <p>
          <span className="font-bold text-white">Assignment.</span> You may not assign these Terms
          without our written consent. We may assign them freely.
        </p>
        <p>
          <span className="font-bold text-white">Force Majeure.</span> We are not liable for delays
          or failures caused by events beyond our reasonable control.
        </p>
      </Section>

      <Section n={17} title="Contact">
        <p>
          Rights, abuse reports and general inquiries:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>
          See also the{" "}
          <a href="/privacy" className="font-semibold text-accent hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
