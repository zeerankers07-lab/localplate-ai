import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What Can I Cook? | AI Recipe Finder",
  description:
    "Tell LocalPlate AI what ingredients you already have and discover practical Pakistani meals you can cook with them.",
  keywords: [
    "what can I cook",
    "AI recipe finder",
    "ingredients recipe generator",
    "pantry recipes",
    "Pakistani recipes",
    "AI cooking assistant",
    "leftover recipes",
    "meal ideas",
  ],
  alternates: {
    canonical: "/cook",
  },
  openGraph: {
    type: "website",
    title: "What Can I Cook? | LocalPlate AI",
    description:
      "Enter the ingredients you already have and discover practical meals you can cook with LocalPlate AI.",
    url: "/cook",
    siteName: "LocalPlate AI",
  },
  twitter: {
    card: "summary",
    title: "What Can I Cook? | LocalPlate AI",
    description:
      "Turn your available ingredients into practical meal ideas with LocalPlate AI.",
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