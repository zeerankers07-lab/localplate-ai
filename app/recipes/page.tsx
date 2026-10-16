import type { Metadata } from "next";
import Link from "next/link";
import { RECIPE_PAGES } from "@/lib/seoPages";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recipe Ideas: What to Cook with What You Have",
  description:
    "Practical recipe ideas for everyday ingredients: chicken and rice, eggs and potatoes, leftover rice, budget family meals, high-protein vegetarian dishes and quick dinners.",
  alternates: { canonical: "/recipes" },
  openGraph: {
    type: "website",
    title: "Recipe Ideas: What to Cook with What You Have",
    description:
      "Practical recipe ideas for everyday ingredients, each with a step-by-step recipe.",
    url: "/recipes",
    siteName: SITE_NAME,
  },
};

export default function RecipesPage() {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Recipes",
        item: `${SITE_URL}/recipes`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-orange-700">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Recipes</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Recipe ideas: what to cook with what you have
      </h1>

      <p className="mt-3 max-w-xl text-zinc-600">
        Simple, tested-style recipes for ingredients most kitchens already have.
        Pick a topic, or tell the {SITE_NAME} tool what is in your kitchen.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {RECIPE_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/recipes/${page.slug}`}
              className="block h-full rounded-xl border border-zinc-200 bg-white p-5 outline-none transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <h2 className="font-semibold">{page.h1}</h2>
              <p className="mt-1.5 text-sm text-zinc-600">{page.short}</p>
              <p className="mt-3 text-xs text-zinc-500">
                {page.time} · serves {page.serves}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}