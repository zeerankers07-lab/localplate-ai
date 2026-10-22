"use client";

import Link from "next/link";
import QuickStart from "./components/QuickStart";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { RECIPE_PAGES } from "@/lib/seoPages";
import { pantryEmoji } from "@/lib/pantry";

const ICON_PATHS = {
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  bookmark: "M6 3h12v18l-6-4-6 4V3z",
  cart: "M3 4h2l2.4 11h10.2L20 8H6.2M9 20h.01M17 20h.01",
  check: "M5 12l5 5 9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
} as const;

type IconName = keyof typeof ICON_PATHS;

function Icon({
  name,
  className = "size-5",
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

const TOOLS: {
  href: string;
  title: TranslationKey;
  text: TranslationKey;
  icon: IconName;
}[] = [
  {
    href: "/weekly-plan",
    title: "home.weekly",
    text: "home.weeklyText",
    icon: "calendar",
  },
  {
    href: "/saved-plans",
    title: "home.saved",
    text: "home.savedText",
    icon: "bookmark",
  },
  {
    href: "/shopping-list",
    title: "home.shopping",
    text: "home.shoppingText",
    icon: "cart",
  },
];

const HIGHLIGHTS: TranslationKey[] = ["home.hl1", "home.hl2", "home.hl3"];
const STEPS: TranslationKey[] = ["home.step1", "home.step2", "home.step3"];

export default function Home() {
  const { t, label } = useI18n();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_45%,#fafafa_100%)] text-zinc-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-28 mx-auto h-80 w-[44rem] max-w-full rounded-full bg-orange-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-44 size-64 rounded-full bg-amber-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-[28rem] size-64 rounded-full bg-orange-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6 sm:pt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-orange-500" />
            {t("home.badge")}
          </span>

          <h1 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-5xl">
            {t("home.title1")}{" "}
            <span className="bg-[linear-gradient(90deg,#ea580c,#f59e0b)] bg-clip-text text-transparent">
              {t("home.title2")}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] text-zinc-600 sm:text-base">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <QuickStart />
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-zinc-500 sm:gap-x-6 sm:text-sm">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Icon name="check" className="size-4 text-orange-600" />
              {t(item)}
            </li>
          ))}
        </ul>

        <section className="mt-12" aria-labelledby="home-get">
          <h2 id="home-get" className="text-lg font-semibold">
            {t("home.getTitle")}
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_20px_50px_-30px_rgba(234,88,12,0.45)]">
            <div className="flex items-start justify-between gap-3 border-b border-orange-100 bg-orange-50/70 px-5 py-4">
              <div>
                <p className="text-xs font-medium text-orange-700">
                  {t("home.sampleBadge")}
                </p>
                <h3 className="mt-0.5 text-xl font-semibold">
                  {t("home.sampleTitle")}
                </h3>
              </div>
              <span className="text-4xl leading-none" aria-hidden="true">
                🍛
              </span>
            </div>

            <div className="space-y-4 p-5">
              <ul className="flex flex-wrap gap-2 text-sm text-zinc-700">
                {(
                  [
                    ["⏱️", "home.sampleTime"],
                    ["💰", "home.sampleCost"],
                    ["👥", "home.sampleServes"],
                    ["🔥", "home.sampleKcal"],
                  ] as const
                ).map(([emoji, key]) => (
                  <li
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5"
                  >
                    <span aria-hidden="true">{emoji}</span>
                    {t(key)}
                  </li>
                ))}
              </ul>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  {t("home.sampleMade")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {["Chicken", "Rice", "Onions"].map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-900"
                    >
                      <span aria-hidden="true">{pantryEmoji(item)}</span>
                      {label("ing", item)}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">
                  {t("home.sampleNeed")}:
                </span>{" "}
                {t("home.sampleNeedItems")}
              </p>
            </div>

            <p className="border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-xs text-zinc-500">
              {t("home.sampleNote")}
            </p>
          </div>
        </section>

        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 backdrop-blur"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-zinc-800">
                {t(step)}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 outline-none transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                <Icon name={tool.icon} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {t(tool.title)}
                </span>
                <span className="block truncate text-xs text-zinc-500">
                  {t(tool.text)}
                </span>
              </span>

              <Icon
                name="arrow"
                className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-orange-600 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          ))}
        </div>

        <section className="mt-12" aria-labelledby="home-ideas">
          <div className="flex items-end justify-between gap-3">
            <h2 id="home-ideas" className="text-lg font-semibold">
              {t("home.ideas")}
            </h2>

            <Link
              href="/recipes"
              className="text-sm font-medium text-orange-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {t("home.ideasAll")}
            </Link>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {RECIPE_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/recipes/${page.slug}`}
                  className="block h-full rounded-xl border border-zinc-200 bg-white p-4 outline-none transition hover:border-orange-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="block text-sm font-semibold">
                    {page.h1}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {page.short}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}