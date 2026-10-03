import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Plans",
  description: "View and reuse your saved LocalPlate AI meal plans.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SavedPlansLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}