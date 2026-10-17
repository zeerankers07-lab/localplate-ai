"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  DEFAULT_CURRENCY,
  MARKETS,
  PRICE_AMOUNT,
  PRICE_PREFIX,
  detectCurrencyFromText,
  formatAmount,
  moneyTemplate,
  priceAccuracyRules,
  priceRule,
  symbolPrefix,
  toNumber,
} from "@/lib/currency";

// =========================
// Options
// =========================

const GOALS = ["Weight Loss", "Muscle Gain", "Maintain Weight", "Healthy Eating"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const DIETS = ["Normal", "Vegetarian", "High Protein"];
const TIMES = ["15", "30", "60"];
const SERVINGS = ["1", "2", "3", "4", "5", "6"];
const SPICE_LEVELS = ["Mild", "Medium", "Spicy"];

const PANTRY_SUGGESTIONS = [
  "Rice",
  "Daal",
  "Chicken",
  "Eggs",
  "Potatoes",
  "Onions",
  "Tomatoes",
  "Flour",
];

const ALLERGY_SUGGESTIONS = ["Peanuts", "Dairy", "Eggs", "Gluten", "Fish"];

// Food type and budget depend on the selected currency (see lib/currency.ts).
const DEFAULTS = {
  mealType: "Lunch",
  diet: "Normal",
  time: "30",
  goal: "Healthy Eating",
  servings: "2",
  spiceLevel: "Medium",
};

type ReusePreferences = Partial<
  Record<
    | "foodType"
    | "budget"
    | "currency"
    | "mealType"
    | "diet"
    | "time"
    | "goal"
    | "servings"
    | "city"
    | "spiceLevel"
    | "allergies"
    | "dislikes"
    | "pantry"
    | "extraPreferences",
    string
  >
>;

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

// =========================
// Small helpers (module level)
// =========================

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleListItem(current: string, item: string) {
  const items = splitList(current);
  const exists = items.some(
    (entry) => entry.toLowerCase() === item.toLowerCase()
  );

  return (
    exists
      ? items.filter((entry) => entry.toLowerCase() !== item.toLowerCase())
      : [...items, item]
  ).join(", ");
}

function hasListItem(current: string, item: string) {
  return splitList(current).some(
    (entry) => entry.toLowerCase() === item.toLowerCase()
  );
}

const HEADING_KEYS: Record<string, TranslationKey> = {
  "🛒 Ingredients": "pl.hIngredients",
  "👨‍🍳 Cooking Instructions": "pl.hSteps",
  "💰 Estimated Cost": "pl.hCost",
  "⏱️ Cooking Time": "pl.hTime",
  "🎯 Why This Fits You": "pl.hWhy",
  "💡 LocalPlate Tip": "pl.hTip",
};

type ChipGroupProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns?: string;
  format?: (value: string) => string;
};

function ChipGroup({
  options,
  value,
  onChange,
  columns = "grid-cols-3",
  format,
}: ChipGroupProps) {
  return (
    <div className={`mt-3 grid gap-2.5 ${columns}`}>
      {options.map((option) => {
        const active = option === value;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={`flex min-h-12 items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold leading-tight transition active:scale-95 ${active
              ? "border-orange-600 bg-orange-600 text-white shadow-sm shadow-orange-200"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
              }`}
          >
            {format ? format(option) : option}
          </button>
        );
      })}
    </div>
  );
}

type StepCardProps = {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function StepCard({ step, title, subtitle, children }: StepCardProps) {
  return (
    <section className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 space-y-7">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-zinc-900">{children}</p>;
}

const inputClass =
  "mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 sm:text-sm";

// =========================
// Page
// =========================

export default function PlannerPage() {
  const { t, label, lang, currency, currencyReady } = useI18n();
  const market = MARKETS[currency];

  const trHeading = (children: React.ReactNode) => {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children) && children.every((c) => typeof c === "string")
          ? children.join("")
          : null;
    const key = text ? HEADING_KEYS[text.trim()] : undefined;

    return key ? t(key) : children;
  };

  const router = useRouter();

  // Planner preferences
  const [foodType, setFoodType] = useState(
    MARKETS[DEFAULT_CURRENCY].defaultFoodType
  );
  const [budget, setBudget] = useState(MARKETS[DEFAULT_CURRENCY].defaultBudget);
  const [mealType, setMealType] = useState(DEFAULTS.mealType);
  const [diet, setDiet] = useState(DEFAULTS.diet);
  const [time, setTime] = useState(DEFAULTS.time);

  // New preferences
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [servings, setServings] = useState(DEFAULTS.servings);
  const [city, setCity] = useState("");
  const [spiceLevel, setSpiceLevel] = useState(DEFAULTS.spiceLevel);
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [pantry, setPantry] = useState("");
  const [extraPreferences, setExtraPreferences] = useState("");
  const [showMore, setShowMore] = useState(false);

  // AI result state
  const [mealPlan, setMealPlan] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Toast
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

  // =========================
  // Load preferences from "Use Again" / Quick Start. The budget and food type
  // always follow the selected currency: saved ones are used only when they
  // were chosen in the same currency.
  // =========================

  const reuseLoaded = useRef(false);

  useEffect(() => {
    if (!currencyReady) return;

    const applyPreferences = () => {
      const activeMarket = MARKETS[currency];
      let preferences: ReusePreferences | null = null;

      if (!reuseLoaded.current) {
        reuseLoaded.current = true;

        try {
          const saved = localStorage.getItem("localplate_reuse_preferences");

          if (saved) {
            preferences = JSON.parse(saved) as ReusePreferences;
            localStorage.removeItem("localplate_reuse_preferences");
          }
        } catch (error) {
          console.error("Failed to load saved planner preferences:", error);
          localStorage.removeItem("localplate_reuse_preferences");
        }
      }

      const sameCurrency =
        !preferences?.currency || preferences.currency === currency;

      setBudget(
        preferences?.budget && sameCurrency
          ? String(preferences.budget)
          : activeMarket.defaultBudget
      );
      setFoodType(preferences?.foodType || activeMarket.defaultFoodType);

      if (!preferences) return;

      if (preferences.mealType) setMealType(preferences.mealType);
      if (preferences.diet) setDiet(preferences.diet);
      if (preferences.time) setTime(preferences.time);
      if (preferences.goal) setGoal(preferences.goal);
      if (preferences.servings) setServings(preferences.servings);
      if (preferences.city !== undefined) setCity(preferences.city);
      if (preferences.spiceLevel) setSpiceLevel(preferences.spiceLevel);
      if (preferences.allergies !== undefined) {
        setAllergies(preferences.allergies);
      }
      if (preferences.dislikes !== undefined) {
        setDislikes(preferences.dislikes);
      }
      if (preferences.pantry !== undefined) setPantry(preferences.pantry);
      if (preferences.extraPreferences !== undefined) {
        setExtraPreferences(preferences.extraPreferences);
      }
    };

    // Deferred so the state updates are not synchronous in the effect body.
    const timer = window.setTimeout(applyPreferences, 0);

    return () => window.clearTimeout(timer);
  }, [currencyReady, currency]);

  // Scroll to the result (or loading card) when it appears.
  useEffect(() => {
    if (!mealPlan && !loading && !errorMessage) return;

    const timer = window.setTimeout(() => {
      document.getElementById("meal-result")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [mealPlan, loading, errorMessage]);

  const estimatedCost = useMemo(() => {
    const match = mealPlan.match(
      new RegExp(String.raw`Total:?\**\s*${PRICE_PREFIX}\s*${PRICE_AMOUNT}`, "i")
    );

    return match ? toNumber(match[1]) : null;
  }, [mealPlan]);

  // The currency the plan was written in (it may differ from the selected one
  // if the person switched currency after generating).
  const planCurrency = useMemo(
    () => detectCurrencyFromText(mealPlan) ?? currency,
    [mealPlan, currency]
  );

  const budgetNumber = Number(budget);
  const costPercent =
    estimatedCost !== null && budgetNumber > 0
      ? Math.min(Math.round((estimatedCost / budgetNumber) * 100), 100)
      : null;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const resetPreferences = () => {
    setFoodType(market.defaultFoodType);
    setBudget(market.defaultBudget);
    setMealType(DEFAULTS.mealType);
    setDiet(DEFAULTS.diet);
    setTime(DEFAULTS.time);
    setGoal(DEFAULTS.goal);
    setServings(DEFAULTS.servings);
    setSpiceLevel(DEFAULTS.spiceLevel);
    setCity("");
    setAllergies("");
    setDislikes("");
    setPantry("");
    setExtraPreferences("");
    showToast(t("pl.tReset"));
  };

  // =========================
  // Generate Meal Plan
  // =========================

  async function generatePlan() {
    if (loading) return;

    if (!budget || Number(budget) <= 0) {
      showToast(t("pl.tBudget"), "error");
      return;
    }

    setLoading(true);
    setMealPlan("");
    setErrorMessage("");
    setSaved(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `
You are LocalPlate AI, an expert ${market.foodAdj}food, nutrition and meal-planning assistant.

Your job is to create ONE practical, realistic and personalized meal recommendation.

The recommendation must feel useful for a real household in ${market.country}.

=========================
USER PREFERENCES
=========================

Food type:
${foodType}

Meal:
${mealType}

Goal:
${goal}

Budget:
${symbolPrefix(currency)}${budget} (${currency})

Number of people:
${servings}

Diet:
${diet}

Maximum cooking time:
${time} minutes

City / Local Area:
${city || "Not specified"}

Spice level:
${spiceLevel}

Allergies:
${allergies || "None specified"}

Foods the user dislikes:
${dislikes || "None specified"}

Ingredients the user already has:
${pantry || "None specified"}

Additional preferences:
${extraPreferences || "None specified"}

=========================
IMPORTANT RULES
=========================

1. Give ONE best meal recommendation only.

2. Prefer ${market.foodFocus} dishes when appropriate, unless the food type selected above says otherwise.

3. Prefer ingredients that are commonly available in ${market.country}.

4. Use the user's existing pantry ingredients whenever practical.

5. Avoid unnecessary ingredients if suitable pantry ingredients are already available.

6. Keep the estimated total cost within the user's selected budget.

7. The budget is for this meal and the selected number of people.

8. ${priceRule(currency)} Write every price with the symbol before the number, for example ${formatAmount(market.priceExample, currency)}. Never use another currency.

${priceAccuracyRules(currency)}

9. Do not suggest expensive or difficult-to-find ingredients unless absolutely necessary.

10. Respect the user's selected diet.

11. Respect allergies strictly.

12. Never recommend an ingredient listed under allergies.

13. Avoid foods the user said they dislike.

14. Respect the selected cooking time.

15. Respect the selected spice level.

16. Respect the user's goal.

17. Make the quantities appropriate for the selected number of people.

18. If the budget is low, prioritize simple and affordable ingredients.

19. If the user has pantry ingredients, try to build the meal around them.

20. If the city is provided, prefer food and ingredients commonly available in that area of ${market.country}, but do not invent exact store prices.

21. Do not make medical claims.

22. Do not recommend unsafe diets or extreme calorie restriction.

23. Keep the meal practical for a normal ${market.demonym} household.

24. Do not give multiple alternatives.

25. Do not write a long introduction.
26. Write the meal name, description, ingredient names, steps, bullet points and tip in ${lang === "ur" ? "Urdu (اردو), in Urdu script, not Roman Urdu" : lang === "hi" ? "Hindi (हिन्दी), in Devanagari script" : "English"}. Keep every "#" section heading exactly as shown in the response format below (in English). Use Latin digits (0-9), write units (${market.units}) in English letters and write every price with the currency symbol exactly as shown.

=========================
RESPONSE FORMAT
=========================

# 🍽️ Meal Name

**Description:** Give a short description explaining why this meal fits the user's preferences.

## 🛒 Ingredients

Use this format:

- Ingredient — quantity — price

If you are not sure of the price of an item, write only "- Ingredient — quantity" with no price.

Include all important ingredients.

## 👨‍🍳 Cooking Instructions

Give clear numbered steps.

1. Step one
2. Step two
3. Step three
4. Continue until the meal is ready

## 💰 Estimated Cost

**Total: ${moneyTemplate(currency, "XXX")}**

Make the estimated total realistic and within the selected budget.

## ⏱️ Cooking Time

**XX minutes**

## 🎯 Why This Fits You

Give 2–4 short bullet points explaining how the meal matches the user's goal, budget, diet, pantry or preferences.

## 💡 LocalPlate Tip

Give one useful cooking, budget or food-waste reduction tip.

Remember:
The meal must be realistic for a household in ${market.country}, practical to cook and stay within the selected budget.
`,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("pl.wrong"));
      }

      setMealPlan(data.reply || t("pl.noPlan"));
    } catch (error) {
      console.error("Meal generation error:", error);

      setErrorMessage(
        t("pl.genFail")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    generatePlan();
  }

  // =========================
  // Save Meal Plan
  // =========================

  const saveMealPlan = async () => {
    if (!mealPlan || savingPlan) return;

    setSavingPlan(true);

    const createdAt = new Date().toISOString();

    const newPlan = {
      mealPlan,
      foodType,
      budget,
      mealType,
      diet,
      time,
      goal,
      servings,
      city,
      spiceLevel,
      allergies,
      dislikes,
      pantry,
      extraPreferences,
      createdAt,
      favorite: false,
      planType: "single" as const,
    };

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Authentication error:", authError);
      }

      // Save to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from("saved_plans")
          .insert({
            user_id: user.id,
            meal_plan: mealPlan,
            food_type: foodType,
            budget: budget,
            meal_type: mealType,
            diet: diet,
            time: time,
            goal: goal,
            servings: servings,
            city: city,
            spice_level: spiceLevel,
            allergies: allergies,
            dislikes: dislikes,
            pantry: pantry,
            extra_preferences: extraPreferences,
            created_at: createdAt,
            favorite: false,
            plan_type: "single",
          });

        if (saveError) {
          console.error("Supabase save error:", {
            code: saveError.code,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint,
          });

          throw saveError;
        }
      }

      // Save to Local Storage
      let savedPlans: unknown[] = [];

      try {
        const parsed: unknown = JSON.parse(
          localStorage.getItem("localplate_saved_plans") || "[]"
        );

        savedPlans = Array.isArray(parsed) ? parsed : [];
      } catch {
        savedPlans = [];
      }

      const updatedPlans = [
        {
          id: Date.now(),
          ...newPlan,
        },
        ...savedPlans,
      ];

      localStorage.setItem(
        "localplate_saved_plans",
        JSON.stringify(updatedPlans)
      );

      setSaved(true);
      showToast(t("pl.tSaved"));
    } catch (error) {
      console.error("Failed to save meal plan:", error);

      showToast(t("pl.tSaveFail"), "error");
    } finally {
      setSavingPlan(false);
    }
  };

  const copyMealPlan = async () => {
    try {
      await navigator.clipboard.writeText(mealPlan);
      showToast(t("sp.tCopied"));
    } catch (error) {
      console.error("Failed to copy meal plan:", error);
      showToast(t("sp.tCopyFail"), "error");
    }
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mealPlan)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openShoppingList = () => {
    if (!mealPlan) return;

    localStorage.setItem("localplate_shopping_list", mealPlan);
    window.location.href = "/shopping-list";
  };

  const scrollToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const summaryRows: [string, string][] = [
    [t("pl.food"), label("opt", foodType)],
    [t("cook.meal"), label("opt", mealType)],
    [t("cook.budget"), budget ? formatAmount(Number(budget), currency) : "—"],
    [t("cook.people"), servings],
    [t("cook.goal"), label("opt", goal)],
    [t("cook.diet"), label("opt", diet)],
    [t("pl.time"), t("unit.min", { n: time })],
    [t("pl.spice"), label("opt", spiceLevel)],
  ];

  const pantryCount = splitList(pantry).length;
  const moreFilledCount = [city, dislikes, extraPreferences].filter(
    (value) => value.trim() !== ""
  ).length;

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-32 pt-6 text-zinc-900 md:px-8 md:pt-8 lg:pb-16">
      {/* Sticky top bar */}
      <header className="sticky top-[var(--nav-h,0px)] z-30 -mx-4 -mt-6 mb-5 border-b border-orange-100 bg-[#fffaf5]/90 px-4 py-2.5 backdrop-blur sm:mb-6 sm:py-3 md:-mx-8 md:-mt-8 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
          {/* Back */}
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("sp.goBack")}
            className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white ps-1.5 pe-4 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95"
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 transition group-hover:bg-orange-200"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 transition-transform duration-200 ltr:group-hover:-translate-x-0.5 rtl:rotate-180"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
            <span>{t("sp.back")}</span>
          </button>

          {/* Desktop: title + summary (on mobile it is shown below, in the page title) */}
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-bold text-zinc-900">
              {t("pl.aiPlanner")}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {budget ? formatAmount(Number(budget), currency) : "—"} · {label("opt", mealType)} ·{" "}
              {t("pl.people", { n: servings })}
            </p>
          </div>

          {/* Desktop links (unchanged) */}
          <Link
            href="/weekly-plan"
            aria-label={t("nav.weekly")}
            className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95 sm:inline-flex"
          >
            <span aria-hidden="true">📅</span>
            <span>Weekly Plan</span>
          </Link>

          <Link
            href="/saved-plans"
            aria-label={t("nav.saved")}
            className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 active:scale-95 sm:inline-flex"
          >
            <span aria-hidden="true">💾</span>
            <span>Saved Plans</span>
          </Link>

          {/* Mobile: compact icon buttons */}
          <div className="ms-auto inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 shadow-sm sm:hidden">
            <Link
              href="/weekly-plan"
              aria-label={t("nav.weekly")}
              title={t("nav.weekly")}
              className="flex size-10 items-center justify-center rounded-full text-indigo-600 outline-none transition hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-orange-500 active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                <path d="M8 3v4M16 3v4M3.5 10h17" />
              </svg>
            </Link>

            <span aria-hidden="true" className="h-5 w-px bg-zinc-200" />

            <Link
              href="/saved-plans"
              aria-label={t("nav.saved")}
              title={t("nav.saved")}
              className="flex size-10 items-center justify-center rounded-full text-zinc-700 outline-none transition hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M7 4.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V5.5a1 1 0 0 1 1-1z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl">
        {/* Title */}
        <section>
          {/* Mobile: AI Meal Planner + live summary */}
          <div className="sm:hidden">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("pl.aiPlanner")}
            </h1>

            <ul className="mt-3 flex flex-wrap gap-2">
              <li className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                {budget ? formatAmount(Number(budget), currency) : "—"}
              </li>
              <li className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                {label("opt", mealType)}
              </li>
              <li className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                {t("pl.people", { n: servings })}
              </li>
            </ul>
          </div>

          {/* Desktop: unchanged */}
          <h1 className="hidden text-3xl font-semibold tracking-tight sm:block">
            {t("pl.title")}
          </h1>
        </section>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          {/* Form */}
          <form
            id="planner-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Step 1 */}
            <StepCard
              step={1}
              title={t("pl.step1")}
              subtitle={t("pl.step1sub")}
            >
              <div>
                <FieldLabel>{t("pl.qFood")}</FieldLabel>
                <ChipGroup
                  options={
                    market.foodTypes.includes(foodType)
                      ? market.foodTypes
                      : [foodType, ...market.foodTypes]
                  }
                  columns={
                    market.foodTypes.length > 3
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-3"
                  }
                  format={(option) => label("opt", option)}
                  value={foodType}
                  onChange={setFoodType}
                />
              </div>

              <div>
                <FieldLabel>{t("pl.qMeal")}</FieldLabel>
                <ChipGroup
                  options={MEAL_TYPES}
                  format={(option) => label("opt", option)}
                  value={mealType}
                  onChange={setMealType}
                />
              </div>

              <div>
                <FieldLabel>{t("pl.qBudget")}</FieldLabel>
                <ChipGroup
                  options={market.budgetPresets}
                  value={budget}
                  onChange={setBudget}
                  format={(amount) => formatAmount(Number(amount), currency)}
                />

                <div className="relative mt-2.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                    {market.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budget}
                    onChange={(event) =>
                      setBudget(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder={t("pl.phBudget")}
                    aria-label={t("pl.customBudget")}
                    className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t("pl.qPeople")}</FieldLabel>
                <ChipGroup
                  options={SERVINGS}
                  value={servings}
                  onChange={setServings}
                  columns="grid-cols-6"
                />
              </div>
            </StepCard>

            {/* Step 2 */}
            <StepCard
              step={2}
              title={t("pl.step2")}
              subtitle={t("pl.step2sub")}
            >
              <div>
                <FieldLabel>{t("pl.qGoal")}</FieldLabel>
                <ChipGroup
                  options={GOALS}
                  format={(option) => label("opt", option)}
                  value={goal}
                  onChange={setGoal}
                  columns="grid-cols-2 md:grid-cols-4"
                />
              </div>

              <div>
                <FieldLabel>{t("pl.qDiet")}</FieldLabel>
                <ChipGroup
                  options={DIETS}
                  format={(option) => label("opt", option)}
                  value={diet}
                  onChange={setDiet}
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <div>
                  <FieldLabel>{t("pl.qTime")}</FieldLabel>
                  <ChipGroup
                    options={TIMES}
                    value={time}
                    onChange={setTime}
                    format={(minutes) => t("unit.min", { n: minutes })}
                  />
                </div>

                <div>
                  <FieldLabel>{t("pl.qSpice")}</FieldLabel>
                  <ChipGroup
                    options={SPICE_LEVELS}
                    format={(option) => label("opt", option)}
                    value={spiceLevel}
                    onChange={setSpiceLevel}
                  />
                </div>
              </div>
            </StepCard>

            {/* Step 3 */}
            <StepCard
              step={3}
              title={t("pl.step3")}
              subtitle={t("pl.step3sub")}
            >
              <div>
                <FieldLabel>{t("pl.qPantry")}</FieldLabel>

                <div className="mt-3 flex flex-wrap gap-2">
                  {PANTRY_SUGGESTIONS.map((item) => {
                    const active = hasListItem(pantry, item);

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setPantry((current) => toggleListItem(current, item))
                        }
                        aria-pressed={active}
                        className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${active
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-green-300 hover:bg-green-50"
                          }`}
                      >
                        {active ? "✓ " : "+ "}
                        {label("ing", item)}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={pantry}
                  onChange={(event) => setPantry(event.target.value)}
                  placeholder={t("pl.phPantry")}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-2 text-xs text-zinc-400">
                  {t("pl.pantryHint")}
                </p>
              </div>

              <div>
                <FieldLabel>{t("pl.qAllergy")}</FieldLabel>

                <div className="mt-3 flex flex-wrap gap-2">
                  {ALLERGY_SUGGESTIONS.map((item) => {
                    const active = hasListItem(allergies, item);

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setAllergies((current) =>
                            toggleListItem(current, item)
                          )
                        }
                        aria-pressed={active}
                        className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${active
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-red-300 hover:bg-red-50"
                          }`}
                      >
                        {active ? "✓ " : "+ "}
                        {label("opt", item)}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder={t("pl.phAllergy")}
                  className={inputClass}
                />
              </div>
            </StepCard>

            {/* Step 4 (optional) */}
            <section className="rounded-3xl border border-zinc-100 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setShowMore((value) => !value)}
                aria-expanded={showMore}
                className="flex w-full items-center gap-3 p-5 text-left sm:p-7"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                  4
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">
                    {t("pl.more")}
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-zinc-500">
                      {t("pl.optional")}
                    </span>
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {t("pl.moreSub")}
                    {moreFilledCount > 0 ? ` · ${moreFilledCount}` : ""}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`text-zinc-400 transition-transform duration-200 ${showMore ? "rotate-180" : ""
                    }`}
                >
                  ▾
                </span>
              </button>

              {showMore && (
                <div className="space-y-7 border-t border-zinc-100 p-5 pt-6 sm:p-7 sm:pt-7">
                  <div>
                    <FieldLabel>{t("pl.qCity")}</FieldLabel>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder={t("pl.phCity")}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>{t("pl.qDislike")}</FieldLabel>
                    <input
                      type="text"
                      value={dislikes}
                      onChange={(event) => setDislikes(event.target.value)}
                      placeholder={t("pl.phDislike")}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>{t("pl.qExtra")}</FieldLabel>
                    <textarea
                      value={extraPreferences}
                      onChange={(event) =>
                        setExtraPreferences(event.target.value)
                      }
                      placeholder={t("pl.phExtra")}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Desktop submit */}
            <div className="hidden lg:block">
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-6 text-lg font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("pl.generating")}
                  </>
                ) : (
                  t("pl.generate")
                )}
              </button>
            </div>
          </form>

          {/* Summary (desktop) */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{t("pl.yourPlan")}</h2>
                <button
                  type="button"
                  onClick={resetPreferences}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  {t("sp.reset")}
                </button>
              </div>

              <dl className="mt-4 divide-y divide-zinc-100 text-sm">
                {summaryRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="truncate font-semibold text-zinc-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-green-50 px-3 py-1.5 font-semibold text-green-700">
                  🧺 {pantryCount} pantry items
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 font-semibold ${allergies.trim()
                    ? "bg-red-50 text-red-700"
                    : "bg-zinc-100 text-zinc-500"
                    }`}
                >
                  🚫 {allergies.trim() || t("pl.noAllergies")}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Loading */}
        {loading && (
          <section
            id="meal-result"
            aria-busy="true"
            className="mt-8 scroll-mt-24 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-4">
              <span className="size-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
              <div>
                <p className="font-bold">Creating your personalized meal...</p>
                <p className="text-sm text-zinc-500">
                  {t("pl.matching")}
                </p>
              </div>
            </div>

            <div className="mt-6 animate-pulse space-y-3">
              <div className="h-6 w-2/3 rounded-lg bg-zinc-100" />
              <div className="h-4 w-full rounded-lg bg-zinc-100" />
              <div className="h-4 w-5/6 rounded-lg bg-zinc-100" />
              <div className="h-4 w-4/6 rounded-lg bg-zinc-100" />
            </div>
          </section>
        )}

        {/* Error */}
        {!loading && errorMessage && (
          <section
            id="meal-result"
            className="mt-8 scroll-mt-24 rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-8"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
              ⚠️
            </div>
            <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-sm text-zinc-500">{errorMessage}</p>
            <button
              type="button"
              onClick={generatePlan}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-orange-600 px-7 text-sm font-bold text-white transition hover:bg-orange-700 active:scale-95"
            >
              {t("pl.tryAgain")}
            </button>
          </section>
        )}

        {/* AI Result */}
        {!loading && mealPlan && (
          <section
            id="meal-result"
            className="mt-8 scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100"
          >
            <div className="p-5 sm:p-8">
              {/* Cost vs budget */}
              {estimatedCost !== null &&
                costPercent !== null &&
                planCurrency === currency && (
                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-500">
                        {t("cook.estCost")}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {formatAmount(estimatedCost, currency)} /{" "}
                        {formatAmount(budgetNumber, currency)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${estimatedCost > budgetNumber
                          ? "bg-red-500"
                          : "bg-green-600"
                          }`}
                        style={{ width: `${costPercent}%` }}
                      />
                    </div>
                    {estimatedCost > budgetNumber && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {t("pl.over")}
                      </p>
                    )}
                  </div>
                )}

              {/* Markdown result */}
              <div className="mt-5 rounded-xl bg-[#fffaf5] p-4 sm:p-6">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-1 text-2xl font-bold text-orange-700 sm:text-3xl">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-7 text-xl font-bold text-orange-600 sm:text-2xl">
                        {trHeading(children)}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-5 text-lg font-bold text-zinc-800 sm:text-xl">
                        {children}
                      </h3>
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
                      <li className="pl-1 leading-7">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-zinc-900">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {mealPlan}
                </ReactMarkdown>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
              <button
                type="button"
                onClick={saveMealPlan}
                disabled={savingPlan || saved}
                className="h-11 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingPlan
                  ? t("cook.saving")
                  : saved
                    ? t("pl.saved")
                    : t("pl.save")}
              </button>

              <button
                type="button"
                onClick={openShoppingList}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                {t("pl.shop")}
              </button>

              <details className="relative">
                <summary className="flex h-11 cursor-pointer list-none items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 marker:hidden hover:bg-zinc-50">
                  {t("ui.moreActions")} ▾
                </summary>

                <div className="absolute bottom-full start-0 z-10 mb-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-zinc-200">
                  {[
                    { label: t("pl.regen"), onClick: generatePlan },
                    { label: t("pl.copy"), onClick: copyMealPlan },
                    { label: t("pl.wa"), onClick: shareOnWhatsApp },
                    { label: t("pl.change"), onClick: scrollToForm },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      disabled={loading}
                      className="block w-full rounded-lg px-3 py-2 text-start text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </section>
        )}
      </div>

      {/* Mobile generate bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-zinc-800">
              {budget ? formatAmount(Number(budget), currency) : "—"} ·{" "}
              {label("opt", mealType)} ·{" "}
              {t("pl.people", { n: servings })}
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {label("opt", goal)} · {label("opt", diet)}
            </p>
          </div>

          <button
            type="submit"
            form="planner-form"
            disabled={loading}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-orange-600 px-6 text-sm font-bold text-white shadow-lg shadow-orange-200 transition active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {t("pl.creating")}
              </>
            ) : (
              t("pl.generateShort")
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6"
        >
          <div
            key={toast.id}
            className={`pl-sheet pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.tone === "error" ? "bg-red-600" : "bg-zinc-900"
              }`}
          >
            <span aria-hidden="true">
              {toast.tone === "error" ? "⚠️" : "✓"}
            </span>
            <span className="min-w-0 flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pl-sheet-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pl-sheet { animation: pl-sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .pl-sheet { animation: none !important; }
        }
      `}</style>
    </main>
  );
}