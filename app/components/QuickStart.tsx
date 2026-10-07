"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BUDGETS = ["500", "1000", "2000"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const DIETS = ["Normal", "Vegetarian", "High Protein"];
const GOALS = ["Healthy Eating", "Weight Loss", "Maintain Weight"];

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
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
        {label}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition active:scale-95 ${
                active
                  ? "border-orange-600 bg-orange-600 text-white shadow-sm shadow-orange-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50"
              }`}
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

  const [budget, setBudget] = useState("1000");
  const [mealType, setMealType] = useState("Lunch");
  const [diet, setDiet] = useState("Normal");
  const [goal, setGoal] = useState("Healthy Eating");

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

  return (
    <div className="rounded-4xl border border-zinc-100 bg-white p-5 shadow-xl shadow-orange-100/60 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <OptionGroup
          label="Budget"
          options={BUDGETS}
          value={budget}
          onChange={setBudget}
          format={(option) => `Rs. ${option}`}
        />

        <OptionGroup
          label="Meal"
          options={MEAL_TYPES}
          value={mealType}
          onChange={setMealType}
        />

        <OptionGroup
          label="Diet"
          options={DIETS}
          value={diet}
          onChange={setDiet}
        />

        <OptionGroup
          label="Goal"
          options={GOALS}
          value={goal}
          onChange={setGoal}
        />
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          <span className="font-bold text-zinc-800">Your plan: </span>
          Rs. {budget} · {mealType} · {diet} · {goal}
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href="/planner"
            className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"
          >
            Customize more
          </Link>

          <button
            type="button"
            onClick={startPlanning}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-7 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 active:scale-95"
          >
            Build this plan
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}