import type { Metadata } from "next";

// Requires a login, so it should not appear in search results.
export const metadata: Metadata = {
  title: "Weekly Plan",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WeeklyPlanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}