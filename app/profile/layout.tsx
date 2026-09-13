import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your LocalPlate AI account profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
