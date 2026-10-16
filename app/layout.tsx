import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import FeedbackWidget from "./components/FeedbackWidget";
import Footer from "./components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const siteDescription =
  "LocalPlate AI creates personalized meal plans based on your taste, budget, diet, goals, pantry ingredients and local food options.";

// Structured data that helps Google understand the site.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: siteDescription,
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: siteDescription,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LocalPlate AI | AI Meal Planner for Personalized Meals",
    template: "%s | LocalPlate AI",
  },
  description: siteDescription,
  keywords: [
    "AI meal planner",
    "meal planner",
    "Pakistani meal planner",
    "weekly meal plan",
    "budget meal planner",
    "AI food planner",
    "personalized meal planning",
    "Pakistani food",
    "shopping list",
  ],
  applicationName: "LocalPlate AI",
  authors: [{ name: "LocalPlate AI" }],
  creator: "LocalPlate AI",
  publisher: "LocalPlate AI",
  // Each page sets its own canonical address, so none is set here.
  // (A canonical set here would be inherited by every page.)
  verification: {
    // Paste the code from Google Search Console into this environment variable.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    type: "website",
    siteName: "LocalPlate AI",
    title: "LocalPlate AI | AI Meal Planner for Personalized Meals",
    description:
      "Create personalized, budget-friendly meal plans around your taste, diet, goals, pantry and local food options.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalPlate AI | AI Meal Planner",
    description:
      "Create personalized, budget-friendly meal plans with LocalPlate AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fffaf5] text-zinc-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <LanguageProvider>
          <Navbar />
          {children}
          <Footer />
          <FeedbackWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}