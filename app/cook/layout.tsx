import type { Metadata } from "next";

export const metadata: Metadata = {
  // The site name is added automatically by the root layout.
  title: "What Can I Cook? Find Recipes from Your Ingredients",
  description:
    "Discover meals from ingredients you already have. Find easy recipes, estimate cooking costs, reduce food waste, and plan your next meal with LocalPlate.",
  keywords: [
    "what can I cook",
    "recipes from ingredients",
    "what to cook with ingredients I have",
    "leftover recipes",
    "budget meals",
    "easy dinner ideas",
    "ingredient recipe finder",
  ],
  alternates: {
    canonical: "/cook",
  },
  openGraph: {
    type: "website",
    title: "What Can I Cook? | LocalPlate AI",
    description:
      "Turn ingredients you have into practical meal ideas with LocalPlate.",
    url: "/cook",
    siteName: "LocalPlate AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Can I Cook? | LocalPlate AI",
    description: "Find recipes using ingredients you already have.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}