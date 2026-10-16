// Single place for the details used by SEO, the Privacy Policy, Terms and Contact pages.
// Set NEXT_PUBLIC_CONTACT_EMAIL in .env.local / your hosting dashboard to a real inbox.

export const SITE_NAME = "LocalPlate AI";

// Public address of the website, without a trailing slash.
// Set NEXT_PUBLIC_SITE_URL in your hosting dashboard (for example https://localplate-ai.vercel.app).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@example.com";

// Update this date whenever you change the legal text.
export const LEGAL_UPDATED = "13 October 2026";

// Country whose laws govern the Terms. Change if your business is registered elsewhere.
export const GOVERNING_LAW = "Pakistan";