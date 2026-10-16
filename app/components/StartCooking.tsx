"use client";

import { useRouter } from "next/navigation";

// Saves the ingredients where the What Can I Cook? tool reads them,
// then opens the tool.
export default function StartCooking({
  ingredients,
  label,
}: {
  ingredients: string[];
  label: string;
}) {
  const router = useRouter();

  function start() {
    try {
      localStorage.setItem("localplate_cook_ingredients", ingredients.join(", "));
    } catch {
      // The tool still opens without the ingredients.
    }

    router.push("/cook");
  }

  return (
    <button
      type="button"
      onClick={start}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-md shadow-orange-600/25 outline-none transition hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      {label}
    </button>
  );
}