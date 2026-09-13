"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";

function formatSavedDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short",
    });
}

type SavedPlan = {
    id: number;
    mealPlan: string;
    foodType: string;
    budget: string;
    mealType: string;
    diet: string;
    time: string;

    // New planner preferences
    goal?: string;
    servings?: string;
    city?: string;
    spiceLevel?: string;
    allergies?: string;
    dislikes?: string;
    pantry?: string;
    extraPreferences?: string;
    smartSubstitutions?: boolean;
    useLeftovers?: boolean;
    leftovers?: string;
    planType?: "weekly" | "single";

    createdAt: string;
    favorite: boolean;
};

export default function SavedPlansPage() {
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "favorites">("all");
    const [openPlans, setOpenPlans] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const deletePlan = async (id: number) => {
        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { error } = await supabase
                    .from("saved_plans")
                    .delete()
                    .eq("id", id)
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Supabase delete error:", error);
                    throw error;
                }
            }

            const updatedPlans = savedPlans.filter((plan) => plan.id !== id);

            localStorage.setItem(
                "localplate_saved_plans",
                JSON.stringify(updatedPlans)
            );

            setSavedPlans(updatedPlans);

            setOpenPlans((current) =>
                current.filter((planId) => planId !== id)
            );
        } catch (error) {
            console.error("Failed to delete saved plan:", error);
            alert("Saved plan delete nahi ho saka. Please try again.");
        }
    };

    const toggleFavorite = async (id: number) => {
        const plan = savedPlans.find((item) => item.id === id);
        if (!plan) return;

        const nextFavorite = !plan.favorite;

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { error } = await supabase
                    .from("saved_plans")
                    .update({ favorite: nextFavorite })
                    .eq("id", id)
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Supabase favorite update error:", error);
                    throw error;
                }
            }

            const updatedPlans = savedPlans.map((item) =>
                item.id === id
                    ? { ...item, favorite: nextFavorite }
                    : item
            );

            localStorage.setItem(
                "localplate_saved_plans",
                JSON.stringify(updatedPlans)
            );

            setSavedPlans(updatedPlans);
        } catch (error) {
            console.error("Failed to update favorite:", error);
            alert("Favorite update nahi ho saka. Please try again.");
        }
    };

    const togglePlan = (id: number) => {
        setOpenPlans((current) =>
            current.includes(id)
                ? current.filter((planId) => planId !== id)
                : [...current, id]
        );
    };

    const useAgain = (plan: SavedPlan) => {
        try {
            if (plan.planType === "weekly" || plan.mealType === "Weekly Plan") {
                localStorage.setItem(
                    "localplate_reuse_weekly_preferences",
                    JSON.stringify({
                        budget: plan.budget,
                        foodType: plan.foodType,
                        diet: plan.diet,
                        goal: plan.goal,
                        servings: plan.servings,
                        city: plan.city,
                        pantry: plan.pantry,
                        preferences: plan.extraPreferences,
                        smartSubstitutions: plan.smartSubstitutions ?? true,
                        useLeftovers: plan.useLeftovers ?? true,
                        leftovers: plan.leftovers ?? "",
                    })
                );

                localStorage.setItem(
                    "localplate_weekly_plan",
                    plan.mealPlan
                );

                window.location.href = "/weekly-plan";
                return;
            }

            localStorage.setItem(
                "localplate_reuse_preferences",
                JSON.stringify({
                    foodType: plan.foodType,
                    budget: plan.budget,
                    mealType: plan.mealType,
                    diet: plan.diet,
                    time: plan.time,
                    goal: plan.goal,
                    servings: plan.servings,
                    city: plan.city,
                    spiceLevel: plan.spiceLevel,
                    allergies: plan.allergies,
                    dislikes: plan.dislikes,
                    pantry: plan.pantry,
                    extraPreferences: plan.extraPreferences,
                })
            );

            window.location.href = "/planner";
        } catch (error) {
            console.error("Failed to reuse saved plan:", error);
            alert("Saved plan reuse nahi ho saka. Please try again.");
        }
    };

    useEffect(() => {
        let cancelled = false;

        async function loadSavedPlans() {
            setLoading(true);

            try {
                const localPlans = JSON.parse(
                    localStorage.getItem("localplate_saved_plans") || "[]"
                );

                const supabase = createClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    if (!cancelled) {
                        setSavedPlans(localPlans);
                    }
                    return;
                }

                const { data, error } = await supabase
                    .from("saved_plans")
                    .select(
                        "id, meal_plan, food_type, budget, meal_type, diet, time, goal, servings, city, spice_level, allergies, dislikes, pantry, extra_preferences, created_at, favorite, plan_type, smart_substitutions, use_leftovers, leftovers"
                    )
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Supabase load error:", error);
                    if (!cancelled) {
                        setSavedPlans(localPlans);
                    }
                    return;
                }

                const plans: SavedPlan[] = (data ?? []).map((plan) => ({
                    id: plan.id,
                    mealPlan: plan.meal_plan,
                    foodType: plan.food_type,
                    budget: plan.budget,
                    mealType: plan.meal_type,
                    diet: plan.diet,
                    time: plan.time,
                    goal: plan.goal ?? "",
                    servings: plan.servings ?? "",
                    city: plan.city ?? "",
                    spiceLevel: plan.spice_level ?? "",
                    allergies: plan.allergies ?? "",
                    dislikes: plan.dislikes ?? "",
                    pantry: plan.pantry ?? "",
                    extraPreferences: plan.extra_preferences ?? "",
                    smartSubstitutions: Boolean(plan.smart_substitutions),
                    useLeftovers: Boolean(plan.use_leftovers),
                    leftovers: plan.leftovers ?? "",
                    planType:
                        plan.plan_type === "weekly" ? "weekly" : "single",
                    createdAt: new Date(plan.created_at).toLocaleString(),
                    favorite: Boolean(plan.favorite),
                }));

                if (!cancelled) {
                    setSavedPlans(plans);

                    // Keep the existing local cache synchronized for the
                    // existing Use Again / fallback behavior.
                    localStorage.setItem(
                        "localplate_saved_plans",
                        JSON.stringify(plans)
                    );
                }
            } catch (error) {
                console.error("Failed to load saved plans:", error);

                if (!cancelled) {
                    const localPlans = JSON.parse(
                        localStorage.getItem("localplate_saved_plans") || "[]"
                    );
                    setSavedPlans(localPlans);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSavedPlans();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredPlans = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return savedPlans.filter((plan) => {
            const searchableText = [
                plan.mealPlan,
                plan.foodType,
                plan.budget,
                plan.mealType,
                plan.diet,
                plan.goal,
                plan.servings,
                plan.city,
                plan.spiceLevel,
                plan.allergies,
                plan.dislikes,
                plan.pantry,
                plan.extraPreferences,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                query === "" || searchableText.includes(query);

            const matchesFilter =
                filter === "all" || plan.favorite;

            return matchesSearch && matchesFilter;
        });
    }, [savedPlans, searchTerm, filter]);

    return (
        <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-zinc-900 md:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Top Action */}
                <div className="mb-10">
                    <a
                        href="/planner"
                        className="inline-flex items-center rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-sm transition-all duration-200 ease-out hover:border-orange-400 hover:bg-orange-50"
                    >
                        ← Back to Planner
                    </a>
                </div>

                {/* Hero */}
                <section className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                        💾 Your Collection
                    </div>

                    <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                        Saved Meal
                        <span className="text-orange-600"> Plans.</span>
                    </h1>

                    <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
                        Keep your favorite LocalPlate AI meals in one place and
                        come back to them whenever you need inspiration.
                    </p>
                </section>

                {/* Stats */}
                <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-zinc-500">
                            Total Plans
                        </p>

                        <p className="mt-1 text-3xl font-bold text-zinc-900">
                            {savedPlans.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-zinc-500">
                            Favorites
                        </p>

                        <p className="mt-1 text-3xl font-bold text-orange-600">
                            {savedPlans.filter((plan) => plan.favorite).length}
                        </p>
                    </div>

                    <div className="hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm md:block">
                        <p className="text-sm font-medium text-zinc-500">
                            Showing
                        </p>

                        <p className="mt-1 text-3xl font-bold text-zinc-900">
                            {filteredPlans.length}
                        </p>
                    </div>
                </div>

                {/* Search + Create */}
                <section className="mt-10 rounded-[2rem] border hover:shadow-2xl border-zinc-100 bg-white p-5 shadow-lg shadow-zinc-200/30 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg">
                                🔎
                            </span>

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                                placeholder="Search meal plans, diets, ingredients..."
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-12 pr-5 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                        </div>

                        <a
                            href="/planner"
                            className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-6 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg"
                        >
                            ➕ Create New Meal Plan
                        </a>
                    </div>

                    {/* Filters */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out ${
                                filter === "all"
                                    ? "bg-zinc-900 text-white shadow-sm"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                        >
                            All Plans
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter("favorites")}
                            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out ${
                                filter === "favorites"
                                    ? "bg-orange-600 text-white shadow-sm"
                                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            }`}
                        >
                            ⭐ Favorites
                        </button>

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="active:scale-[0.98] rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-500 transition-all duration-200 ease-out hover:bg-zinc-100 hover:text-zinc-800"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                </section>

                {/* Loading State */}
                {loading ? (
                    <section className="mt-8 rounded-[2rem] border border-zinc-100 bg-white p-10 text-center shadow-lg shadow-zinc-200/20 md:p-16">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                            ⏳
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-zinc-900">
                            Loading saved plans...
                        </h2>
                        <p className="mt-2 text-sm text-zinc-500">
                            Your LocalPlate AI collection is being loaded.
                        </p>
                    </section>
                ) : savedPlans.length === 0 ? (
                    <section className="mt-8 rounded-[2rem] border hover:shadow-2xl border-dashed border-orange-200 bg-white p-10 text-center shadow-lg shadow-zinc-200/20 md:p-16">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                            🍽️
                        </div>

                        <h2 className="mt-6 text-2xl font-bold text-zinc-900">
                            No saved meal plans yet
                        </h2>

                        <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-500">
                            Create your first personalized meal plan and save
                            it here for easy access later.
                        </p>

                        <a
                            href="/planner"
                            className="mt-7 inline-flex items-center rounded-full bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-md transition-all duration-200 ease-out hover:bg-orange-700"
                        >
                            Create My First Meal Plan →
                        </a>
                    </section>
                ) : filteredPlans.length === 0 ? (
                    /* No Search Results */
                    <section className="mt-8 rounded-[2rem] border hover:shadow-2xl border-zinc-100 bg-white p-10 text-center shadow-lg shadow-zinc-200/20">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                            🔎
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-zinc-800">
                            No matching meal plans
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Try another search term or switch back to All
                            Plans.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setFilter("all");
                            }}
                            className="mt-5 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-orange-700"
                        >
                            Show All Plans
                        </button>
                    </section>
                ) : (
                    /* Saved Plans */
                    <section className="mt-8 space-y-6">
                        {filteredPlans.map((plan) => {
                            const isOpen = openPlans.includes(plan.id);

                            return (
                                <article
                                    key={plan.id}
                                    className="overflow-hidden rounded-[2rem] border hover:shadow-2xl border-zinc-100 bg-white shadow-lg shadow-zinc-200/30 transition-all duration-200 ease-out hover:shadow-xl"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm text-zinc-400">
                                                        Saved
                                                    </span>
                                                    {(plan.planType === "weekly" || plan.mealType === "Weekly Plan") && (
                                                        <span className="active:scale-[0.98] rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                                            📅 Weekly
                                                        </span>
                                                    )}

                                                    <span className="text-sm text-zinc-400">
                                                        •
                                                    </span>

                                                    <span className="text-sm text-zinc-500">
                                                        {formatSavedDate(plan.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Meal Title */}
                                                <div className="mt-4">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: ({ children }) => (
                                                                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                                                                    {children}
                                                                </h2>
                                                            ),
                                                            p: ({ children }) => (
                                                                <p className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                                                                    {children}
                                                                </p>
                                                            ),
                                                        }}
                                                    >
                                                        {plan.mealPlan
                                                            .split("\n")
                                                            .slice(0, 3)
                                                            .join("\n")}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleFavorite(plan.id)
                                                }
                                                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out ${
                                                    plan.favorite
                                                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                        : "bg-zinc-100 text-zinc-600 hover:bg-yellow-100 hover:text-yellow-700"
                                                }`}
                                            >
                                                {plan.favorite
                                                    ? "⭐ Favorited"
                                                    : "☆ Add Favorite"}
                                            </button>
                                        </div>

                                        {/* Preference Badges */}
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            <span className="active:scale-[0.98] rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
                                                🍛 {plan.foodType}
                                            </span>

                                            <span className="active:scale-[0.98] rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                                                💰 Rs. {plan.budget}
                                            </span>

                                            <span className="active:scale-[0.98] rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                                                🍽️ {plan.mealType}
                                            </span>

                                            <span className="active:scale-[0.98] rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
                                                🥗 {plan.diet}
                                            </span>

                                            {plan.goal && (
                                                <span className="active:scale-[0.98] rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700">
                                                    🎯 {plan.goal}
                                                </span>
                                            )}

                                            {plan.servings && (
                                                <span className="active:scale-[0.98] rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                                                    👥 {plan.servings} people
                                                </span>
                                            )}

                                            {plan.spiceLevel && (
                                                <span className="active:scale-[0.98] rounded-full bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
                                                    🌶️ {plan.spiceLevel}
                                                </span>
                                            )}

                                            {plan.city && (
                                                <span className="active:scale-[0.98] rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
                                                    📍 {plan.city}
                                                </span>
                                            )}
                                        </div>

                                        {/* Preview */}
                                        {!isOpen && (
                                            <div className="mt-6 rounded-2xl bg-[#fffaf5] p-5">
                                                <p className="line-clamp-3 text-sm leading-7 text-zinc-600">
                                                    {plan.mealPlan
                                                        .replace(/^#+\s*/gm, "")
                                                        .replace(/\*\*/g, "")
                                                        .slice(0, 350)}
                                                    {plan.mealPlan.length > 350
                                                        ? "..."
                                                        : ""}
                                                </p>
                                            </div>
                                        )}

                                        {/* Show / Hide */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                togglePlan(plan.id)
                                            }
                                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-all duration-200 ease-out hover:text-orange-700"
                                        >
                                            {isOpen
                                                ? "⌃ Hide full meal plan"
                                                : "⌄ View full meal plan"}
                                        </button>
                                    </div>

                                    {/* Full Meal Plan */}
                                    {isOpen && (
                                        <div className="border-t border-zinc-100 bg-[#fffaf5] p-6 md:p-8">
                                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 md:p-7">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ children }) => (
                                                            <h2 className="mb-5 mt-1 text-3xl font-bold tracking-tight text-orange-700">
                                                                {children}
                                                            </h2>
                                                        ),

                                                        h2: ({ children }) => (
                                                            <h3 className="mb-3 mt-8 border-b border-orange-100 pb-2 text-xl font-bold text-orange-600">
                                                                {children}
                                                            </h3>
                                                        ),

                                                        h3: ({ children }) => (
                                                            <h4 className="mb-2 mt-6 text-lg font-bold text-zinc-800">
                                                                {children}
                                                            </h4>
                                                        ),

                                                        p: ({ children }) => (
                                                            <p className="mb-4 text-base leading-8 text-zinc-700">
                                                                {children}
                                                            </p>
                                                        ),

                                                        ul: ({ children }) => (
                                                            <ul className="mb-5 list-disc space-y-2 pl-6 text-zinc-700">
                                                                {children}
                                                            </ul>
                                                        ),

                                                        ol: ({ children }) => (
                                                            <ol className="mb-5 list-decimal space-y-3 pl-6 text-zinc-700">
                                                                {children}
                                                            </ol>
                                                        ),

                                                        li: ({ children }) => (
                                                            <li className="pl-1 leading-7">
                                                                {children}
                                                            </li>
                                                        ),

                                                        strong: ({ children }) => (
                                                            <strong className="font-bold text-zinc-900">
                                                                {children}
                                                            </strong>
                                                        ),

                                                        blockquote: ({ children }) => (
                                                            <blockquote className="my-5 rounded-r-2xl border-l-4 border-orange-400 bg-orange-50 px-5 py-4 text-zinc-700">
                                                                {children}
                                                            </blockquote>
                                                        ),
                                                    }}
                                                >
                                                    {plan.mealPlan}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* Card Footer */}
                                    <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/70 p-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
                                        <p className="text-xs text-zinc-400">
                                            {plan.planType === "weekly" || plan.mealType === "Weekly Plan"
                                                ? "LocalPlate AI saved weekly plan"
                                                : "LocalPlate AI saved meal"}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => useAgain(plan)}
                                                className="active:scale-[0.98] rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-orange-700"
                                            >
                                                🔁 Use Again
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deletePlan(plan.id)}
                                                className="active:scale-[0.98] rounded-full bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 ease-out hover:bg-red-100"
                                            >
                                                🗑️ Delete Plan
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                {/* Bottom CTA */}
                {savedPlans.length > 0 && (
                    <section className="mt-10 rounded-[2rem] bg-zinc-950 p-8 text-center text-white shadow-xl md:p-10">
                        <div className="mx-auto max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
                                Keep planning
                            </p>

                            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                                Need another meal?
                            </h2>

                            <p className="mt-3 leading-7 text-zinc-400">
                                Create a fresh personalized meal plan based on
                                your budget, taste and ingredients.
                            </p>

                            <a
                                href="/planner"
                                className="mt-6 inline-flex rounded-full bg-orange-600 px-7 py-3.5 font-semibold text-white transition-all duration-200 ease-out hover:bg-orange-700"
                            >
                                Create New Meal Plan →
                            </a>
                        </div>
                    </section>
                )}

            </div>
        </main>
    );
}