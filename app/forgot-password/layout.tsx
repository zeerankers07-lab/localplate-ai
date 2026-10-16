import type { Metadata } from "next";

// Account pages should not appear in search results.
export const metadata: Metadata = {
  title: "Forgot password",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}