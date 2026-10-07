"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

type Mode = "available" | "leftover" | "quick";

const modes: {
  id: Mode;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: "available",
    icon: "🍳",
    title: "Cook with what I have",
    description: "Find meals from your available ingredients.",
  },
  {
    id: "leftover",
    icon: "♻️",
    title: "Use my leftovers",
    description: "Turn leftovers into another useful meal.",
  },
  {
    id: "quick",
    icon: "⏱️",
    title: "Quick meal",
    description: "Find meals that are fast to prepare.",
  },
];

const starterIngredients = [
  "Chicken",
  "Eggs",
  "Rice",
  "Potatoes",
  "Onions",
  "Tomatoes",
];

export default function CookPage() {
  const [ingredients, setIngredients] = useState("");
  const [mode, setMode] = useState<Mode>("available");
  const [budget, setBudget] = useState("1000");
  const [time, setTime] = useState("30");
  const [people, setPeople] = useState("2");
  const [diet, setDiet] = useState("Normal");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ingredientCount = useMemo(() => {
    return ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length;
  }, [ingredients]);

  function addStarterIngredient(value: string) {
    const current = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      current.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      return;
    }

    setIngredients(
      [...current, value].join(", ")
    );
  }

  function removeIngredient(value: string) {
    const updated = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(
        (item) =>
          item &&
          item.toLowerCase() !== value.toLowerCase()
      );

    setIngredients(updated.join(", "));
  }

  async function findMeals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult("");

    if (!ingredients.trim()) {
      setError(
        "Pehle kam az kam 1 ingredient enter karein."
      );
      return;
    }

    setLoading(true);

    const modeInstructions: Record<Mode, string> = {
      available: `
The user wants meals using ingredients they already have.
Prioritize the listed ingredients.
Minimize additional purchases.
      `,
      leftover: `
The user wants to rescue leftovers.
Transform the provided leftover ingredients or meals into practical new meals.
Reduce food waste.
      `,
      quick: `
The user wants quick meals.
Prioritize recipes that can realistically be completed within ${time} minutes.
      `,
    };

    const prompt = `
You are LocalPlate AI's "What Can I Cook?" assistant.

USER INGREDIENTS:
${ingredients}

MODE:
${mode}

${modeInstructions[mode]}

BUDGET:
PKR ${budget}

NUMBER OF PEOPLE:
${people}

DIET:
${diet}

MAXIMUM COOKING TIME:
${time} minutes

EXTRA PREFERENCE:
${extra || "None"}

Create 5 practical meal ideas.

IMPORTANT RULES:
- Prioritize the ingredients the user already has.
- Prefer Pakistani, South Asian and familiar household meals when appropriate.
- Do not invent that the user owns ingredients that were not provided.
- Clearly identify additional ingredients that may be needed.
- Keep approximate costs realistic for Pakistan.
- Respect the selected budget.
- Respect the selected diet.
- Respect allergies or restrictions if mentioned.
- Do not make medical claims.
- Do not recommend extreme diets.
- If the user's ingredients are insufficient for a complete meal, say what is missing.
- For leftovers, prioritize food-waste reduction.
- For quick meals, respect the requested maximum time.

FOR EACH MEAL USE THIS FORMAT:

## 🍽️ [Meal Name]

**Estimated Cost:** PKR [amount]

**Time:** [minutes]

**You Already Have:**
- ingredient
- ingredient

**You May Need:**
- ingredient
- ingredient

**Quick Recipe:**
1. Step
2. Step
3. Step

**Why it works:**
One short sentence.

**Smart Swap:**
One practical substitution if available.

At the end provide:

## 🛒 Missing Ingredients

List only ingredients that are likely needed but were not included by the user.

## 💡 LocalPlate Tip

Give one short practical food-saving or cooking tip.

Keep the response useful and reasonably concise.
`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "AI request failed. Please try again."
        );
      }

      if (
        typeof data?.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error(
          "AI ne koi valid meal result return nahi kiya."
        );
      }

      setResult(data.reply);
    } catch (err) {
      console.error("What Can I Cook error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setIngredients("");
    setExtra("");
    setResult("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-8 text-zinc-900 sm:px-6 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <section className="overflow-hidden rounded-[2rem] bg-zinc-950 px-5 py-10 text-white shadow-xl sm:px-8 md:px-12 md:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-orange-500/15 px-4 py-2 text-sm font-bold text-orange-300 ring-1 ring-orange-400/20">
              🍳 LocalPlate AI
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              What Can I
              <span className="text-orange-500">
                {" "}
                Cook?
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
              Apne kitchen mein jo ingredients already
              hain woh enter karein. LocalPlate AI aapko
              practical meals batayega jo aap unhi
              ingredients se bana sakte hain.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
                🇵🇰 Pakistani-friendly
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
                💰 Budget-aware
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
                ♻️ Less food waste
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
                ⏱️ Quick meals
              </span>
            </div>
          </div>
        </section>

        {/* Main workspace */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Form */}
          <section className="rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <p className="text-sm font-bold text-orange-600">
                Step 1
              </p>

              <h2 className="mt-1 text-2xl font-black">
                What do you have?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Ingredients comma se separate karein.
              </p>
            </div>

            {/* Starter ingredients */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Quick add
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {starterIngredients.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      addStarterIngredient(item)
                    }
                    className="min-h-10 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 active:scale-95"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={findMeals}
              className="mt-5 space-y-5"
            >
              <div>
                <label
                  htmlFor="ingredients"
                  className="mb-2 block text-sm font-bold"
                >
                  Your ingredients
                </label>

                <textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(event) =>
                    setIngredients(event.target.value)
                  }
                  placeholder="Chicken, eggs, rice, potatoes, onions..."
                  rows={5}
                  maxLength={1500}
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  <span>
                    {ingredientCount} ingredients
                  </span>
                  <span>
                    {ingredients.length}/1500
                  </span>
                </div>

                {ingredientCount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ingredients
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            removeIngredient(item)
                          }
                          className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
                          title={`Remove ${item}`}
                        >
                          {item} ×
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Mode */}
              <div>
                <p className="mb-3 text-sm font-bold">
                  What do you want?
                </p>

                <div className="grid gap-2">
                  {modes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                        mode === item.id
                          ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                          : "border-zinc-200 bg-white hover:border-orange-200"
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                        {item.icon}
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {item.title}
                        </span>

                        <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                          {item.description}
                        </span>
                      </span>

                      {mode === item.id && (
                        <span className="ml-auto text-orange-600">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="budget"
                    className="mb-2 block text-sm font-bold"
                  >
                    Budget
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      PKR
                    </span>

                    <input
                      id="budget"
                      type="number"
                      min="0"
                      max="100000"
                      value={budget}
                      onChange={(event) =>
                        setBudget(event.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-12 pr-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="time"
                    className="mb-2 block text-sm font-bold"
                  >
                    Max time
                  </label>

                  <div className="relative">
                    <input
                      id="time"
                      type="number"
                      min="5"
                      max="180"
                      value={time}
                      onChange={(event) =>
                        setTime(event.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-12 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      min
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="people"
                    className="mb-2 block text-sm font-bold"
                  >
                    People
                  </label>

                  <input
                    id="people"
                    type="number"
                    min="1"
                    max="20"
                    value={people}
                    onChange={(event) =>
                      setPeople(event.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="diet"
                    className="mb-2 block text-sm font-bold"
                  >
                    Diet
                  </label>

                  <select
                    id="diet"
                    value={diet}
                    onChange={(event) =>
                      setDiet(event.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    <option>Normal</option>
                    <option>Vegetarian</option>
                    <option>High Protein</option>
                    <option>Low Carb</option>
                    <option>Vegan</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="extra"
                  className="mb-2 block text-sm font-bold"
                >
                  Anything else?
                </label>

                <input
                  id="extra"
                  value={extra}
                  onChange={(event) =>
                    setExtra(event.target.value)
                  }
                  maxLength={500}
                  placeholder="e.g. spicy, Pakistani food, no oven..."
                  className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={loading}
                  className="min-h-12 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Finding meals..."
                    : "🍳 Find Meals"}
                </button>
              </div>
            </form>
          </section>

          {/* Results */}
          <section className="min-h-[500px] rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-orange-600">
                  Step 2
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Your meal ideas
                </h2>
              </div>

              {loading && (
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-600"
                  aria-label="Loading"
                />
              )}
            </div>

            {!result && !loading && (
              <div className="mt-8 flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/70 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl">
                  🍲
                </div>

                <h3 className="mt-5 text-xl font-black">
                  Kitchen se start karein
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Apne available ingredients enter karein
                  aur LocalPlate AI aapko meal ideas dega.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-zinc-500">
                  <span className="rounded-full bg-white px-3 py-2 shadow-sm">
                    Chicken + Rice
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 shadow-sm">
                    Eggs + Potatoes
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 shadow-sm">
                    Leftover Daal
                  </span>
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-8 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-3xl border border-zinc-100 p-5"
                  >
                    <div className="h-5 w-2/3 rounded bg-zinc-200" />
                    <div className="mt-4 h-3 w-1/3 rounded bg-zinc-100" />
                    <div className="mt-5 h-3 w-full rounded bg-zinc-100" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-zinc-100" />
                    <div className="mt-2 h-3 w-4/6 rounded bg-zinc-100" />
                  </div>
                ))}
              </div>
            )}

            {result && !loading && (
              <div className="mt-7">
                <div className="rounded-3xl border border-zinc-100 bg-[#fffaf5] p-5 sm:p-7">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h3 className="mb-4 mt-8 text-xl font-black first:mt-0">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 text-sm leading-7 text-zinc-700">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-5 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-zinc-900">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-950 p-5 text-white">
                  <p className="text-sm font-bold">
                    💡 Next step
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Jo meal pasand aaye usay Planner mein
                    recreate karein aur zaroorat ho to
                    Shopping List se missing ingredients
                    manage karein.
                  </p>

                  <a
                    href="/planner"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
                  >
                    Open Meal Planner →
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* SEO content */}
        <section className="mt-8 rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">
            Turn your ingredients into meal ideas
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-600">
            LocalPlate AI helps you discover practical meal ideas
            from ingredients you already have at home. It can
            prioritize Pakistani and South Asian meals, consider
            your budget and cooking time, and suggest useful
            substitutions when an ingredient is missing.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["🥕", "Use what you have", "Reduce unnecessary grocery purchases."],
              ["💰", "Stay budget-aware", "Get approximate Pakistani Rupee costs."],
              ["♻️", "Reduce waste", "Turn leftovers into useful meals."],
              ["⏱️", "Save time", "Find meals that fit your available time."],
            ].map(([icon, title, description]) => (
              <div
                key={title}
                className="rounded-2xl bg-zinc-50 p-4"
              >
                <div className="text-2xl">{icon}</div>
                <h3 className="mt-3 font-bold">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}