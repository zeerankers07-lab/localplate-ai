import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LocalPlate AI | AI Meal Planner for Personalized Meals",
    template: "%s | LocalPlate AI",
  },
  description:
    "LocalPlate AI creates personalized meal plans based on your taste, budget, diet, goals, pantry ingredients and local food options.",
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "LocalPlate AI",
    title: "LocalPlate AI | AI Meal Planner for Personalized Meals",
    description:
      "Create personalized, budget-friendly meal plans around your taste, diet, goals, pantry and local food options.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
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
    <html lang="en">
      <body className="min-h-screen bg-[#fffaf5] text-zinc-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
