"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { useI18n, type CurrencyCode } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { PANTRY, pantryEmoji } from "@/lib/pantry";
import { MARKETS, priceAccuracyRules, priceRule } from "@/lib/currency";

// Headline typeface for the hero (soft serif, feels like a recipe book).
const display = Fraunces({ subsets: ["latin"], display: "swap" });

// =========================
// Constants
// =========================


// Symbol, country, usual budget and pricing rules per currency are shared
// with the planner pages (see lib/currency.ts).
const CURRENCIES = MARKETS;

const CUISINES = [
  "Pakistani",
  "Indian",
  "South Asian",
  "Italian",
  "Chinese",
  "American",
  "Middle Eastern",
  "Any cuisine",
];
const DIETS = [
  "Normal",
  "Vegetarian",
  "High Protein",
  "Low Carb",
  "Vegan",
  "Halal",
  "Gluten-free",
  "Dairy-free",
];
const DIFFICULTIES = ["Any", "Easy", "Medium", "Hard"];
const MEAL_TYPES = ["Any", "Breakfast", "Lunch", "Dinner", "Snack"];

// Meal size = calories per serving. Presets only (no free number box) and the
// lowest one stays at a normal meal size on purpose.
const MEAL_SIZES = [
  { id: "Any", label: "cook.sizeAny", range: null },
  { id: "Light", label: "cook.sizeLight", range: [350, 450] },
  { id: "Balanced", label: "cook.sizeBalanced", range: [450, 650] },
  { id: "Hearty", label: "cook.sizeHearty", range: [650, 900] },
] as const;

type MealSize = (typeof MEAL_SIZES)[number]["id"];
const ALLERGIES = [
  "Nuts",
  "Peanuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Soy",
  "Seafood",
  "Sesame",
];

type Mode = "available" | "leftover" | "quick" | "budget";

const MODES: { id: Mode; label: string }[] = [
  { id: "available", label: "mode.available" },
  { id: "leftover", label: "mode.leftover" },
  { id: "quick", label: "mode.quick" },
  { id: "budget", label: "mode.budget" },
];

const POPULAR = [
  "Chicken",
  "Eggs",
  "Rice",
  "Potatoes",
  "Onions",
  "Tomatoes",
  "Daal",
  "Flour",
];

const SUGGESTIONS = Array.from(
  new Set([
    ...POPULAR,
    "Beef",
    "Mutton",
    "Fish",
    "Paneer",
    "Tofu",
    "Chickpeas",
    "Spinach",
    "Carrots",
    "Peas",
    "Cauliflower",
    "Capsicum",
    "Garlic",
    "Ginger",
    "Cucumber",
    "Lemon",
    "Mushrooms",
    "Corn",
    "Okra",
    "Cabbage",
    "Pasta",
    "Bread",
    "Oats",
    "Noodles",
    "Lentils",
    "Yogurt",
    "Milk",
    "Butter",
    "Cheese",
    "Cream",
    "Ghee",
    "Salt",
    "Red chili powder",
    "Turmeric",
    "Cumin",
    "Garam masala",
    "Coriander powder",
    "Black pepper",
    "Green chilies",
  ])
);

const MEAL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const STORAGE_KEY = "localplate_cook_ingredients";
const PREFS_KEY = "localplate_cook_prefs";
const SAVED_KEY = "localplate_saved_recipes";
const PLAN_KEY = "localplate_cook_meal_plan";
const CLOUD_KEY = "localplate_cook_cloud_user";
const MAX_SAVED = 30;

type Tab = "results" | "saved" | "plan";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

type Block = {
  heading: string;
  body: string;
  markdown: string;
};

type SavedRecipe = {
  id: string;
  title: string;
  markdown: string;
  savedAt: number;
  people?: number;
  symbol?: string;
};

type PlannedMeal = {
  id: string;
  day: string;
  slot: string;
  title: string;
  markdown: string;
  symbol: string;
};

// =========================
// Helpers
// =========================

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitBlocks(text: string) {
  const parts = text.split(/^(?=##\s)/m);
  let intro = "";
  const blocks: Block[] = [];

  parts.forEach((part, index) => {
    if (index === 0 && !/^##\s/.test(part)) {
      intro = part.trim();
      return;
    }

    const [first, ...rest] = part.split("\n");

    blocks.push({
      heading: first.replace(/^##\s*/, "").trim(),
      body: rest.join("\n").trim(),
      markdown: part.trim(),
    });
  });

  return { intro, blocks };
}

function readCost(body: string) {
  const match = body.match(
    /Estimated Cost:?\**\s*(?:PKR|INR|USD|Rs\.?|₹|\$)\s*([\d,]+(?:\.\d+)?)/i
  );

  return match ? match[1] : null;
}

function readTime(body: string) {
  const match = body.match(/Time:?\**\s*(\d+)/i);
  return match ? match[1] : null;
}

function readListLines(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

function readDifficulty(body: string) {
  const match = body.match(/Difficulty:?\**\s*(Easy|Medium|Hard)/i);
  if (!match) return null;

  const value = match[1].toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readSection(body: string, label: string) {
  const lines = body.split("\n");
  const startPattern = new RegExp(`^\\*\\*${label}:?\\*\\*:?`, "i");
  const start = lines.findIndex((line) => startPattern.test(line.trim()));

  if (start === -1) return "";

  const collected: string[] = [];
  const firstLine = lines[start].trim().replace(startPattern, "").trim();
  if (firstLine) collected.push(firstLine);

  for (let i = start + 1; i < lines.length; i++) {
    if (/^\*\*[^*]+\*\*/.test(lines[i].trim())) break;
    collected.push(lines[i]);
  }

  return collected.join("\n").trim();
}

function readNutrition(body: string) {
  const pick = (pattern: RegExp) => {
    const match = body.match(pattern);
    return match ? match[1] : null;
  };

  const calories = pick(/Calories:?\**\s*(\d+(?:\.\d+)?)/i);
  const protein = pick(/Protein:?\**\s*(\d+(?:\.\d+)?)/i);
  const carbs = pick(/Carbs?(?:ohydrates)?:?\**\s*(\d+(?:\.\d+)?)/i);
  const fat = pick(/Fat:?\**\s*(\d+(?:\.\d+)?)/i);

  if (!calories && !protein && !carbs && !fat) return null;

  return { calories, protein, carbs, fat };
}

function mergeUnique(base: string[], extra: string[]) {
  const seen = new Set(base.map((item) => item.toLowerCase()));
  const merged = [...base];

  extra.forEach((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
}

function formatQuantity(value: number) {
  if (value >= 10) return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

function scaleItem(item: string, factor: number) {
  if (factor === 1) return item;

  const match = item.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/);
  if (!match) return item;

  // Ranges such as "3-4 cloves" are left unchanged.
  if (/^\s*[-–]\s*\d/.test(match[2])) return item;

  const raw = match[1].trim();
  let value: number;

  if (/^\d+\s+\d+\/\d+$/.test(raw)) {
    const [whole, fraction] = raw.split(/\s+/);
    const [top, bottom] = fraction.split("/").map(Number);
    value = Number(whole) + top / bottom;
  } else if (raw.includes("/")) {
    const [top, bottom] = raw.split("/").map(Number);
    value = top / bottom;
  } else {
    value = Number(raw);
  }

  if (!Number.isFinite(value) || value <= 0) return item;

  return `${formatQuantity(value * factor)}${match[2]}`;
}

const PLAN_ITEM_QUANTITY =
  /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(kgs?|g|gm|grams?|mg|l|liters?|litres?|ml|cups?|tbsp|tsp|tablespoons?|teaspoons?|pieces?|pcs?|cloves?|slices?|pinch|bunch|cans?|packets?|dozen)?\b\s*(?:of\s+)?(.+)$/i;

function planItemLine(item: string) {
  const match = item.match(PLAN_ITEM_QUANTITY);
  if (!match) return `- ${item}`;

  const quantity = `${match[1]}${match[2] ? ` ${match[2]}` : ""}`.trim();
  const name = match[3].trim();

  return `- ${name.charAt(0).toUpperCase()}${name.slice(1)} — ${quantity}`;
}


function recipeTitle(heading: string) {
  return heading.replace(/^🍽\uFE0F?\s*/, "").trim() || heading;
}

function recipeId(heading: string) {
  return recipeTitle(heading).toLowerCase();
}

function cleanSaved(value: unknown): SavedRecipe[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is SavedRecipe =>
      !!item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.markdown === "string"
  );
}

function cleanPlan(value: unknown): PlannedMeal[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is PlannedMeal =>
      !!item &&
      typeof item.id === "string" &&
      typeof item.day === "string" &&
      typeof item.slot === "string" &&
      typeof item.title === "string" &&
      typeof item.markdown === "string"
  );
}

function mergeById<T extends { id: string }>(primary: T[], extra: T[]) {
  const ids = new Set(primary.map((item) => item.id));
  return [...primary, ...extra.filter((item) => !ids.has(item.id))];
}

// =========================
// UI pieces
// =========================

const ICON_PATHS = {
  bookmark: "M6 3h12v18l-6-4-6 4V3z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  cart: "M3 4h2l2.4 11h10.2L20 8H6.2M9 20h.01M17 20h.01",
  copy: "M9 9h11v11H9zM5 15V4h11",
  chevron: "M6 9l6 6 6-6",
  x: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
} as const;

type IconName = keyof typeof ICON_PATHS;

function Icon({
  name,
  className = "size-4",
  filled = false,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h3 className="mb-2 mt-4 text-sm font-semibold first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 text-sm leading-6 text-zinc-700">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-6 text-zinc-700">
            {children}
          </ol>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-900">{children}</strong>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

const iconButton =
  "flex size-9 items-center justify-center rounded-lg text-zinc-500 outline-none transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-orange-500 active:scale-95";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </p>
  );
}

type RecipeCardProps = {
  meal: Block;
  basePeople: number;
  symbol: string;
  saved: boolean;
  defaultOpen?: boolean;
  onSave: () => void;
  onPlan: () => void;
  onShop: (items: string[]) => void;
  onCopy: () => void;
};

function RecipeCard({
  meal,
  basePeople,
  symbol,
  saved,
  defaultOpen = false,
  onSave,
  onPlan,
  onShop,
  onCopy,
}: RecipeCardProps) {
  const { t, label } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const [servings, setServings] = useState(basePeople);

  const cost = readCost(meal.body);
  const minutes = readTime(meal.body);
  const level = readDifficulty(meal.body);
  const nutrition = readNutrition(meal.body);

  const factor = servings / basePeople;
  const totalCost = cost ? Number(cost.replace(/,/g, "")) : NaN;
  const scaledCost = Number.isFinite(totalCost)
    ? (Math.round(totalCost * factor * 100) / 100).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })
    : cost;

  const haveItems = readListLines(
    readSection(meal.body, "You Already Have")
  ).map((item) => scaleItem(item, factor));
  const needItems = readListLines(readSection(meal.body, "You May Need")).map(
    (item) => scaleItem(item, factor)
  );
  const recipe = readSection(meal.body, "Quick Recipe");
  const substitutions = readListLines(readSection(meal.body, "Substitutions"));
  const structured =
    haveItems.length > 0 || needItems.length > 0 || recipe.length > 0;

  const meta = [
    minutes ? t("unit.min", { n: minutes }) : "",
    level ? label("opt", level) : "",
    scaledCost ? `${symbol} ${scaledCost}` : "",
  ].filter(Boolean);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-start gap-1 p-2 pr-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-snug">
              {recipeTitle(meal.heading)}
            </span>
            {(meta.length > 0 || nutrition?.calories) && (
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
                {meta.join(" · ")}
                {nutrition?.calories ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">
                    <span aria-hidden="true">🔥</span>≈{" "}
                    {t("unit.kcal", { n: nutrition.calories })}
                  </span>
                ) : null}
              </span>
            )}
          </span>

          <Icon
            name="chevron"
            className={`mt-1 size-4 shrink-0 text-zinc-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex shrink-0 pt-1">
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? t("card.unsave") : t("card.save")}
            title={saved ? t("card.unsave") : t("card.save")}
            className={`${iconButton} ${saved ? "text-orange-600" : ""}`}
          >
            <Icon name="bookmark" filled={saved} />
          </button>

          <button
            type="button"
            onClick={onPlan}
            aria-label={t("card.plan")}
            title={t("card.plan")}
            className={iconButton}
          >
            <Icon name="calendar" />
          </button>

          <button
            type="button"
            onClick={() => onShop(needItems)}
            disabled={needItems.length === 0}
            aria-label={t("card.shop")}
            title={t("card.shop")}
            className={`${iconButton} disabled:opacity-40`}
          >
            <Icon name="cart" />
          </button>

          <button
            type="button"
            onClick={onCopy}
            aria-label={t("card.copy")}
            title={t("card.copy")}
            className={iconButton}
          >
            <Icon name="copy" />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-5 border-t border-zinc-100 p-4">
          {structured ? (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500">{t("card.servings")}</span>

                <div className="inline-flex items-center rounded-lg border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setServings((value) => Math.max(1, value - 1))}
                    aria-label={t("card.fewer")}
                    className="flex size-8 items-center justify-center rounded-l-lg text-zinc-600 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <Icon name="minus" className="size-3.5" />
                  </button>

                  <span
                    className="min-w-8 text-center font-medium"
                    aria-live="polite"
                  >
                    {servings}
                  </span>

                  <button
                    type="button"
                    onClick={() => setServings((value) => Math.min(20, value + 1))}
                    aria-label={t("card.more")}
                    className="flex size-8 items-center justify-center rounded-r-lg text-zinc-600 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <Icon name="plus" className="size-3.5" />
                  </button>
                </div>
              </div>

              {(haveItems.length > 0 || needItems.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SectionLabel>{t("card.have")}</SectionLabel>
                    <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">
                      {haveItems.length > 0 ? (
                        haveItems.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))
                      ) : (
                        <li className="text-zinc-400">—</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <SectionLabel>{t("card.need")}</SectionLabel>
                    <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">
                      {needItems.length > 0 ? (
                        needItems.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))
                      ) : (
                        <li className="text-zinc-400">{t("card.nothing")}</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {nutrition && (
                <div>
                  <SectionLabel>{t("card.perServing")}</SectionLabel>
                  <p className="mt-1.5 text-sm text-zinc-700">
                    {[
                      nutrition.calories
                        ? t("unit.kcal", { n: nutrition.calories })
                        : "",
                      nutrition.protein
                        ? t("unit.protein", { n: nutrition.protein })
                        : "",
                      nutrition.carbs
                        ? t("unit.carbs", { n: nutrition.carbs })
                        : "",
                      nutrition.fat ? t("unit.fat", { n: nutrition.fat }) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}

              {recipe && (
                <div>
                  <SectionLabel>{t("card.steps")}</SectionLabel>
                  <div className="mt-1.5">
                    <Markdown text={recipe} />
                  </div>
                </div>
              )}

              {substitutions.length > 0 && (
                <div>
                  <SectionLabel>{t("card.subs")}</SectionLabel>
                  <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">
                    {substitutions.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <Markdown text={meal.body} />
          )}
        </div>
      )}
    </article>
  );
}

const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm";

const labelClass = "mb-1.5 block text-xs font-medium text-zinc-500";

const TABS: { id: Tab; label: string }[] = [
  { id: "results", label: "tab.results" },
  { id: "saved", label: "tab.saved" },
  { id: "plan", label: "tab.plan" },
];

// =========================
// Page
// =========================

export default function CookPage() {
  const router = useRouter();

  // Inputs
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [cuisine, setCuisine] = useState("Pakistani");
  const [diet, setDiet] = useState("Normal");
  const [difficulty, setDifficulty] = useState("Any");
  const [mealType, setMealType] = useState("Any");
  const [mealSize, setMealSize] = useState<MealSize>("Any");
  const [mode, setMode] = useState<Mode>("available");
  const { t, label, lang, currency, setCurrency } = useI18n();
  const storedPrefs = useRef<Record<string, unknown> | null>(null);
  const [budget, setBudget] = useState("1000");
  const [time, setTime] = useState("30");
  const [people, setPeople] = useState("2");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [result, setResult] = useState("");
  const [resultCurrency, setResultCurrency] = useState<CurrencyCode>("PKR");
  const [resultPeople, setResultPeople] = useState(2);

  // Saved recipes and meal plan
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [tab, setTab] = useState<Tab>("results");
  const [planTarget, setPlanTarget] = useState<{
    meal: Block;
    symbol: string;
  } | null>(null);
  const [pickDay, setPickDay] = useState("Mon");
  const [pickSlot, setPickSlot] = useState("Dinner");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // Storage and account sync
  const [restored, setRestored] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // On phones the message sits far from the sticky button, so bring it into view.
  useEffect(() => {
    if (!error && !authRequired) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    document
      .getElementById("cook-messages")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, authRequired]);

  const currencyInfo = CURRENCIES[currency];
  const resultSymbol = CURRENCIES[resultCurrency].symbol;

  function showToast(message: string, tone: "success" | "error" = "success") {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);

    setToast({ id: Date.now(), message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Restore everything that is stored on this device.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedIngredients = localStorage.getItem(STORAGE_KEY);

        if (storedIngredients) {
          setIngredients(
            mergeUnique([], splitList(storedIngredients)).slice(0, 40)
          );
        }

        const rawPrefs = localStorage.getItem(PREFS_KEY);

        if (rawPrefs) {
          const prefs = JSON.parse(rawPrefs) as Record<string, unknown>;
          const text = (value: unknown) =>
            typeof value === "string" ? value : "";

          if (CUISINES.includes(text(prefs.cuisine))) {
            setCuisine(text(prefs.cuisine));
          }
          if (DIETS.includes(text(prefs.diet))) setDiet(text(prefs.diet));
          if (DIFFICULTIES.includes(text(prefs.difficulty))) {
            setDifficulty(text(prefs.difficulty));
          }
          if (MEAL_TYPES.includes(text(prefs.mealType))) {
            setMealType(text(prefs.mealType));
          }
          if (MEAL_SIZES.some((item) => item.id === text(prefs.mealSize))) {
            setMealSize(text(prefs.mealSize) as MealSize);
          }
          if (MODES.some((item) => item.id === text(prefs.mode))) {
            setMode(text(prefs.mode) as Mode);
          }
          storedPrefs.current = prefs;
          if (/^\d{1,3}$/.test(text(prefs.time))) setTime(text(prefs.time));
          if (/^\d{1,2}$/.test(text(prefs.people))) {
            setPeople(text(prefs.people));
          }
          if (Array.isArray(prefs.allergies)) {
            setAllergies(
              prefs.allergies.filter(
                (item): item is string =>
                  typeof item === "string" && ALLERGIES.includes(item)
              )
            );
          }
        }

        setSavedRecipes(
          cleanSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"))
        );
        setPlannedMeals(
          cleanPlan(JSON.parse(localStorage.getItem(PLAN_KEY) || "[]"))
        );
      } catch (storageError) {
        console.error("Could not restore cook data:", storageError);
      }

      setRestored(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Keep this device up to date.
  useEffect(() => {
    if (!restored) return;

    try {
      localStorage.setItem(STORAGE_KEY, ingredients.join(", "));
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          cuisine,
          diet,
          difficulty,
          mealType,
          mealSize,
          mode,
          currency,
          budget,
          time,
          people,
          allergies,
        })
      );
    } catch (storageError) {
      console.error("Could not save settings:", storageError);
    }
  }, [
    restored,
    ingredients,
    cuisine,
    diet,
    difficulty,
    mealType,
    mealSize,
    mode,
    currency,
    budget,
    time,
    people,
    allergies,
  ]);

  // The budget follows the currency (the stored budget when it matches).
  useEffect(() => {
    if (!restored) return;

    const stored = storedPrefs.current;
    const storedBudget =
      typeof stored?.budget === "string" ? stored.budget : "";

    setBudget(
      stored?.currency === currency && /^\d{1,6}$/.test(storedBudget)
        ? storedBudget
        : CURRENCIES[currency].defaultBudget
    );
  }, [restored, currency]);

  useEffect(() => {
    if (!restored) return;

    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedRecipes));
    } catch (storageError) {
      console.error("Could not save recipes:", storageError);
    }
  }, [restored, savedRecipes]);

  useEffect(() => {
    if (!restored) return;

    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(plannedMeals));
    } catch (storageError) {
      console.error("Could not save meal plan:", storageError);
    }
  }, [restored, plannedMeals]);

  // Load the account copy (table: cook_data) once, then keep it in sync.
  // The first sync on a device merges; later loads trust the account copy.
  useEffect(() => {
    if (!restored) return;

    let cancelled = false;

    async function loadAccountData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data, error: loadError } = await supabase
          .from("cook_data")
          .select("saved_recipes, meal_plan")
          .eq("user_id", user.id)
          .maybeSingle();

        if (loadError) throw loadError;
        if (cancelled) return;

        const accountSaved = cleanSaved(data?.saved_recipes);
        const accountPlan = cleanPlan(data?.meal_plan);
        const alreadySynced = localStorage.getItem(CLOUD_KEY) === user.id;

        setSavedRecipes((local) =>
          alreadySynced && data ? accountSaved : mergeById(accountSaved, local)
        );
        setPlannedMeals((local) =>
          alreadySynced && data ? accountPlan : mergeById(accountPlan, local)
        );

        localStorage.setItem(CLOUD_KEY, user.id);
        setSignedIn(true);
        setCloudReady(true);
      } catch (cloudError) {
        console.error("Could not load account data:", cloudError);
      }
    }

    loadAccountData();

    return () => {
      cancelled = true;
    };
  }, [restored]);

  useEffect(() => {
    if (!cloudReady) return;

    const timer = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error: saveError } = await supabase.from("cook_data").upsert(
          {
            user_id: user.id,
            saved_recipes: savedRecipes,
            meal_plan: plannedMeals,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (saveError) throw saveError;
      } catch (cloudError) {
        console.error("Could not sync account data:", cloudError);
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [cloudReady, savedRecipes, plannedMeals]);

  // Close the meal plan dialog with Escape.
  useEffect(() => {
    if (!planTarget) return;

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPlanTarget(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [planTarget]);

  const meals = useMemo(
    () => splitBlocks(result).blocks.filter((block) => /🍽/.test(block.heading)),
    [result]
  );

  const suggestions = useMemo(() => {
    const term = draft.trim().toLowerCase();
    const taken = new Set(ingredients.map((item) => item.toLowerCase()));
    if (!term) return [];

    const pool = SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(term)
    );

    return pool.filter((item) => !taken.has(item.toLowerCase())).slice(0, 8);
  }, [draft, ingredients]);

  // =========================
  // Ingredients
  // =========================

  // Typed ingredients that have no tile in the hero.
  const customIngredients = ingredients.filter(
    (item) =>
      !PANTRY.some((tile) => tile.name.toLowerCase() === item.toLowerCase())
  );

  function addIngredients(raw: string) {
    const items = raw
      .split(/[,\n]/)
      .map((item) => item.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .slice(0, 40);

    if (items.length === 0) return;

    setIngredients((previous) => mergeUnique(previous, items).slice(0, 40));
    setDraft("");
  }

  function removeIngredient(value: string) {
    setIngredients((previous) => previous.filter((item) => item !== value));
  }

  function clearAll() {
    setIngredients([]);
    setDraft("");
    setResult("");
    setError("");
    setAuthRequired(false);
  }

  function togglePantry(name: string) {
    const existing = ingredients.find(
      (item) => item.toLowerCase() === name.toLowerCase()
    );

    if (existing) removeIngredient(existing);
    else addIngredients(name);
  }

  function toggleAllergy(item: string) {
    setAllergies((previous) =>
      previous.includes(item)
        ? previous.filter((value) => value !== item)
        : [...previous, item]
    );
  }

  function changeCurrency(code: CurrencyCode) {
    setCurrency(code);
  }

  // =========================
  // Recipes
  // =========================

  async function findMeals(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (loading) return;

    setError("");
    setAuthRequired(false);
    setTab("results");

    if (ingredients.length === 0) {
      setError(t("err.ingredient"));
      return;
    }

    if (!budget || Number(budget) <= 0) {
      setError(t("err.budget"));
      return;
    }

    if (!time || Number(time) <= 0) {
      setError(t("err.time"));
      return;
    }

    if (!people || Number(people) <= 0) {
      setError(t("err.people"));
      return;
    }

    setLoading(true);
    setResult("");

    const ingredientText = ingredients.join(", ");

    const languageInstruction =
      lang === "ur"
        ? "Urdu (اردو), written in Urdu script (not Roman Urdu)."
        : lang === "hi"
          ? "Hindi (हिन्दी), written in Devanagari script."
          : "English.";

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
      budget: `
The user wants budget cooking.
Prioritize cheap, filling and nutritious meals built on low-cost ingredients.
Keep the total cost clearly within the budget and suitable for the number of people.
      `,
    };

    const sizeRange = MEAL_SIZES.find((item) => item.id === mealSize)?.range;
    const calorieInstruction = sizeRange
      ? `Choose meals that are about ${sizeRange[0]} to ${sizeRange[1]} kcal per serving. Always write an honest estimate in the Nutrition line. If the ingredients cannot reach this range, suggest the closest meals instead of changing portions to fit a number. Never use judging words such as "guilt-free", "cheat", "bad" or "clean".`
      : "No calorie target. Just write an honest estimate in the Nutrition line.";

    const prompt = `
You are LocalPlate AI's "What Can I Cook?" assistant.

USER INGREDIENTS:
${ingredientText}

MODE:
${mode}

${modeInstructions[mode]}

BUDGET:
${currency} ${budget}

NUMBER OF PEOPLE:
${people}

DIET:
${diet}

CUISINE:
${cuisine}

Prioritize the selected cuisine while respecting the user's
ingredients, budget, cooking time, and dietary restrictions.

DIFFICULTY:
${difficulty}

If difficulty is not "Any", suggest only recipes that match it:
- Easy: few steps, basic techniques, minimal equipment.
- Medium: some preparation and moderate cooking skill.
- Hard: advanced techniques or longer preparation.

MEAL TYPE:
${mealType}

ALLERGIES (NEVER INCLUDE, NOT EVEN AS A SUBSTITUTION):
${allergies.length > 0 ? allergies.join(", ") : "None"}

CALORIES PER SERVING:
${calorieInstruction}

MAXIMUM COOKING TIME:
${time} minutes

EXTRA PREFERENCE:
${notes.trim() || "None"}

RESPONSE LANGUAGE:
${languageInstruction}

Create 5 practical meal ideas.

IMPORTANT RULES:
- Prioritize the ingredients the user already has.
- Follow the selected CUISINE for all meal ideas.
- If the selected cuisine is "Any cuisine", choose the most practical meals for the ingredients, budget and time.
- Do not suggest Pakistani dishes unless the selected cuisine is Pakistani, South Asian or Any cuisine.
- If the ingredients are a poor fit for the selected cuisine, suggest the closest realistic version.
- Do not invent that the user owns ingredients that were not provided.
- Clearly identify additional ingredients that may be needed.
- Keep approximate costs realistic for ${currencyInfo.country}, using ${currency}.
- ${priceRule(currency)}\n${priceAccuracyRules(currency)}\n- Respect the selected budget, diet and allergies.
- Do not make medical claims and do not recommend extreme diets.
- For leftovers, prioritize food-waste reduction.
- For quick meals, respect the requested maximum time.
- For budget cooking, prioritize low cost and filling meals.
- Never include any ingredient listed under ALLERGIES, including in substitutions.
- If a meal type is selected (not "Any"), suggest only meals suitable for it.
- Write every ingredient with its quantity first, for example "500 g chicken" or "2 eggs", for the full group of ${people} people.
- Do not repeat ingredient quantities inside the recipe steps.
- Nutrition values are rough per-serving estimates, not medical advice.
- Write all text (meal names, ingredient names, steps, substitutions) in the RESPONSE LANGUAGE.
- Keep these labels exactly in English, even when the response language is not English: "## 🍽️", "**Estimated Cost:**", "**Time:**", "**Difficulty:**", "**Nutrition (per serving):**", "**You Already Have:**", "**You May Need:**", "**Quick Recipe:**", "**Substitutions:**", and the words Calories, Protein, Carbs, Fat.
- Use Latin digits (0-9) for all numbers and write units (g, kg, ml, cup, tbsp, tsp) in English letters.
- For Difficulty write exactly Easy, Medium or Hard.

FOR EACH MEAL USE THIS FORMAT:

## 🍽️ [Meal Name]

**Estimated Cost:** ${currency} [total amount for all ${people} people]

**Time:** [minutes]

**Difficulty:** [Easy / Medium / Hard]

**Nutrition (per serving):** Calories: [number] kcal | Protein: [number] g | Carbs: [number] g | Fat: [number] g

**You Already Have:**
- [quantity] [unit] ingredient

**You May Need:**
- [quantity] [unit] ingredient

**Quick Recipe:**
1. Step
2. Step
3. Step

**Substitutions:**
- missing ingredient → practical alternative (only for items under You May Need)

Keep the response concise. Do not add any text after the last meal.
`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, mode: "cook" }),
      });

      // Recipes need an account. Show a clear sign-in prompt instead of a
      // raw error. Ingredients are already kept in localStorage.
      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Request failed. Please try again.");
      }

      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error("No recipes were returned. Please try again.");
      }

      setResultCurrency(currency);
      setResultPeople(Number(people));
      setResult(data.reply);

      if (window.matchMedia("(max-width: 1023px)").matches) {
        window.requestAnimationFrame(() =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        );
      }
    } catch (requestError) {
      console.error("What can I cook error:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // Saved recipes
  // =========================

  function isSaved(heading: string) {
    const id = recipeId(heading);
    return savedRecipes.some((recipe) => recipe.id === id);
  }

  function toggleSave(meal: Block, peopleCount: number, symbol: string) {
    const id = recipeId(meal.heading);

    if (savedRecipes.some((recipe) => recipe.id === id)) {
      setSavedRecipes(savedRecipes.filter((recipe) => recipe.id !== id));
      showToast(t("toast.removedSaved"));
      return;
    }

    if (savedRecipes.length >= MAX_SAVED) {
      showToast(t("toast.limit", { n: MAX_SAVED }), "error");
      return;
    }

    setSavedRecipes([
      {
        id,
        title: recipeTitle(meal.heading),
        markdown: meal.markdown,
        savedAt: Date.now(),
        people: peopleCount,
        symbol,
      },
      ...savedRecipes,
    ]);
    showToast(t("toast.saved"));
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("toast.copied"));
    } catch (copyError) {
      console.error("Copy failed:", copyError);
      showToast(t("toast.copyFail"), "error");
    }
  }

  function sendToShoppingList(items: string[]) {
    if (items.length === 0) {
      showToast(t("toast.nothing"));
      return;
    }

    try {
      // The shopping list page merges these into the existing list.
      localStorage.setItem(
        "localplate_shopping_inbox",
        JSON.stringify({ items })
      );
      router.push("/shopping-list");
    } catch (storageError) {
      console.error("Could not open shopping list:", storageError);
      showToast(t("toast.shopFail"), "error");
    }
  }

  // =========================
  // Meal plan
  // =========================

  function updatePlan(next: PlannedMeal[]) {
    setPlannedMeals(next);
    setPlanSaved(false);
  }

  function confirmAddToPlan() {
    if (!planTarget) return;

    const id = `${pickDay}|${pickSlot}`;

    updatePlan([
      ...plannedMeals.filter((item) => item.id !== id),
      {
        id,
        day: pickDay,
        slot: pickSlot,
        title: recipeTitle(planTarget.meal.heading),
        markdown: planTarget.meal.markdown,
        symbol: planTarget.symbol,
      },
    ]);

    showToast(
      t("toast.added", {
        day: label("day", pickDay),
        slot: label("opt", pickSlot),
      })
    );
    setPlanTarget(null);
  }

  const orderedPlan = MEAL_DAYS.flatMap((day) =>
    MEAL_SLOTS.flatMap((slot) =>
      plannedMeals.filter((meal) => meal.day === day && meal.slot === slot)
    )
  );

  function planShoppingItems() {
    const seen = new Set<string>();
    const items: string[] = [];

    plannedMeals.forEach((meal) => {
      readListLines(readSection(meal.markdown, "You May Need")).forEach(
        (item) => {
          const key = item.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          items.push(item);
        }
      );
    });

    return items;
  }

  function planTotal() {
    const symbols = new Set(plannedMeals.map((meal) => meal.symbol));
    if (symbols.size !== 1) return null;

    const total = plannedMeals.reduce((sum, meal) => {
      const value = Number((readCost(meal.markdown) ?? "").replace(/,/g, ""));
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return total > 0
      ? `${plannedMeals[0].symbol} ${(Math.round(total * 100) / 100).toLocaleString(
          "en-US",
          { maximumFractionDigits: 2 }
        )}`
      : null;
  }

  function buildPlanMarkdown() {
    const sections = orderedPlan.map(
      (meal) => `### ${meal.day} — ${meal.slot}\n\n${meal.markdown.trim()}`
    );

    const total = planTotal();
    const items = planShoppingItems();

    return [
      `# My Cooking Plan (${orderedPlan.length} meal${
        orderedPlan.length > 1 ? "s" : ""
      })`,
      ...sections,
      total ? `**Estimated plan cost:** ${total}` : "",
      items.length > 0
        ? `## 🛒 Ingredients\n${items.map(planItemLine).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // Saves the plan in the planner's format so it appears in Saved Plans.
  async function savePlanToSavedPlans() {
    if (plannedMeals.length === 0 || savingPlan || planSaved) return;

    setSavingPlan(true);

    const mealPlan = buildPlanMarkdown();
    const createdAt = new Date().toISOString();
    const foodType =
      cuisine === "Pakistani" || cuisine === "Indian" ? cuisine : "Any";
    const planDiet = ["Normal", "Vegetarian", "High Protein"].includes(diet)
      ? diet
      : "Normal";
    const allergyText = allergies.join(", ");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: saveError } = await supabase
          .from("saved_plans")
          .insert({
            user_id: user.id,
            meal_plan: mealPlan,
            food_type: foodType,
            budget,
            meal_type: "Dinner",
            diet: planDiet,
            time,
            goal: "Healthy Eating",
            servings: people,
            city: "",
            spice_level: "Medium",
            allergies: allergyText,
            dislikes: "",
            pantry: "",
            extra_preferences: "",
            created_at: createdAt,
            favorite: false,
            plan_type: "single",
          });

        if (saveError) throw saveError;
      }

      let savedPlans: unknown[] = [];

      try {
        const parsed: unknown = JSON.parse(
          localStorage.getItem("localplate_saved_plans") || "[]"
        );
        savedPlans = Array.isArray(parsed) ? parsed : [];
      } catch {
        savedPlans = [];
      }

      localStorage.setItem(
        "localplate_saved_plans",
        JSON.stringify([
          {
            id: Date.now(),
            mealPlan,
            foodType,
            budget,
            mealType: "Dinner",
            diet: planDiet,
            time,
            goal: "Healthy Eating",
            servings: people,
            city: "",
            spiceLevel: "Medium",
            allergies: allergyText,
            dislikes: "",
            pantry: "",
            extraPreferences: "",
            createdAt,
            favorite: false,
            planType: "single" as const,
          },
          ...savedPlans,
        ])
      );

      setPlanSaved(true);
      showToast(t("toast.planSaved"));
    } catch (saveError) {
      console.error("Could not save the cooking plan:", saveError);
      showToast(t("toast.planFail"), "error");
    } finally {
      setSavingPlan(false);
    }
  }

  // =========================
  // Tabs
  // =========================

  function handleTabKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const index = TABS.findIndex((item) => item.id === tab);
    const next =
      TABS[
        (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) %
          TABS.length
      ];

    setTab(next.id);
    document.getElementById(`cook-tab-${next.id}`)?.focus();
  }

  const tabCounts: Record<Tab, number> = {
    results: meals.length,
    saved: savedRecipes.length,
    plan: plannedMeals.length,
  };

  const syncNote = signedIn ? (
    <p className="mb-3 text-xs text-zinc-500">{t("cook.synced")}</p>
  ) : (
    <p className="mb-3 text-xs text-zinc-500">
      {t("cook.localOnly")}{" "}
      <Link href="/login" className="underline hover:text-zinc-800">
        {t("cook.signInSync")}
      </Link>
    </p>
  );

  // =========================
  // Render
  // =========================

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-amber-300/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-red-900/30 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 pb-8 pt-8 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-10 lg:grid-cols-[1fr_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:pb-16 lg:pt-14">
          <div>
            <h1
              className={`${display.className} text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl`}
            >
              {t("cook.title")}
            </h1>

            <p className="mt-3 max-w-md text-base leading-relaxed text-orange-50 sm:mt-4 sm:text-lg">
              {t("cook.tagline")}
            </p>

            <ul className="mt-6 hidden space-y-3 text-sm font-medium sm:block sm:text-base">
              {(["cook.f1", "cook.f2", "cook.f3"] as const).map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-orange-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5"
                      aria-hidden="true"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-4 text-stone-900 shadow-2xl shadow-red-950/30 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{t("cook.pantryTitle")}</h2>

              {ingredients.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {t("cook.pantryCount", { n: ingredients.length })}
                </span>
              )}
            </div>

            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {PANTRY.map((item, index) => {
                const selected = ingredients.some(
                  (value) => value.toLowerCase() === item.name.toLowerCase()
                );

                return (
                  <li
                    key={item.name}
                    className="cook-tile-in"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => togglePantry(item.name)}
                      aria-pressed={selected}
                      className={`relative flex h-full min-h-[84px] w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-3 text-center outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95 ${
                        selected
                          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-500/20"
                          : "border-stone-200 bg-stone-50 hover:border-orange-300 hover:bg-white md:hover:-translate-y-0.5"
                      }`}
                    >
                      {selected && (
                        <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3"
                            aria-hidden="true"
                          >
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                        </span>
                      )}
                      <span className="text-3xl leading-none" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <span className="text-xs font-medium sm:text-[13px]">
                        {label("ing", item.name)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <input
                id="ingredient-input"
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addIngredients(draft);
                  }
                }}
                onBlur={() => addIngredients(draft)}
                maxLength={60}
                placeholder={t("cook.ingredientPlaceholder")}
                aria-label={t("cook.ingredients")}
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition placeholder:text-stone-500 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 sm:text-sm"
              />

              {suggestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addIngredients(item)}
                      className="rounded-lg border border-dashed border-stone-300 px-2.5 py-1 text-xs text-stone-600 outline-none transition hover:border-orange-400 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      + {label("ing", item)}
                    </button>
                  ))}
                </div>
              )}

              {customIngredients.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {customIngredients.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500 bg-orange-50 py-1 pl-3 pr-1 text-sm font-semibold text-orange-950 shadow-sm shadow-orange-500/10"
                    >
                      <span aria-hidden="true" className="text-lg leading-none">
                        {pantryEmoji(item)}
                      </span>
                      {label("ing", item)}
                      <button
                        type="button"
                        onClick={() => removeIngredient(item)}
                        aria-label={t("cook.removeItem", { x: label("ing", item) })}
                        className="flex size-7 items-center justify-center rounded-full bg-orange-200/70 text-orange-900 outline-none transition hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        <Icon name="x" className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:pb-10">
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Inputs */}
          <form
            onSubmit={findMeals}
            className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cuisine" className={labelClass}>
                  {t("cook.cuisine")}
                </label>
                <select
                  id="cuisine"
                  value={cuisine}
                  onChange={(event) => setCuisine(event.target.value)}
                  className={fieldClass}
                >
                  {CUISINES.map((item) => (
                    <option key={item} value={item}>
                      {label("opt", item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="diet" className={labelClass}>
                  {t("cook.diet")}
                </label>
                <select
                  id="diet"
                  value={diet}
                  onChange={(event) => setDiet(event.target.value)}
                  className={fieldClass}
                >
                  {DIETS.map((item) => (
                    <option key={item} value={item}>
                      {label("opt", item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="time" className={labelClass}>
                  {t("cook.time")}
                </label>
                <input
                  id="time"
                  type="text"
                  inputMode="numeric"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="people" className={labelClass}>
                  {t("cook.people")}
                </label>
                <input
                  id="people"
                  type="text"
                  inputMode="numeric"
                  value={people}
                  onChange={(event) =>
                    setPeople(event.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget" className={labelClass}>
                {t("cook.budget")}
              </label>

              <div className="flex gap-2">
                <select
                  aria-label={t("cook.currency")}
                  value={currency}
                  onChange={(event) =>
                    changeCurrency(event.target.value as CurrencyCode)
                  }
                  className={`${fieldClass.replace("w-full", "")} w-28 shrink-0`}
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>

                <input
                  id="budget"
                  type="text"
                  inputMode="numeric"
                  value={budget}
                  onChange={(event) =>
                    setBudget(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={fieldClass}
                />
              </div>
            </div>

            <fieldset>
              <legend className={labelClass}>{t("cook.size")}</legend>

              <div role="radiogroup" className="mt-1 grid grid-cols-4 gap-1.5">
                {MEAL_SIZES.map((item) => {
                  const active = mealSize === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMealSize(item.id)}
                      className={`h-10 touch-manipulation rounded-lg border px-1 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 ${
                        active
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-stone-200 bg-white text-stone-700 hover:border-orange-300"
                      }`}
                    >
                      {t(item.label)}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const range = MEAL_SIZES.find(
                  (item) => item.id === mealSize
                )?.range;

                return range ? (
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">
                    {t("cook.sizeRange", { a: range[0], b: range[1] })}{" "}
                    {t("cook.sizeNote")}
                  </p>
                ) : null;
              })()}
            </fieldset>

            <details className="group rounded-lg border border-zinc-200">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                <span>
                  {t("cook.more")}
                  {allergies.length > 0 && (
                    <span className="ms-1.5 text-xs font-normal text-zinc-500">
                      {t("cook.allergyCount", { n: allergies.length })}
                    </span>
                  )}
                </span>
                <Icon
                  name="chevron"
                  className="size-4 text-zinc-400 transition-transform group-open:rotate-180"
                />
              </summary>

              <div className="space-y-4 border-t border-zinc-200 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="difficulty" className={labelClass}>
                      {t("cook.difficulty")}
                    </label>
                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      className={fieldClass}
                    >
                      {DIFFICULTIES.map((item) => (
                        <option key={item} value={item}>
                      {label("opt", item)}
                    </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="meal-type" className={labelClass}>
                      {t("cook.meal")}
                    </label>
                    <select
                      id="meal-type"
                      value={mealType}
                      onChange={(event) => setMealType(event.target.value)}
                      className={fieldClass}
                    >
                      {MEAL_TYPES.map((item) => (
                        <option key={item} value={item}>
                      {label("opt", item)}
                    </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="mode" className={labelClass}>
                    {t("cook.goal")}
                  </label>
                  <select
                    id="mode"
                    value={mode}
                    onChange={(event) => setMode(event.target.value as Mode)}
                    className={fieldClass}
                  >
                    {MODES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(item.label as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className={labelClass}>{t("cook.allergies")}</span>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label={t("cook.allergies")}
                  >
                    {ALLERGIES.map((item) => {
                      const active = allergies.includes(item);

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAllergy(item)}
                          aria-pressed={active}
                          className={`rounded-md border px-2.5 py-1 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 ${
                            active
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
                          }`}
                        >
                          {label("opt", item)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className={labelClass}>
                    {t("cook.notes")}
                  </label>
                  <input
                    id="notes"
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={200}
                    placeholder={t("cook.notesPlaceholder")}
                    className={fieldClass}
                  />
                </div>
              </div>
            </details>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="hidden h-12 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 lg:block px-4 text-base font-semibold text-white shadow-lg shadow-orange-600/25 outline-none transition hover:from-orange-600 hover:to-red-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("cook.finding") : t("cook.find")}
              </button>

              {(ingredients.length > 0 || result) && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 rounded-lg px-3 text-sm text-zinc-500 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {t("cook.clear")}
                </button>
              )}
            </div>

            <div id="cook-messages" className="space-y-4 empty:hidden">
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          {authRequired && (
            <div
              role="alert"
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-900"
            >
              <p>{t("cook.loginRequired")}</p>
              <Link
                href="/login?next=/cook"
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                {t("cook.loginBtn")}
              </Link>
            </div>
          )}
            </div>
          </form>

          {/* Output */}
          <section ref={resultsRef} aria-label={t("cook.recipesAria")} className="min-w-0">
            <div
              role="tablist"
              aria-label={t("tab.views")}
              onKeyDown={handleTabKeys}
              className="flex gap-1 border-b border-zinc-200"
            >
              {TABS.map((item) => {
                const active = tab === item.id;
                const count = tabCounts[item.id];

                return (
                  <button
                    key={item.id}
                    id={`cook-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`cook-panel-${item.id}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(item.id)}
                    className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      active
                        ? "border-orange-600 text-zinc-900"
                        : "border-transparent text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {t(item.label as TranslationKey)}
                    {count > 0 && (
                      <span className="ml-1.5 text-xs text-zinc-400">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            {tab === "results" && (
              <div
                id="cook-panel-results"
                role="tabpanel"
                aria-labelledby="cook-tab-results"
                className="mt-4"
              >
                {loading ? (
                  <div className="space-y-3" role="status" aria-live="polite">
                    <span className="sr-only">{t("cook.finding")}</span>
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-[72px] animate-pulse rounded-xl bg-zinc-200/70"
                      />
                    ))}
                  </div>
                ) : meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map((meal, index) => (
                      <RecipeCard
                        key={`${meal.heading}-${index}`}
                        meal={meal}
                        basePeople={resultPeople > 0 ? resultPeople : 1}
                        symbol={resultSymbol}
                        saved={isSaved(meal.heading)}
                        defaultOpen={index === 0}
                        onSave={() =>
                          toggleSave(meal, resultPeople, resultSymbol)
                        }
                        onPlan={() =>
                          setPlanTarget({ meal, symbol: resultSymbol })
                        }
                        onShop={sendToShoppingList}
                        onCopy={() => copyText(meal.markdown)}
                      />
                    ))}
                  </div>
                ) : result ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="mb-3 text-xs text-zinc-500">
                      {t("cook.raw")}
                    </p>
                    <Markdown text={result} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
                    <h2
                      className={`${display.className} text-2xl font-semibold tracking-tight sm:text-3xl`}
                    >
                      {t("cook.stepsTitle")}
                    </h2>

                    <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                      {(
                        [
                          ["cook.step1", "cook.step1d", "🧺"],
                          ["cook.step2", "cook.step2d", "⏱️"],
                          ["cook.step3", "cook.step3d", "🍽️"],
                        ] as const
                      ).map(([title, text, emoji], index) => (
                        <li
                          key={title}
                          className="rounded-2xl bg-orange-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex size-8 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="text-2xl" aria-hidden="true">
                              {emoji}
                            </span>
                          </div>
                          <h3 className="mt-4 text-sm font-semibold">
                            {t(title)}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-stone-600">
                            {t(text)}
                          </p>
                        </li>
                      ))}
                    </ol>

                    <p className="mt-6 text-sm text-stone-500">
                      {t("cook.empty")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Saved */}
            {tab === "saved" && (
              <div
                id="cook-panel-saved"
                role="tabpanel"
                aria-labelledby="cook-tab-saved"
                className="mt-4"
              >
                {syncNote}

                {savedRecipes.length > 0 ? (
                  <div className="space-y-3">
                    {savedRecipes.map((recipe) => {
                      const meal: Block = splitBlocks(recipe.markdown)
                        .blocks[0] ?? {
                        heading: recipe.title,
                        body: recipe.markdown,
                        markdown: recipe.markdown,
                      };
                      const symbol = recipe.symbol ?? "Rs.";

                      return (
                        <RecipeCard
                          key={recipe.id}
                          meal={meal}
                          basePeople={recipe.people && recipe.people > 0 ? recipe.people : 2}
                          symbol={symbol}
                          saved
                          onSave={() =>
                            setSavedRecipes(
                              savedRecipes.filter((item) => item.id !== recipe.id)
                            )
                          }
                          onPlan={() => setPlanTarget({ meal, symbol })}
                          onShop={sendToShoppingList}
                          onCopy={() => copyText(recipe.markdown)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
                    {t("cook.noSaved")}
                  </p>
                )}
              </div>
            )}

            {/* Plan */}
            {tab === "plan" && (
              <div
                id="cook-panel-plan"
                role="tabpanel"
                aria-labelledby="cook-tab-plan"
                className="mt-4"
              >
                {syncNote}

                {orderedPlan.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {MEAL_DAYS.filter((day) =>
                        orderedPlan.some((meal) => meal.day === day)
                      ).map((day) => (
                        <div key={day}>
                          <SectionLabel>{day}</SectionLabel>

                          <ul className="mt-1.5 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                            {orderedPlan
                              .filter((meal) => meal.day === day)
                              .map((meal) => {
                                const mealCost = readCost(meal.markdown);

                                return (
                                  <li
                                    key={meal.id}
                                    className="flex items-center gap-3 py-1.5 pl-4 pr-2 text-sm"
                                  >
                                    <span className="w-20 shrink-0 text-zinc-500">
                                      {meal.slot}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">
                                      {meal.title}
                                    </span>
                                    {mealCost && (
                                      <span className="shrink-0 text-zinc-500">
                                        {meal.symbol} {mealCost}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updatePlan(
                                          plannedMeals.filter(
                                            (item) => item.id !== meal.id
                                          )
                                        )
                                      }
                                      aria-label={`${t("cook.removeTitle")} ${meal.title}`}
                                      title={t("cook.removeTitle")}
                                      className={iconButton}
                                    >
                                      <Icon name="x" />
                                    </button>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {planTotal() && (
                        <span className="mr-auto text-sm text-zinc-600">
                          {t("cook.estCost")}{" "}
                          <span className="font-semibold text-zinc-900">
                            {planTotal()}
                          </span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => sendToShoppingList(planShoppingItems())}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium outline-none transition hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        {t("cook.shoppingList")}
                      </button>

                      {planSaved ? (
                        <Link
                          href="/saved-plans"
                          className="inline-flex h-10 items-center rounded-lg border border-green-300 bg-green-50 px-4 text-sm font-medium text-green-700 outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                          {t("cook.savedOpen")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={savePlanToSavedPlans}
                          disabled={savingPlan}
                          className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium outline-none transition hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60"
                        >
                          {savingPlan ? t("cook.saving") : t("cook.savePlan")}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          updatePlan([]);
                          showToast(t("toast.planCleared"));
                        }}
                        aria-label={t("cook.clearPlan")}
                        title={t("cook.clearPlan")}
                        className={`${iconButton} size-10 hover:text-red-600`}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
                    {t("cook.noPlan")}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add to plan dialog */}
      {planTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setPlanTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
          >
            <h2 id="plan-dialog-title" className="font-semibold">
              {t("cook.planAdd")}
            </h2>

            <p className="mt-0.5 truncate text-sm text-zinc-500">
              {recipeTitle(planTarget.meal.heading)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="plan-day" className={labelClass}>
                  {t("cook.day")}
                </label>
                <select
                  id="plan-day"
                  value={pickDay}
                  onChange={(event) => setPickDay(event.target.value)}
                  className={fieldClass}
                >
                  {MEAL_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {label("day", day)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="plan-slot" className={labelClass}>
                  {t("cook.meal")}
                </label>
                <select
                  id="plan-slot"
                  value={pickSlot}
                  onChange={(event) => setPickSlot(event.target.value)}
                  className={fieldClass}
                >
                  {MEAL_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {label("opt", slot)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {plannedMeals.some((meal) => meal.id === `${pickDay}|${pickSlot}`) && (
              <p className="mt-3 text-xs text-amber-700">
                {t("cook.slotTaken")}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanTarget(null)}
                className="h-10 rounded-lg px-4 text-sm text-zinc-600 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                {t("cook.cancel")}
              </button>

              <button
                type="button"
                autoFocus
                onClick={confirmAddToPlan}
                className="h-10 rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white outline-none hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {t("cook.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.tone === "error" ? "bg-red-600" : "bg-zinc-900"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Phones: one big button that stays in reach. Leaves room for the Feedback button. */}
      {ingredients.length > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="pointer-events-auto mb-4 me-40 ms-4">
            <button
              type="button"
              onClick={() => findMeals()}
              disabled={loading}
              className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 text-base font-semibold text-white shadow-xl shadow-orange-900/30 outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? t("cook.finding") : t("cook.find")}
              {!loading && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
                  {ingredients.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}