import type { Metadata } from "next";

// Account pages should not appear in search results.
export const metadata: Metadata = {
  title: "Reset password",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}