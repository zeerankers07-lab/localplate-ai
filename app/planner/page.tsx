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

// =========================
// Options
// =========================

const FOOD_TYPES = ["Pakistani", "Indian", "Any"];
const GOALS = ["Weight Loss", "Muscle Gain", "Maintain Weight", "Healthy Eating"];
const BUDGETS = ["500", "1000", "2000"];
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

const DEFAULTS = {
  foodType: "Pakistani",
  budget: "1000",
  mealType: "Lunch",
  diet: "Normal",
  time: "30",
  goal: "Healthy Eating",
  servings: "2",
  spiceLevel: "Medium",
};

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
            className={`flex min-h-12 items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold leading-tight transition active:scale-95 ${
              active
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
  const router = useRouter();

  // Planner preferences
  const [foodType, setFoodType] = useState(DEFAULTS.foodType);
  const [budget, setBudget] = useState(DEFAULTS.budget);
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
  // Load preferences from "Use Again" / Quick Start
  // =========================

  useEffect(() => {
    const applyReusePreferences = () => {
      const savedPreferences = localStorage.getItem(
        "localplate_reuse_preferences"
      );

      if (!savedPreferences) return;

      try {
        const preferences = JSON.parse(savedPreferences);

        if (preferences.foodType) setFoodType(preferences.foodType);
        if (preferences.budget) setBudget(preferences.budget);
        if (preferences.mealType) setMealType(preferences.mealType);
        if (preferences.diet) setDiet(preferences.diet);
        if (preferences.time) setTime(preferences.time);
        if (preferences.goal) setGoal(preferences.goal);
        if (preferences.servings) setServings(preferences.servings);
        if (preferences.city !== undefined) {
          setCity(preferences.city);
        }
        if (preferences.spiceLevel) {
          setSpiceLevel(preferences.spiceLevel);
        }
        if (preferences.allergies !== undefined) {
          setAllergies(preferences.allergies);
        }
        if (preferences.dislikes !== undefined) {
          setDislikes(preferences.dislikes);
        }
        if (preferences.pantry !== undefined) {
          setPantry(preferences.pantry);
        }
        if (preferences.extraPreferences !== undefined) {
          setExtraPreferences(preferences.extraPreferences);
        }

        localStorage.removeItem("localplate_reuse_preferences");
      } catch (error) {
        console.error("Failed to load saved planner preferences:", error);

        localStorage.removeItem("localplate_reuse_preferences");
      }
    };

    // Deferred so the state updates are not synchronous in the effect body.
    const timer = window.setTimeout(applyReusePreferences, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
    const match = mealPlan.match(/Total:?\**\s*Rs\.?\s*([\d,]+)/i);
    if (!match) return null;

    const value = Number(match[1].replace(/,/g, ""));
    return Number.isFinite(value) ? value : null;
  }, [mealPlan]);

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
    setFoodType(DEFAULTS.foodType);
    setBudget(DEFAULTS.budget);
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
    showToast("Preferences reset");
  };

  // =========================
  // Generate Meal Plan
  // =========================

  async function generatePlan() {
    if (loading) return;

    if (!budget || Number(budget) <= 0) {
      showToast("Please enter a valid budget.", "error");
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
You are LocalPlate AI, an expert Pakistani food, nutrition and meal-planning assistant.

Your job is to create ONE practical, realistic and personalized meal recommendation.

The recommendation must feel useful for a real household in Pakistan.

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
Rs. ${budget}

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

2. Prefer Pakistani and South Asian dishes when appropriate.

3. Prefer ingredients that are commonly available in Pakistan.

4. Use the user's existing pantry ingredients whenever practical.

5. Avoid unnecessary ingredients if suitable pantry ingredients are already available.

6. Keep the estimated total cost within the user's selected budget.

7. The budget is for this meal and the selected number of people.

8. Give realistic Pakistani Rupee (PKR) cost estimates.

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

20. If the city is provided, prefer food and ingredients commonly available in that area of Pakistan, but do not invent exact store prices.

21. Do not make medical claims.

22. Do not recommend unsafe diets or extreme calorie restriction.

23. Keep the meal practical for a normal Pakistani household.

24. Do not give multiple alternatives.

25. Do not write a long introduction.

=========================
RESPONSE FORMAT
=========================

# 🍽️ Meal Name

**Description:** Give a short description explaining why this meal fits the user's preferences.

## 🛒 Ingredients

Use this format:

- Ingredient — quantity — estimated cost

Include all important ingredients.

## 👨‍🍳 Cooking Instructions

Give clear numbered steps.

1. Step one
2. Step two
3. Step three
4. Continue until the meal is ready

## 💰 Estimated Cost

**Total: Rs. XXX**

Make the estimated total realistic and within the selected budget.

## ⏱️ Cooking Time

**XX minutes**

## 🎯 Why This Fits You

Give 2–4 short bullet points explaining how the meal matches the user's goal, budget, diet, pantry or preferences.

## 💡 LocalPlate Tip

Give one useful cooking, budget or food-waste reduction tip.

Remember:
The meal must be realistic for a Pakistani household, practical to cook and stay within the selected budget.
`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMealPlan(data.reply || "No meal plan received.");
    } catch (error) {
      console.error("Meal generation error:", error);

      setErrorMessage(
        "Meal plan could not be generated. Please try again."
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
      showToast("Meal plan saved");
    } catch (error) {
      console.error("Failed to save meal plan:", error);

      showToast("Could not save the meal plan. Please try again.", "error");
    } finally {
      setSavingPlan(false);
    }
  };

  const copyMealPlan = async () => {
    try {
      await navigator.clipboard.writeText(mealPlan);
      showToast("Meal plan copied");
    } catch (error) {
      console.error("Failed to copy meal plan:", error);
      showToast("Could not copy the meal plan.", "error");
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
    ["Food", foodType],
    ["Meal", mealType],
    ["Budget", budget ? `Rs. ${budget}` : "—"],
    ["People", servings],
    ["Goal", goal],
    ["Diet", diet],
    ["Time", `${time} min`],
    ["Spice", spiceLevel],
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
              AI Meal Planner
            </p>
            <p className="truncate text-xs text-zinc-500">
              Rs. {budget || "—"} · {mealType} · {servings} people
            </p>
          </div>

          <Link
            href="/weekly-plan"
            aria-label="Weekly Plan"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95 sm:px-4"
          >
            <span aria-hidden="true">📅</span>
            <span className="hidden sm:inline">Weekly Plan</span>
          </Link>

          <Link
            href="/saved-plans"
            aria-label="Saved Plans"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 active:scale-95 sm:px-4"
          >
            <span aria-hidden="true">💾</span>
            <span className="hidden sm:inline">Saved Plans</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">
        {/* Title */}
        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
            ✨ AI Meal Planner
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Your meal.
            <span className="text-orange-600"> Your way.</span>
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Tell LocalPlate AI your budget, goal and pantry. We will create one
            practical meal just for you.
          </p>
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
              title="The basics"
              subtitle="Food style, meal, budget and people"
            >
              <div>
                <FieldLabel>What kind of food do you prefer?</FieldLabel>
                <ChipGroup
                  options={FOOD_TYPES}
                  value={foodType}
                  onChange={setFoodType}
                />
              </div>

              <div>
                <FieldLabel>Which meal are you planning?</FieldLabel>
                <ChipGroup
                  options={MEAL_TYPES}
                  value={mealType}
                  onChange={setMealType}
                />
              </div>

              <div>
                <FieldLabel>Budget for this meal</FieldLabel>
                <ChipGroup
                  options={BUDGETS}
                  value={budget}
                  onChange={setBudget}
                  format={(amount) => `Rs. ${amount}`}
                />

                <div className="relative mt-2.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                    Rs.
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budget}
                    onChange={(event) =>
                      setBudget(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Or type your own budget"
                    aria-label="Custom budget"
                    className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>How many people?</FieldLabel>
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
              title="Goal and taste"
              subtitle="What you want from this meal"
            >
              <div>
                <FieldLabel>What is your goal?</FieldLabel>
                <ChipGroup
                  options={GOALS}
                  value={goal}
                  onChange={setGoal}
                  columns="grid-cols-2 md:grid-cols-4"
                />
              </div>

              <div>
                <FieldLabel>Diet preference</FieldLabel>
                <ChipGroup
                  options={DIETS}
                  value={diet}
                  onChange={setDiet}
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <div>
                  <FieldLabel>Maximum cooking time</FieldLabel>
                  <ChipGroup
                    options={TIMES}
                    value={time}
                    onChange={setTime}
                    format={(minutes) => `${minutes} min`}
                  />
                </div>

                <div>
                  <FieldLabel>Spice level</FieldLabel>
                  <ChipGroup
                    options={SPICE_LEVELS}
                    value={spiceLevel}
                    onChange={setSpiceLevel}
                  />
                </div>
              </div>
            </StepCard>

            {/* Step 3 */}
            <StepCard
              step={3}
              title="Pantry and allergies"
              subtitle="Use what you already have, stay safe"
            >
              <div>
                <FieldLabel>🧺 Ingredients you already have</FieldLabel>

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
                        className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${
                          active
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-green-300 hover:bg-green-50"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {item}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={pantry}
                  onChange={(event) => setPantry(event.target.value)}
                  placeholder="e.g. chicken, eggs, rice, potatoes, onions, tomatoes"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-2 text-xs text-zinc-400">
                  LocalPlate AI will try to use these ingredients first.
                </p>
              </div>

              <div>
                <FieldLabel>🚫 Any allergies?</FieldLabel>

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
                        className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${
                          active
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-red-300 hover:bg-red-50"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {item}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder="e.g. peanuts, dairy, eggs - or write None"
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
                    More details
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-zinc-500">
                      Optional
                    </span>
                  </span>
                  <span className="block text-xs text-zinc-500">
                    City, dislikes and anything else
                    {moreFilledCount > 0 ? ` · ${moreFilledCount} filled` : ""}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`text-zinc-400 transition-transform duration-200 ${
                    showMore ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {showMore && (
                <div className="space-y-7 border-t border-zinc-100 p-5 pt-6 sm:p-7 sm:pt-7">
                  <div>
                    <FieldLabel>📍 City / local area</FieldLabel>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="e.g. Islamabad, Lahore, Karachi"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>❌ Foods you dislike</FieldLabel>
                    <input
                      type="text"
                      value={dislikes}
                      onChange={(event) => setDislikes(event.target.value)}
                      placeholder="e.g. bitter gourd, spinach, fish"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>✨ Anything else?</FieldLabel>
                    <textarea
                      value={extraPreferences}
                      onChange={(event) =>
                        setExtraPreferences(event.target.value)
                      }
                      placeholder="e.g. I prefer homemade food, less oil, simple recipes..."
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
                    Creating your personalized meal...
                  </>
                ) : (
                  "Generate My Meal Plan ✨"
                )}
              </button>
            </div>
          </form>

          {/* Summary (desktop) */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Your plan</h2>
                <button
                  type="button"
                  onClick={resetPreferences}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  Reset
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
                  className={`rounded-full px-3 py-1.5 font-semibold ${
                    allergies.trim()
                      ? "bg-red-50 text-red-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  🚫 {allergies.trim() || "No allergies"}
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
                  Matching your budget, pantry and taste.
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
              Try again
            </button>
          </section>
        )}

        {/* AI Result */}
        {!loading && mealPlan && (
          <section
            id="meal-result"
            className="mt-8 scroll-mt-24 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl shadow-zinc-200/40"
          >
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                  🍽️
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                    Your LocalPlate Meal
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Personalized by LocalPlate AI
                  </p>
                </div>
              </div>

              {/* Preference summary */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["bg-orange-50 text-orange-700", `🍛 ${foodType}`],
                  ["bg-green-50 text-green-700", `💰 Rs. ${budget}`],
                  ["bg-blue-50 text-blue-700", `🍽️ ${mealType}`],
                  ["bg-purple-50 text-purple-700", `🎯 ${goal}`],
                  ["bg-yellow-50 text-yellow-700", `⏱️ ${time} min`],
                  ["bg-pink-50 text-pink-700", `👥 ${servings} people`],
                  ["bg-zinc-100 text-zinc-700", `🌶️ ${spiceLevel}`],
                ].map(([tone, label]) => (
                  <span
                    key={label}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${tone}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Cost vs budget */}
              {estimatedCost !== null && costPercent !== null && (
                <div className="mt-6 rounded-2xl bg-green-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-green-800">
                      Estimated cost
                    </span>
                    <span className="font-bold text-green-700">
                      Rs. {estimatedCost.toLocaleString()} / Rs.{" "}
                      {budgetNumber.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-green-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        estimatedCost > budgetNumber
                          ? "bg-red-500"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${costPercent}%` }}
                    />
                  </div>
                  {estimatedCost > budgetNumber && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      This estimate is above your budget. Try Regenerate.
                    </p>
                  )}
                </div>
              )}

              {/* Markdown result */}
              <div className="mt-6 rounded-2xl bg-[#fffaf5] p-4 sm:p-7">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-1 text-2xl font-bold text-orange-700 sm:text-3xl">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-7 text-xl font-bold text-orange-600 sm:text-2xl">
                        {children}
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
            <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-100 bg-zinc-50/70 p-4 sm:flex sm:flex-wrap sm:justify-center sm:p-5">
              <button
                type="button"
                onClick={saveMealPlan}
                disabled={savingPlan || saved}
                className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-1 sm:rounded-full"
              >
                {savingPlan
                  ? "Saving..."
                  : saved
                    ? "✓ Meal Plan Saved"
                    : "💾 Save Meal Plan"}
              </button>

              <button
                type="button"
                onClick={openShoppingList}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.97] sm:rounded-full"
              >
                🛒 Shopping List
              </button>

              <button
                type="button"
                onClick={generatePlan}
                disabled={loading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.97] disabled:opacity-60 sm:rounded-full"
              >
                🔄 Regenerate
              </button>

              <button
                type="button"
                onClick={copyMealPlan}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.97] sm:rounded-full"
              >
                📋 Copy
              </button>

              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 text-sm font-bold text-green-700 transition hover:bg-green-100 active:scale-[0.97] sm:rounded-full"
              >
                ↗ WhatsApp
              </button>

              <button
                type="button"
                onClick={scrollToForm}
                className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 text-sm font-bold text-orange-700 transition hover:bg-orange-50 active:scale-[0.97] sm:col-span-1 sm:rounded-full"
              >
                ✏️ Change preferences
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Mobile generate bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-zinc-800">
              Rs. {budget || "—"} · {mealType} · {servings} people
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {goal} · {diet}
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
                Creating...
              </>
            ) : (
              "Generate ✨"
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
            className={`pl-sheet pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
              toast.tone === "error" ? "bg-red-600" : "bg-zinc-900"
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