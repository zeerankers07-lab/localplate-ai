import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StartCooking from "@/app/components/StartCooking";
import {
  RECIPE_PAGES,
  RECIPES_UPDATED,
  getRecipePage,
} from "@/lib/seoPages";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Only the pages listed in lib/seoPages.ts exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPE_PAGES.map((page) => ({ slug: page.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getRecipePage(slug);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/recipes/${page.slug}` },
    openGraph: {
      type: "article",
      title: page.title,
      description: page.description,
      url: `/recipes/${page.slug}`,
      siteName: SITE_NAME,
      modifiedTime: `${RECIPES_UPDATED}T00:00:00Z`,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}

export default async function RecipeTopicPage({ params }: Props) {
  const { slug } = await params;
  const page = getRecipePage(slug);

  if (!page) notFound();

  const related = page.related
    .map((item) => getRecipePage(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const url = `${SITE_URL}/recipes/${page.slug}`;

  const jsonLd = [
    {
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
        { "@type": "ListItem", position: 3, name: page.h1, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.description,
      mainEntityOfPage: url,
      dateModified: RECIPES_UPDATED,
      inLanguage: "en",
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-orange-700">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/recipes" className="hover:text-orange-700">
          Recipes
        </Link>
      </nav>

      <article>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {page.h1}
        </h1>

        <div className="mt-4 space-y-3 text-zinc-700">
          {page.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <section
          aria-labelledby="main-recipe"
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"
        >
          <h2 id="main-recipe" className="text-xl font-semibold">
            {page.dish}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {page.time} · Serves {page.serves}
          </p>

          <h3 className="mt-5 font-semibold">Ingredients</h3>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-zinc-700">
            {page.ingredients.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="mt-5 font-semibold">Method</h3>
          <ol className="mt-2 list-decimal space-y-2 ps-5 text-zinc-700">
            {page.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mt-8" aria-labelledby="tips">
          <h2 id="tips" className="text-xl font-semibold">
            Tips
          </h2>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-zinc-700">
            {page.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="ideas">
          <h2 id="ideas" className="text-xl font-semibold">
            More ideas with the same ingredients
          </h2>
          <ul className="mt-3 space-y-3 text-zinc-700">
            {page.ideas.map((idea) => (
              <li key={idea.name}>
                <span className="font-semibold text-zinc-900">
                  {idea.name}.
                </span>{" "}
                {idea.text}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="try-tool"
          className="mt-10 rounded-2xl border border-orange-200 bg-orange-50/70 p-5 sm:p-6"
        >
          <h2 id="try-tool" className="text-lg font-semibold">
            Cook with what you have
          </h2>
          <p className="mt-1.5 text-sm text-zinc-700">
            Add your own ingredients to get recipes with an estimated cost,
            nutrition and a shopping list.
          </p>
          <div className="mt-4">
            <StartCooking
              ingredients={page.cookWith}
              label="Find recipes with these ingredients"
            />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related">
            <h2 id="related" className="text-lg font-semibold">
              Related recipe ideas
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/recipes/${item.slug}`}
                    className="block h-full rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium outline-none transition hover:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    {item.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-xs text-zinc-400">
          Last updated: {RECIPES_UPDATED}. Cooking times and amounts are
          approximate; adjust to your taste and kitchen.
        </p>
      </article>
    </main>
  );
}