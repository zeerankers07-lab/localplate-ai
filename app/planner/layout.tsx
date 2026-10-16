import type { Metadata } from "next";

// Requires a login, so it should not appear in search results.
export const metadata: Metadata = {
  title: "Meal Planner",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlannerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}