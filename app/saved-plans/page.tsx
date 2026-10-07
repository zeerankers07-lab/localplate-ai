"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 8;

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

type PlanFilter = "all" | "favorites" | "weekly" | "single";
type PlanSort = "newest" | "oldest" | "favorites";

type Toast = {
    id: number;
    message: string;
    tone: "success" | "error";
};

const isWeeklyPlan = (plan: SavedPlan) =>
    plan.planType === "weekly" || plan.mealType === "Weekly Plan";

function getPlanTitle(plan: SavedPlan) {
    const first = plan.mealPlan
        .split("\n")
        .map((line) => line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())
        .find(Boolean);

    return first || "Meal Plan";
}

const planTime = (plan: SavedPlan) => {
    const value = new Date(plan.createdAt).getTime();
    return Number.isNaN(value) ? 0 : value;
};

export default function SavedPlansPage() {
    const router = useRouter();

    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<PlanFilter>("all");
    const [sort, setSort] = useState<PlanSort>("newest");
    const [openPlans, setOpenPlans] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const [planToDelete, setPlanToDelete] = useState<SavedPlan | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [toast, setToast] = useState<Toast | null>(null);
    const toastTimer = useRef<number | null>(null);

    const showToast = (
        message: string,
        tone: "success" | "error" = "success"
    ) => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);

        setToast({ id: Date.now(), message, tone });

        toastTimer.current = window.setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
    }, []);

    // Delete dialog: Escape closes it, page does not scroll behind it.
    useEffect(() => {
        if (!planToDelete) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !deleting) {
                setPlanToDelete(null);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [planToDelete, deleting]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchTerm, filter, sort]);

    const deletePlan = async (id: number): Promise<boolean> => {
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

            showToast("Plan deleted");
            return true;
        } catch (error) {
            console.error("Failed to delete saved plan:", error);
            showToast("Could not delete the plan. Please try again.", "error");
            return false;
        }
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;

        setDeleting(true);
        await deletePlan(planToDelete.id);
        setDeleting(false);
        setPlanToDelete(null);
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

            showToast(
                nextFavorite
                    ? "Added to favorites"
                    : "Removed from favorites"
            );
        } catch (error) {
            console.error("Failed to update favorite:", error);
            showToast("Could not update favorite. Please try again.", "error");
        }
    };

    const togglePlan = (id: number) => {
        setOpenPlans((current) =>
            current.includes(id)
                ? current.filter((planId) => planId !== id)
                : [...current, id]
        );
    };

    const copyPlan = async (plan: SavedPlan) => {
        try {
            await navigator.clipboard.writeText(plan.mealPlan);
            showToast("Meal plan copied");
        } catch (error) {
            console.error("Failed to copy plan:", error);
            showToast("Could not copy the plan.", "error");
        }
    };

    const openShoppingList = (plan: SavedPlan) => {
        try {
            localStorage.setItem("localplate_shopping_list", plan.mealPlan);
            router.push("/shopping-list");
        } catch (error) {
            console.error("Failed to open shopping list:", error);
            showToast("Could not open the shopping list.", "error");
        }
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
            showToast("Could not reuse this plan. Please try again.", "error");
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/planner");
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
                    // Keep the ISO timestamp so sorting is reliable;
                    // formatSavedDate() formats it for display.
                    createdAt: String(plan.created_at),
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

    const favoriteCount = savedPlans.filter((plan) => plan.favorite).length;
    const weeklyCount = savedPlans.filter(isWeeklyPlan).length;
    const singleCount = savedPlans.length - weeklyCount;

    const filteredPlans = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        const matches = savedPlans.filter((plan) => {
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
                filter === "all" ||
                (filter === "favorites" && plan.favorite) ||
                (filter === "weekly" && isWeeklyPlan(plan)) ||
                (filter === "single" && !isWeeklyPlan(plan));

            return matchesSearch && matchesFilter;
        });

        const sorted = [...matches];

        if (sort === "oldest") {
            sorted.sort((a, b) => planTime(a) - planTime(b));
        } else if (sort === "favorites") {
            sorted.sort(
                (a, b) =>
                    Number(b.favorite) - Number(a.favorite) ||
                    planTime(b) - planTime(a)
            );
        } else {
            sorted.sort((a, b) => planTime(b) - planTime(a));
        }

        return sorted;
    }, [savedPlans, searchTerm, filter, sort]);

    const shownPlans = filteredPlans.slice(0, visibleCount);
    const hasActiveFilters =
        searchTerm.trim() !== "" || filter !== "all" || sort !== "newest";

    const resetFilters = () => {
        setSearchTerm("");
        setFilter("all");
        setSort("newest");
    };

    return (
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 text-zinc-900 md:px-8 md:pt-8">
            {/* Sticky top bar */}
            <header className="sticky top-0 z-30 -mx-4 -mt-6 mb-6 border-b border-orange-100 bg-[#fffaf5]/90 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
                <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back"
                        className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-white pl-3 pr-4 text-sm font-bold text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 active:scale-95"
                    >
                        <span
                            aria-hidden="true"
                            className="text-lg leading-none transition-transform duration-200 group-hover:-translate-x-0.5"
                        >
                            ←
                        </span>
                        <span>Back</span>
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900">
                            Saved Plans
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                            {savedPlans.length} saved · {favoriteCount} favorites
                        </p>
                    </div>

                    <a
                        href="/shopping-list"
                        aria-label="Shopping List"
                        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-green-200 bg-white px-3.5 text-sm font-bold text-green-700 shadow-sm transition hover:bg-green-50 active:scale-95 sm:px-4"
                    >
                        <span aria-hidden="true">🛒</span>
                        <span className="hidden sm:inline">Shopping List</span>
                    </a>

                    <a
                        href="/planner"
                        aria-label="Create new meal plan"
                        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-orange-600 px-4 text-sm font-bold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-700 active:scale-95"
                    >
                        <span aria-hidden="true">＋</span>
                        <span>
                            New<span className="hidden sm:inline"> Plan</span>
                        </span>
                    </a>
                </div>
            </header>

            <div className="mx-auto max-w-6xl">
                {/* Title */}
                <section>
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                        💾 Your Collection
                    </div>

                    <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Saved Meal
                        <span className="text-orange-600"> Plans.</span>
                    </h1>
                </section>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                    {[
                        ["Total", savedPlans.length, "text-zinc-900"],
                        ["Favorites", favoriteCount, "text-orange-600"],
                        ["Weekly", weeklyCount, "text-indigo-600"],
                        ["Single meals", singleCount, "text-green-600"],
                    ].map(([label, value, color]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5"
                        >
                            <p className="text-xs font-medium text-zinc-500 sm:text-sm">
                                {label}
                            </p>
                            <p
                                className={`mt-1 text-2xl font-bold sm:text-3xl ${color}`}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Search, filters, sort */}
                <section className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base"
                            >
                                🔎
                            </span>

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search meals, diets, ingredients..."
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-xs text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            value={sort}
                            onChange={(event) =>
                                setSort(event.target.value as PlanSort)
                            }
                            aria-label="Sort plans"
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 lg:w-52"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="favorites">Favorites first</option>
                        </select>
                    </div>

                    <div className="-mx-1 mt-4 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                        {(
                            [
                                ["all", "All Plans", savedPlans.length],
                                ["favorites", "⭐ Favorites", favoriteCount],
                                ["weekly", "📅 Weekly", weeklyCount],
                                ["single", "🍽️ Single", singleCount],
                            ] as [PlanFilter, string, number][]
                        ).map(([value, label, count]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                aria-pressed={filter === value}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${filter === value
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-orange-50 hover:text-orange-700"
                                    }`}
                            >
                                {label}
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[11px] ${filter === value
                                            ? "bg-white/25 text-white"
                                            : "bg-white text-zinc-500"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        ))}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="ml-1 shrink-0 text-sm font-bold text-orange-600 hover:text-orange-700"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Loading */}
                {loading ? (
                    <section className="mt-6 space-y-4" aria-busy="true">
                        {[0, 1, 2].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6"
                            >
                                <div className="h-4 w-28 rounded-full bg-zinc-100" />
                                <div className="mt-4 h-7 w-3/4 rounded-lg bg-zinc-100" />
                                <div className="mt-5 flex gap-2">
                                    <div className="h-8 w-20 rounded-full bg-zinc-100" />
                                    <div className="h-8 w-24 rounded-full bg-zinc-100" />
                                    <div className="h-8 w-20 rounded-full bg-zinc-100" />
                                </div>
                                <div className="mt-5 h-16 rounded-2xl bg-zinc-50" />
                            </div>
                        ))}
                    </section>
                ) : savedPlans.length === 0 ? (
                    <section className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-white p-8 text-center shadow-sm sm:p-14">
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
                            className="mt-7 inline-flex items-center rounded-full bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-95"
                        >
                            Create My First Meal Plan →
                        </a>
                    </section>
                ) : filteredPlans.length === 0 ? (
                    <section className="mt-6 rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-sm sm:p-12">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                            🔎
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-zinc-800">
                            No matching meal plans
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Try another search term or reset the filters.
                        </p>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-5 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 active:scale-95"
                        >
                            Show All Plans
                        </button>
                    </section>
                ) : (
                    <>
                        <p className="mt-6 text-sm text-zinc-500">
                            Showing{" "}
                            <span className="font-bold text-zinc-800">
                                {shownPlans.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-bold text-zinc-800">
                                {filteredPlans.length}
                            </span>{" "}
                            plans
                        </p>

                        <section className="mt-3 space-y-4 sm:space-y-5">
                            {shownPlans.map((plan) => {
                                const isOpen = openPlans.includes(plan.id);
                                const weekly = isWeeklyPlan(plan);

                                return (
                                    <article
                                        key={plan.id}
                                        className={`overflow-hidden rounded-3xl border border-l-4 border-zinc-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg ${weekly
                                                ? "border-l-indigo-500"
                                                : "border-l-orange-500"
                                            }`}
                                    >
                                        <div className="p-4 sm:p-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-zinc-500">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${weekly
                                                                    ? "bg-indigo-50 text-indigo-700"
                                                                    : "bg-orange-50 text-orange-700"
                                                                }`}
                                                        >
                                                            {weekly
                                                                ? "📅 Weekly plan"
                                                                : "🍽️ Single meal"}
                                                        </span>

                                                        <span>
                                                            {formatSavedDate(
                                                                plan.createdAt
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3">
                                                        <ReactMarkdown
                                                            components={{
                                                                h1: ({ children }) => (
                                                                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                                                                        {children}
                                                                    </h2>
                                                                ),
                                                                p: ({ children }) => (
                                                                    <p className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
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
                                                    aria-pressed={plan.favorite}
                                                    aria-label={
                                                        plan.favorite
                                                            ? "Remove from favorites"
                                                            : "Add to favorites"
                                                    }
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition active:scale-90 ${plan.favorite
                                                            ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-200"
                                                            : "bg-zinc-100 text-zinc-400 hover:bg-yellow-100 hover:text-yellow-500"
                                                        }`}
                                                >
                                                    {plan.favorite ? "★" : "☆"}
                                                </button>
                                            </div>

                                            {/* Preference badges */}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
                                                    🍛 {plan.foodType}
                                                </span>

                                                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                                                    💰 Rs. {plan.budget}
                                                </span>

                                                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                                                    🍽️ {plan.mealType}
                                                </span>

                                                <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
                                                    🥗 {plan.diet}
                                                </span>

                                                {plan.goal && (
                                                    <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">
                                                        🎯 {plan.goal}
                                                    </span>
                                                )}

                                                {plan.servings && (
                                                    <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                                                        👥 {plan.servings} people
                                                    </span>
                                                )}

                                                {plan.spiceLevel && (
                                                    <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700">
                                                        🌶️ {plan.spiceLevel}
                                                    </span>
                                                )}

                                                {plan.city && (
                                                    <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700">
                                                        📍 {plan.city}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Preview */}
                                            {!isOpen && (
                                                <div className="mt-4 rounded-2xl bg-[#fffaf5] p-4">
                                                    <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
                                                        {plan.mealPlan
                                                            .replace(/^#+\s*/gm, "")
                                                            .replace(/\*\*/g, "")
                                                            .slice(0, 350)}
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => togglePlan(plan.id)}
                                                aria-expanded={isOpen}
                                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-sm font-bold text-orange-700 transition hover:bg-orange-100 active:scale-[0.98] sm:w-auto sm:px-5"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                                        }`}
                                                >
                                                    ▾
                                                </span>
                                                {isOpen
                                                    ? "Hide full meal plan"
                                                    : "View full meal plan"}
                                            </button>
                                        </div>

                                        {/* Full meal plan */}
                                        {isOpen && (
                                            <div className="border-t border-zinc-100 bg-[#fffaf5] p-3 sm:p-6">
                                                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 sm:p-7">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: ({ children }) => (
                                                                <h2 className="mb-4 mt-1 text-2xl font-bold tracking-tight text-orange-700 sm:text-3xl">
                                                                    {children}
                                                                </h2>
                                                            ),

                                                            h2: ({ children }) => (
                                                                <h3 className="mb-3 mt-7 border-b border-orange-100 pb-2 text-lg font-bold text-orange-600 sm:text-xl">
                                                                    {children}
                                                                </h3>
                                                            ),

                                                            h3: ({ children }) => (
                                                                <h4 className="mb-2 mt-5 text-base font-bold text-zinc-800 sm:text-lg">
                                                                    {children}
                                                                </h4>
                                                            ),

                                                            p: ({ children }) => (
                                                                <p className="mb-4 text-[15px] leading-7 text-zinc-700 sm:text-base sm:leading-8">
                                                                    {children}
                                                                </p>
                                                            ),

                                                            ul: ({ children }) => (
                                                                <ul className="mb-5 list-disc space-y-2 pl-5 text-zinc-700 sm:pl-6">
                                                                    {children}
                                                                </ul>
                                                            ),

                                                            ol: ({ children }) => (
                                                                <ol className="mb-5 list-decimal space-y-3 pl-5 text-zinc-700 sm:pl-6">
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
                                                                <blockquote className="my-5 rounded-r-2xl border-l-4 border-orange-400 bg-orange-50 px-4 py-3 text-zinc-700 sm:px-5 sm:py-4">
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

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 bg-zinc-50/70 p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2.5 sm:p-4 sm:px-6">
                                            <button
                                                type="button"
                                                onClick={() => useAgain(plan)}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.97] sm:rounded-full sm:px-5"
                                            >
                                                <span aria-hidden="true">🔁</span>
                                                Use Again
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openShoppingList(plan)}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-bold text-green-700 transition hover:bg-green-100 active:scale-[0.97] sm:rounded-full sm:px-5"
                                            >
                                                <span aria-hidden="true">🛒</span>
                                                Shopping List
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => copyPlan(plan)}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.97] sm:rounded-full sm:px-5"
                                            >
                                                <span aria-hidden="true">📋</span>
                                                Copy
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPlanToDelete(plan)}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.97] sm:rounded-full sm:px-5"
                                            >
                                                <span aria-hidden="true">🗑️</span>
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>

                        {filteredPlans.length > visibleCount && (
                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVisibleCount(
                                            (count) => count + PAGE_SIZE
                                        )
                                    }
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-orange-200 bg-white px-7 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 active:scale-95"
                                >
                                    Show more (
                                    {filteredPlans.length - visibleCount} left)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
                >
                    <div
                        key={toast.id}
                        className={`sp-sheet pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.tone === "error"
                                ? "bg-red-600"
                                : "bg-zinc-900"
                            }`}
                    >
                        <span aria-hidden="true">
                            {toast.tone === "error" ? "⚠️" : "✓"}
                        </span>
                        <span className="min-w-0 flex-1">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Delete dialog (bottom sheet on mobile) */}
            {planToDelete && (
                <div
                    className="sp-fade fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => {
                        if (!deleting) setPlanToDelete(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-plan-title"
                        aria-describedby="delete-plan-desc"
                        className="sp-sheet w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:pb-6 sm:pt-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 sm:hidden" />

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                                🗑️
                            </div>

                            <div className="min-w-0">
                                <h3
                                    id="delete-plan-title"
                                    className="text-xl font-bold text-zinc-900"
                                >
                                    Delete this plan?
                                </h3>
                                <p
                                    id="delete-plan-desc"
                                    className="mt-1 text-sm leading-6 text-zinc-500"
                                >
                                    Ye plan hamesha ke liye delete ho jayega aur
                                    wapas nahi aayega.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                                {isWeeklyPlan(planToDelete)
                                    ? "Weekly plan"
                                    : "Single meal"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-bold text-zinc-900">
                                {getPlanTitle(planToDelete)}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setPlanToDelete(null)}
                                disabled={deleting}
                                className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Yes, delete plan"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes sp-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sp-sheet-up {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes sp-pop {
                    from { opacity: 0; transform: translateY(10px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .sp-fade { animation: sp-fade-in 0.2s ease-out both; }
                .sp-sheet { animation: sp-sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
                @media (min-width: 640px) { .sp-sheet { animation-name: sp-pop; } }
                @media (prefers-reduced-motion: reduce) {
                    .sp-fade, .sp-sheet { animation: none !important; }
                }
            `}</style>
        </main>
    );
}