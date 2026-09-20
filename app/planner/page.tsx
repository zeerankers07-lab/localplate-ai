"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";

export default function PlannerPage() {
  // =========================
  // Planner Preferences
  // =========================

  const [foodType, setFoodType] = useState("Pakistani");
  const [budget, setBudget] = useState("1000");
  const [mealType, setMealType] = useState("Lunch");
  const [diet, setDiet] = useState("Normal");
  const [time, setTime] = useState("30");

  // New preferences
  const [goal, setGoal] = useState("Healthy Eating");
  const [servings, setServings] = useState("2");
  const [city, setCity] = useState("");
  const [spiceLevel, setSpiceLevel] = useState("Medium");
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [pantry, setPantry] = useState("");
  const [extraPreferences, setExtraPreferences] = useState("");

  // =========================
  // AI Result State
  // =========================

  const [mealPlan, setMealPlan] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // =========================
  // Load preferences from "Use Again"
  // =========================

  useEffect(() => {
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
      if (preferences.city !== undefined) setCity(preferences.city);
      if (preferences.spiceLevel) setSpiceLevel(preferences.spiceLevel);
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
  }, []);

  // =========================
  // Reset saved state when
  // a new meal plan is generated
  // =========================

  useEffect(() => {
    if (mealPlan) {
      setSaved(false);

      setTimeout(() => {
        document.getElementById("meal-result")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [mealPlan]);

  // =========================
  // Regenerate
  // =========================

  const handleRegenerate = async () => {
    await handleSubmit({
      preventDefault: () => { },
    } as React.FormEvent<HTMLFormElement>);
  };

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
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("saved_plans").insert({
          user_id: user.id,
          meal_plan: mealPlan,
          food_type: foodType,
          budget,
          meal_type: mealType,
          diet,
          time,
          goal,
          servings,
          city,
          spice_level: spiceLevel,
          allergies,
          dislikes,
          pantry,
          extra_preferences: extraPreferences,
          created_at: createdAt,
          favorite: false,
          plan_type: "single",
        });

        if (error) {
          console.error("Supabase save error:", error);
          throw error;
        }
      }

      // Keep localStorage as a local fallback/cache so existing app behavior
      // continues to work even when the user is not signed in.
      const savedPlans = JSON.parse(
        localStorage.getItem("localplate_saved_plans") || "[]"
      );

      localStorage.setItem(
        "localplate_saved_plans",
        JSON.stringify([
          { id: Date.now(), ...newPlan },
          ...savedPlans,
        ])
      );

      setSaved(true);
    } catch (error) {
      console.error("Failed to save meal plan:", error);
      alert("Meal plan save nahi ho saka. Please try again.");
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================
  // Generate Meal Plan
  // =========================

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMealPlan("");

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
      console.error(error);
      setMealPlan(
        "Meal plan generate nahi ho saka. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-zinc-900 md:px-8">

      <div className="mx-auto max-w-6xl">


        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
            ✨ AI Meal Planner
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Your meal.
            <span className="text-orange-600"> Your way.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
            Tell LocalPlate AI about your budget, goal, taste, pantry and
            preferences. We&apos;ll create a practical meal just for you.
          </p>
        </section>

        {/* Planner Form */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-12 max-w-4xl rounded-[2rem] border hover:shadow-2xl border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/40 md:p-10"
        >

          {/* Section Header */}
          <div className="mb-8 border-b border-zinc-100 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Your preferences
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Let&apos;s build your meal
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              The more details you provide, the more personalized your meal
              recommendation will be.
            </p>
          </div>

          {/* Food Type */}
          <div>
            <label className="text-base font-bold">
              What kind of food do you prefer?
            </label>

            <div className="mt-4 grid grid-cols-3 gap-3 justify-items-center">              {["Pakistani", "Indian", "Any"].map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setFoodType(option)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out ${foodType === option
                  ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                  }`}
              >
                {option}
              </button>
            ))}
            </div>
          </div>

          {/* Goal */}
          <div className="mt-8">
            <label className="text-base font-bold">
              What is your goal?
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                "Weight Loss",
                "Muscle Gain",
                "Maintain Weight",
                "Healthy Eating",
              ].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setGoal(option)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ease-out ${goal === option
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="mt-8">
            <label className="text-base font-bold">
              What&apos;s your budget for this meal?
            </label>

            <div className="mt-4 grid grid-cols-3 gap-3 justify-items-center">              {["500", "1000", "2000"].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setBudget(amount)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out ${budget === amount
                  ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                  }`}
              >
                Rs. {amount}
              </button>
            ))}
            </div>
          </div>

          {/* Meal Type */}
          <div className="mt-8">
            <label className="text-base font-bold">
              Which meal are you planning?
            </label>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Breakfast", "Lunch", "Dinner"].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setMealType(option)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out ${mealType === option
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className="mt-8">
            <label className="text-base font-bold">
              Diet preference?
            </label>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Normal", "Vegetarian", "High Protein"].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setDiet(option)}
                  className={`flex min-h-[58px] w-full items-center justify-center rounded-xl border px-2 py-3 text-center text-sm font-semibold leading-tight transition-all duration-200 ease-out ${diet === option
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Time */}
          <div className="mt-8">
            <label className="text-base font-bold">
              Maximum cooking time?
            </label>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {["15", "30", "60"].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  onClick={() => setTime(minutes)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out ${time === minutes
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          {/* Servings + Spice */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">

            <div>
              <label className="text-base font-bold">
                How many people?
              </label>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {["1", "2", "3", "4"].map((number) => (
                  <button
                    type="button"
                    key={number}
                    onClick={() => setServings(number)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ease-out ${servings === number
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400"
                      }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-base font-bold">
                Spice level?
              </label>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Mild", "Medium", "Spicy"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setSpiceLevel(option)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ease-out ${spiceLevel === option
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-400"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* City */}
          <div className="mt-8">
            <label className="text-base font-bold">
              📍 City / Local Area
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Islamabad, Lahore, Karachi"
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-2 text-xs text-zinc-400">
              Optional — helps LocalPlate AI understand your local food
              preferences.
            </p>
          </div>

          {/* Allergies */}
          <div className="mt-8">
            <label className="text-base font-bold">
              🚫 Any allergies?
            </label>

            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. peanuts, dairy, eggs — or write None"
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Dislikes */}
          <div className="mt-8">
            <label className="text-base font-bold">
              ❌ What foods do you dislike?
            </label>

            <input
              type="text"
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="e.g. bitter gourd, spinach, fish"
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Pantry */}
          <div className="mt-8">
            <label className="text-base font-bold">
              🧺 What ingredients do you already have?
            </label>

            <textarea
              value={pantry}
              onChange={(e) => setPantry(e.target.value)}
              placeholder="e.g. chicken, eggs, rice, potatoes, onions, tomatoes"
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-2 text-xs text-zinc-400">
              LocalPlate AI will try to use these ingredients first.
            </p>
          </div>

          {/* Extra Preferences */}
          <div className="mt-8">
            <label className="text-base font-bold">
              ✨ Anything else?
            </label>

            <textarea
              value={extraPreferences}
              onChange={(e) => setExtraPreferences(e.target.value)}
              placeholder="e.g. I prefer homemade food, less oil, simple recipes..."
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-10 w-full rounded-2xl bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-orange-200 transition-all duration-200 ease-out hover:bg-orange-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating your personalized meal..."
              : "Generate My Meal Plan ✨"}
          </button>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Powered by LocalPlate AI
          </p>
        </form>

        {/* AI Result */}
        {mealPlan && (
          <section
            id="meal-result" className="mx-auto mt-10 max-w-4xl rounded-[2rem] border hover:shadow-2xl border-orange-100 bg-white p-6 shadow-xl shadow-zinc-200/40 md:p-10">

            {/* Result Header */}
            <div className="flex flex-col gap-5 border-b border-zinc-100 pb-6 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                  🍽️
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Your LocalPlate Meal
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Personalized by LocalPlate AI
                  </p>
                </div>
              </div>

            </div>

            {/* Preference Summary */}
            <div className="mt-6 flex flex-wrap gap-2">

              <span className="active:scale-[0.98] rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
                🍛 {foodType}
              </span>

              <span className="active:scale-[0.98] rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                💰 Rs. {budget}
              </span>

              <span className="active:scale-[0.98] rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                🍽️ {mealType}
              </span>

              <span className="active:scale-[0.98] rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
                🎯 {goal}
              </span>

              <span className="active:scale-[0.98] rounded-full bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
                ⏱️ {time} min
              </span>

              <span className="active:scale-[0.98] rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700">
                👥 {servings} people
              </span>

              <span className="active:scale-[0.98] rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
                🌶️ {spiceLevel}
              </span>

            </div>

            {/* Markdown Result */}
            <div className="mt-8 rounded-2xl bg-[#fffaf5] p-5 md:p-7">

              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-5 mt-2 text-3xl font-bold text-orange-700">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-8 text-2xl font-bold text-orange-600">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-6 text-xl font-bold text-zinc-800">
                      {children}
                    </h3>
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
                }}
              >
                {mealPlan}
              </ReactMarkdown>

            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                className="active:scale-[0.98] rounded-full bg-zinc-900 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 ease-out hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                🔄 Regenerate
              </button>

              <button
                type="button"
                onClick={saveMealPlan}
                className="active:scale-[0.98] rounded-full bg-orange-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 ease-out hover:bg-orange-700"
              >
                {savingPlan
                  ? "Saving..."
                  : saved
                    ? "✓ Meal Plan Saved"
                    : "💾 Save Meal Plan"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!mealPlan) return;

                  localStorage.setItem(
                    "localplate_shopping_list",
                    mealPlan
                  );

                  window.location.href = "/shopping-list";
                }}
                className="active:scale-[0.98] rounded-full bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 ease-out hover:bg-green-700"
              >
                🛒 Shopping List
              </button>

            </div>
          </section>
        )}

      </div>
    </main>
  );
}