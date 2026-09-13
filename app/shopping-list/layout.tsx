import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping List",
  description:
    "Organize, price, check off and share your LocalPlate AI shopping list.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ShoppingListLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
