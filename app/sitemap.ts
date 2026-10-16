import type { MetadataRoute } from "next";
import { RECIPE_PAGES, RECIPES_UPDATED } from "@/lib/seoPages";
import { LEGAL_UPDATED, SITE_URL } from "@/lib/site";

// Only public pages that should appear in search results.
// Private pages (planner, weekly plan, saved plans, shopping list,
// profile, login) are left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const recipesDate = new Date(RECIPES_UPDATED);
  const legalDate = new Date(LEGAL_UPDATED);

  return [
    {
      url: SITE_URL,
      lastModified: recipesDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cook`,
      lastModified: recipesDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/recipes`,
      lastModified: recipesDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...RECIPE_PAGES.map((page) => ({
      url: `${SITE_URL}/recipes/${page.slug}`,
      lastModified: recipesDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacy`,
      lastModified: Number.isNaN(legalDate.getTime()) ? recipesDate : legalDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: Number.isNaN(legalDate.getTime()) ? recipesDate : legalDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: recipesDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}