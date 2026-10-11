import Link from "next/link";
import QuickStart from "./components/QuickStart";

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

const TOOLS: { href: string; title: string; text: string; icon: IconName }[] = [
  {
    href: "/weekly-plan",
    title: "Weekly plan",
    text: "Seven days of meals",
    icon: "calendar",
  },
  {
    href: "/saved-plans",
    title: "Saved plans",
    text: "Reuse past plans",
    icon: "bookmark",
  },
  {
    href: "/shopping-list",
    title: "Shopping list",
    text: "Check off as you shop",
    icon: "cart",
  },
];

const HIGHLIGHTS = [
  "PKR, INR and USD estimates",
  "Nutrition per serving",
  "Allergy filters",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_42%,#fafafa_100%)] text-zinc-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(251,146,60,0.22),transparent)]"
      />

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-medium text-orange-700 backdrop-blur">
            <span className="size-1.5 rounded-full bg-orange-500" />
            AI recipe and meal planner
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Cook smarter with{" "}
            <span className="text-orange-600">what you have</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-zinc-600">
            Recipes, costs and meal plans in seconds.
          </p>
        </div>

        <div className="mt-10">
          <QuickStart />
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Icon name="check" className="size-4 text-orange-600" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 outline-none transition hover:border-orange-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                <Icon name={tool.icon} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{tool.title}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {tool.text}
                </span>
              </span>

              <Icon
                name="arrow"
                className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-orange-600"
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}