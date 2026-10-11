// Saves the Cook page's recipes and meal plan to the signed-in user's account.
// Anything coming back from storage or the database is re-checked here first.

import { createClient } from "@/lib/supabase/client";

export type CookSavedRecipe = {
  id: string;
  title: string;
  markdown: string;
  savedAt: number;
};

export type CookPlannedMeal = {
  id: string;
  day: string;
  slot: string;
  title: string;
  markdown: string;
  symbol: string;
};

export type CookRemoteData = {
  savedRecipes: CookSavedRecipe[];
  mealPlan: CookPlannedMeal[];
};

export const COOK_MAX_SAVED = 30;
export const COOK_MAX_PLAN = 28; // 7 days x 4 meal slots

const MAX_ID = 200;
const MAX_TITLE = 200;
const MAX_MARKDOWN = 20000;

function text(value: unknown, max: number): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

export function sanitizeSavedRecipes(value: unknown): CookSavedRecipe[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: CookSavedRecipe[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;

    const id = text(record.id, MAX_ID);
    const title = text(record.title, MAX_TITLE);
    const markdown = text(record.markdown, MAX_MARKDOWN);

    if (!id || !title || markdown === null || seen.has(id)) return;
    seen.add(id);

    result.push({
      id,
      title,
      markdown,
      savedAt:
        typeof record.savedAt === "number" && Number.isFinite(record.savedAt)
          ? record.savedAt
          : 0,
    });
  });

  return result.slice(0, COOK_MAX_SAVED);
}

export function sanitizePlannedMeals(value: unknown): CookPlannedMeal[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: CookPlannedMeal[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;

    const id = text(record.id, MAX_ID);
    const day = text(record.day, 20);
    const slot = text(record.slot, 20);
    const title = text(record.title, MAX_TITLE);
    const markdown = text(record.markdown, MAX_MARKDOWN);

    if (!id || !day || !slot || !title || markdown === null) return;
    if (seen.has(id)) return;
    seen.add(id);

    result.push({
      id,
      day,
      slot,
      title,
      markdown,
      symbol: text(record.symbol, 8) ?? "",
    });
  });

  return result.slice(0, COOK_MAX_PLAN);
}

// Union of two recipe lists. Newest copy wins, newest first, capped.
export function mergeSavedRecipes(
  first: CookSavedRecipe[],
  second: CookSavedRecipe[]
): CookSavedRecipe[] {
  const byId = new Map<string, CookSavedRecipe>();

  [...first, ...second].forEach((recipe) => {
    const existing = byId.get(recipe.id);
    if (!existing || recipe.savedAt > existing.savedAt) {
      byId.set(recipe.id, recipe);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, COOK_MAX_SAVED);
}

// Account plan first; meals from this device only fill slots that are empty.
export function mergePlannedMeals(
  account: CookPlannedMeal[],
  local: CookPlannedMeal[]
): CookPlannedMeal[] {
  const used = new Set(account.map((meal) => meal.id));

  return [...account, ...local.filter((meal) => !used.has(meal.id))].slice(
    0,
    COOK_MAX_PLAN
  );
}

type Client = ReturnType<typeof createClient>;

// Returns null when the user has no saved row yet. Throws on errors.
export async function fetchCookData(
  supabase: Client,
  userId: string
): Promise<CookRemoteData | null> {
  const { data, error } = await supabase
    .from("cook_data")
    .select("saved_recipes, meal_plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    savedRecipes: sanitizeSavedRecipes(data.saved_recipes),
    mealPlan: sanitizePlannedMeals(data.meal_plan),
  };
}

export async function saveCookData(
  supabase: Client,
  userId: string,
  data: CookRemoteData
) {
  const { error } = await supabase.from("cook_data").upsert(
    {
      user_id: userId,
      saved_recipes: data.savedRecipes,
      meal_plan: data.mealPlan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}