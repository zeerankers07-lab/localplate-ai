import type { Metadata } from "next";
import { LegalPage, Section, List } from "../components/LegalPage";
import OpenFeedbackButton from "../components/OpenFeedbackButton";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with LocalPlate AI for support, feedback, privacy requests or business enquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact Us"
      intro={`We would love to hear from you. Whether you have a question, found a problem, or want to suggest a feature for ${SITE_NAME}, reach out and we will get back to you.`}
    >
      <Section title="Email">
        <p>
          <a
            className="text-lg font-semibold text-orange-700 underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>We usually reply within 2 to 3 business days.</p>
      </Section>

      <Section title="Send feedback">
        <p>
          Prefer not to use email? Send a quick message right from the site.
          You can report a problem or request a feature.
        </p>
        <OpenFeedbackButton />
      </Section>

      <Section title="What you can contact us about">
        <List>
          <li>Help with your account or signing in</li>
          <li>Bugs, wrong results or something not working</li>
          <li>Feature requests and ideas</li>
          <li>
            Privacy requests, including account and data deletion (email from
            your registered address)
          </li>
          <li>Advertising, partnerships and business enquiries</li>
        </List>
      </Section>

      <Section title="Helpful links">
        <List>
          <li>
            <a className="text-orange-700 underline" href="/privacy">
              Privacy Policy
            </a>
          </li>
          <li>
            <a className="text-orange-700 underline" href="/terms">
              Terms of Service
            </a>
          </li>
        </List>
      </Section>
    </LegalPage>
  );
}