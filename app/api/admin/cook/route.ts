import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizePlannedMeals,
  sanitizeSavedRecipes,
} from "@/lib/cookSync";

const PAGE_SIZE = 10;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Removes characters that have a meaning inside a PostgREST filter.
function cleanSearch(value: string) {
  return value.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
}

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

// "What Can I Cook?" data (table: cook_data) for the admin panel. Read-only.
//   GET /api/admin/cook                -> paged list of users with counts
//   GET /api/admin/cook?user_id=<uuid> -> full recipes + meal plan of one user
export async function GET(req: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const admin = createAdminClient();

    // ---- one user in full ----
    const userId = url.searchParams.get("user_id");

    if (userId) {
      if (!UUID.test(userId)) {
        return NextResponse.json({ error: "Invalid id." }, { status: 400 });
      }

      const { data, error } = await admin
        .from("cook_data")
        .select("saved_recipes, meal_plan, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({
        savedRecipes: sanitizeSavedRecipes(data?.saved_recipes),
        mealPlan: sanitizePlannedMeals(data?.meal_plan),
        updatedAt: data?.updated_at ?? null,
      });
    }

    // ---- paged list ----
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const search = cleanSearch(url.searchParams.get("q") || "");
    const from = (page - 1) * PAGE_SIZE;

    let query = admin
      .from("cook_data")
      .select("user_id, saved_recipes, meal_plan, updated_at", {
        count: "exact",
      })
      .order("updated_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (search) {
      const { data: matches } = await admin
        .from("profiles")
        .select("id")
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(100);

      const ids = (matches ?? []).map((row) => row.id as string);

      if (ids.length === 0) {
        return NextResponse.json({
          items: [],
          total: 0,
          pageSize: PAGE_SIZE,
          totalUsers: 0,
        });
      }

      query = query.in("user_id", ids);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const rows = data ?? [];
    const userIds = rows.map((row) => row.user_id as string);
    const profiles = new Map<string, ProfileRow>();

    if (userIds.length > 0) {
      const { data: profileRows } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      (profileRows ?? []).forEach((profile) => {
        profiles.set(profile.id as string, profile as ProfileRow);
      });
    }

    const { count: totalUsers } = await admin
      .from("cook_data")
      .select("user_id", { count: "exact", head: true });

    const items = rows.map((row) => {
      const recipes = sanitizeSavedRecipes(row.saved_recipes);
      const meals = sanitizePlannedMeals(row.meal_plan);
      const profile = profiles.get(row.user_id as string);

      return {
        userId: row.user_id as string,
        email: profile?.email ?? null,
        name: profile?.full_name ?? null,
        updatedAt: (row.updated_at as string | null) ?? null,
        recipeCount: recipes.length,
        mealCount: meals.length,
        recipeTitles: recipes.slice(0, 5).map((recipe) => recipe.title),
      };
    });

    return NextResponse.json({
      items,
      total: count ?? 0,
      pageSize: PAGE_SIZE,
      totalUsers: totalUsers ?? 0,
    });
  } catch (error) {
    console.error("Admin cook data error:", error);

    return NextResponse.json(
      { error: "Could not load What Can I Cook data." },
      { status: 500 }
    );
  }
}