import type { Metadata } from "next";
import { LegalPage, Section, List } from "../components/LegalPage";
import { CONTACT_EMAIL, LEGAL_UPDATED, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LocalPlate AI collects, uses and protects your information, including Google sign-in, AI processing, cookies and advertising.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro={`This Privacy Policy explains what information ${SITE_NAME} ("we", "us") collects when you use our website and services, how we use it, and the choices you have. By using ${SITE_NAME} you agree to the practices described here.`}
    >
      <Section title="1. Information we collect">
        <p>
          <strong>Account information.</strong> When you create an account we
          collect your name and email address and a password. Passwords are
          handled by our authentication provider (Supabase) and stored in
          hashed form; we cannot see your password. If you choose{" "}
          <em>Continue with Google</em>, Google shares basic profile
          information with us, such as your name and email address. We do not
          receive your Google password.
        </p>
        <p>
          <strong>Content you create.</strong> Ingredients you enter, your
          preferences (cuisine, diet, allergies, budget, goals), meal plans,
          saved recipes and shopping lists you save to your account.
        </p>
        <p>
          <strong>Feedback and messages.</strong> Anything you send through the
          feedback form, plus the optional email you provide, the page you were
          on, and your selected language and currency.
        </p>
        <p>
          <strong>Technical information.</strong> Like most websites, our
          servers and service providers may log your IP address, browser type,
          device information and the pages requested. We also record how many
          AI requests an account makes so we can prevent abuse.
        </p>
      </Section>

      <Section title="2. How we use your information">
        <List>
          <li>To create and secure your account and sign you in.</li>
          <li>To generate recipes, meal plans, cost estimates and shopping lists.</li>
          <li>To save your plans and lists so you can return to them.</li>
          <li>To respond to feedback and support requests.</li>
          <li>To protect the service against abuse, fraud and security threats.</li>
          <li>To understand how the service is used and to improve it.</li>
          <li>To display advertising (see section 5).</li>
        </List>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="3. AI processing">
        <p>
          To create recipes and meal plans, the text you enter (for example
          ingredients, diet, allergies, budget and your questions) is sent to
          a third-party AI provider, Groq, which returns the generated result.
          We do not intentionally send your name or email address with these
          requests. Please do not enter sensitive personal information into AI
          prompts.
        </p>
        <p>
          AI output can be inaccurate. Nutrition, cost and allergy information
          is provided for general guidance only and is not medical or dietary
          advice. Always check ingredient labels and consult a qualified
          professional about medical conditions or allergies.
        </p>
      </Section>

      <Section title="4. Cookies and local storage">
        <List>
          <li>
            <strong>Essential cookies</strong> from our authentication provider
            keep you signed in and secure your session.
          </li>
          <li>
            <strong>Local storage</strong> in your browser remembers your
            language and currency choices and the time of your last feedback
            message (to limit spam).
          </li>
          <li>
            <strong>Advertising cookies</strong> may be set by Google and its
            partners as described below.
          </li>
        </List>
        <p>
          You can block or delete cookies in your browser settings; some parts
          of the site, such as signing in, may stop working if you do.
        </p>
      </Section>

      <Section id="advertising" title="5. Advertising (Google AdSense)">
        <p>
          We may show ads served by Google AdSense and other advertising
          partners to help pay for the service. Third-party vendors, including
          Google, use cookies to serve ads based on your previous visits to
          this and other websites.
        </p>
        <p>
          Google&apos;s use of advertising cookies enables it and its partners
          to serve ads to you based on your visit to our site and/or other
          sites on the Internet. You can opt out of personalized advertising
          by visiting{" "}
          <a
            className="text-orange-700 underline"
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          , or opt out of some third-party vendors&apos; use of cookies for
          personalized advertising at{" "}
          <a
            className="text-orange-700 underline"
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>
          . You can learn more about how Google uses data at{" "}
          <a
            className="text-orange-700 underline"
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>
          .
        </p>
        <p>
          Where required by law (for example in the European Economic Area and
          the United Kingdom), we ask for your consent before using
          advertising cookies.
        </p>
      </Section>

      <Section title="6. Who we share information with">
        <p>
          We share information only with service providers that help us run
          the service, and only as needed:
        </p>
        <List>
          <li>Supabase: authentication and database hosting.</li>
          <li>Groq: AI generation of recipes and plans.</li>
          <li>Google: sign-in (if you choose it) and advertising.</li>
          <li>Our website hosting and infrastructure provider.</li>
        </List>
        <p>
          We may also disclose information if required by law, or to protect
          the rights, safety and security of our users and the service.
          Information may be processed in countries other than your own.
        </p>
      </Section>

      <Section title="7. Data retention and deletion">
        <p>
          We keep your account data and saved content while your account is
          active. You can delete individual saved plans and lists inside the
          app. To delete your account and associated data, email us at{" "}
          <a className="text-orange-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          from the address registered on the account. We will act on verified
          requests within a reasonable time, subject to any legal obligation to
          keep certain records.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Depending on where you live, you may have the right to access,
          correct, delete or export your personal information, to object to or
          restrict some processing, and to withdraw consent. To exercise these
          rights, contact us using the details below.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We use access controls, encrypted connections (HTTPS) and
          owner-only database rules to protect your data. No method of
          transmission or storage is completely secure, so we cannot guarantee
          absolute security.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          {SITE_NAME} is not directed to children under 13, and we do not
          knowingly collect their personal information. If you believe a child
          has given us personal information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. The &quot;Last
          updated&quot; date above shows when it last changed. Continued use of
          the service after changes means you accept the updated policy.
        </p>
      </Section>

      <Section title="12. Contact us">
        <p>
          Questions about this policy? Email{" "}
          <a className="text-orange-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          or visit our{" "}
          <a className="text-orange-700 underline" href="/contact">
            Contact page
          </a>
          .
        </p>
        <p className="text-sm text-zinc-500">
          This policy is provided in English. If you need help understanding
          it in Urdu or Hindi, please contact us.
        </p>
      </Section>
    </LegalPage>
  );
}