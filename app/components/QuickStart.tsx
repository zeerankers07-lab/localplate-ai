"use client";

import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { pantryEmoji } from "@/lib/pantry";

const BUDGETS = ["500", "1000", "2000"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const DIETS = ["Normal", "Vegetarian", "High Protein"];
const GOALS = ["Healthy Eating", "Weight Loss", "Maintain Weight"];

const COOK_INGREDIENTS = [
  "Chicken",
  "Eggs",
  "Rice",
  "Potatoes",
  "Onions",
  "Tomatoes",
  "Daal",
  "Flour",
  "Garlic",
  "Spinach",
  "Yogurt",
  "Bread",
];

// The /cook page restores its ingredients from this key.
const COOK_STORAGE_KEY = "localplate_cook_ingredients";

type Tab = "cook" | "plan";

const ICON_PATHS = {
  utensils: "M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 2-3 4-3 7h3v11",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  check: "M5 12l5 5 9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
} as const;

type IconName = keyof typeof ICON_PATHS;

function Icon({
  name,
  className = "size-4",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
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

const TABS: {
  id: Tab;
  label: TranslationKey;
  short: TranslationKey;
  icon: IconName;
}[] = [
  { id: "cook", label: "qs.tabCook", short: "qs.tabCookShort", icon: "utensils" },
  { id: "plan", label: "qs.tabPlan", short: "qs.tabPlanShort", icon: "calendar" },
];

const chipBase =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 active:scale-95";
const chipOn =
  "border-orange-600 bg-orange-600 text-white shadow-sm shadow-orange-600/25";
const chipOff =
  "border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50";

const segBase =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-1.5 text-[13px] font-medium leading-tight whitespace-nowrap outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 active:scale-95 sm:px-3 sm:text-sm";

const primaryButton =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-7 text-sm font-semibold text-white shadow-md shadow-orange-600/25 outline-none transition hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto";

type OptionGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  format?: (value: string) => string;
};

function OptionGroup({
  label,
  options,
  value,
  onChange,
  format,
}: OptionGroupProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <div
        className="mt-2.5 grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={`${segBase} ${active ? chipOn : chipOff}`}
            >
              {format ? format(option) : option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuickStart() {
  const router = useRouter();
  const { t, label } = useI18n();

  const [tab, setTab] = useState<Tab>("cook");

  // Meal planner quick start
  const [budget, setBudget] = useState("1000");
  const [mealType, setMealType] = useState("Lunch");
  const [diet, setDiet] = useState("Normal");
  const [goal, setGoal] = useState("Healthy Eating");

  // What Can I Cook? quick start
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  const cookOptions = [
    ...COOK_INGREDIENTS,
    ...selected.filter(
      (item) =>
        !COOK_INGREDIENTS.some(
          (base) => base.toLowerCase() === item.toLowerCase()
        )
    ),
  ];

  const startPlanning = () => {
    try {
      // The planner already reads these preferences on load.
      localStorage.setItem(
        "localplate_reuse_preferences",
        JSON.stringify({ budget, mealType, diet, goal })
      );
    } catch (error) {
      console.error("Could not save quick start preferences:", error);
    }

    router.push("/planner");
  };

  function toggleIngredient(item: string) {
    setSelected((previous) =>
      previous.some((value) => value.toLowerCase() === item.toLowerCase())
        ? previous.filter((value) => value.toLowerCase() !== item.toLowerCase())
        : [...previous, item]
    );
  }

  function addCustomIngredient() {
    const value = custom.trim().replace(/,/g, " ").replace(/\s+/g, " ");
    if (!value) return;

    const label = value.charAt(0).toUpperCase() + value.slice(1);

    setSelected((previous) =>
      previous.some((item) => item.toLowerCase() === label.toLowerCase())
        ? previous
        : [...previous, label]
    );
    setCustom("");
  }

  const startCooking = () => {
    if (selected.length === 0) return;

    try {
      localStorage.setItem(COOK_STORAGE_KEY, selected.join(", "));
    } catch (error) {
      console.error("Could not save ingredients:", error);
    }

    router.push("/cook");
  };

  function handleTabKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const next: Tab = tab === "cook" ? "plan" : "cook";
    setTab(next);

    document.getElementById(`quickstart-tab-${next}`)?.focus();
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_24px_60px_-28px_rgba(234,88,12,0.35)] sm:p-7">
      <div
        role="tablist"
        aria-label={t("qs.tabs")}
        onKeyDown={handleTabKeys}
        className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1"
      >
        {TABS.map((item) => {
          const active = tab === item.id;

          return (
            <button
              key={item.id}
              id={`quickstart-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`quickstart-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 ${
                active
                  ? "bg-white text-orange-800 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Icon name={item.icon} />
              <span className="sm:hidden">{t(item.short)}</span>
              <span className="hidden sm:inline">{t(item.label)}</span>
            </button>
          );
        })}
      </div>

      {tab === "cook" ? (
        <div
          id="quickstart-panel-cook"
          role="tabpanel"
          aria-labelledby="quickstart-tab-cook"
          className="mt-6"
        >
          <p className="text-base font-semibold text-zinc-900">
            {t("qs.cookIntro")}
          </p>

          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {cookOptions.map((item) => {
              const active = selected.some(
                (value) => value.toLowerCase() === item.toLowerCase()
              );

              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    aria-pressed={active}
                    className={`relative flex h-full min-h-[84px] w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-3 text-center outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95 ${
                      active
                        ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-500/20"
                        : "border-zinc-200 bg-zinc-50 hover:border-orange-300 hover:bg-white md:hover:-translate-y-0.5"
                    }`}
                  >
                    {active && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                        <Icon name="check" className="size-3" />
                      </span>
                    )}
                    <span className="text-3xl leading-none" aria-hidden="true">
                      {pantryEmoji(item)}
                    </span>
                    <span className="text-xs font-medium text-zinc-800 sm:text-[13px]">
                      {label("ing", item)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="relative mt-4">
            <label htmlFor="quickstart-custom" className="sr-only">
              {t("qs.addAria")}
            </label>

            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />

            <input
              id="quickstart-custom"
              type="text"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomIngredient();
                }
              }}
              maxLength={40}
              placeholder={t("qs.addPlaceholder")}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-base outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 sm:text-sm"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500" aria-live="polite">
              {selected.length > 0
                ? t("qs.selected", { n: selected.length })
                : t("qs.pickOne")}
            </p>

            <button
              type="button"
              onClick={startCooking}
              disabled={selected.length === 0}
              className={primaryButton}
            >
              {t("qs.find")}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      ) : (
        <div
          id="quickstart-panel-plan"
          role="tabpanel"
          aria-labelledby="quickstart-tab-plan"
          className="mt-6"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <OptionGroup
              label={t("qs.budget")}
              options={BUDGETS}
              value={budget}
              onChange={setBudget}
              format={(option) => `Rs. ${option}`}
            />

            <OptionGroup
              label={t("qs.meal")}
              options={MEAL_TYPES}
              value={mealType}
              onChange={setMealType}
              format={(option) => label("qs.m", option)}
            />

            <OptionGroup
              label={t("qs.diet")}
              options={DIETS}
              value={diet}
              onChange={setDiet}
              format={(option) => label("qs.d", option)}
            />

            <OptionGroup
              label={t("qs.goal")}
              options={GOALS}
              value={goal}
              onChange={setGoal}
              format={(option) => label("qs.g", option)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              Rs. {budget} · {label("qs.m", mealType)} · {label("qs.d", diet)} ·{" "}
              {label("qs.g", goal)}
            </p>

            <button
              type="button"
              onClick={startPlanning}
              className={primaryButton}
            >
              {t("qs.build")}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}