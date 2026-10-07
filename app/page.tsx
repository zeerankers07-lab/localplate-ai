import Link from "next/link";
import QuickStart from "./components/QuickStart";

const LOCAL_FOODS = [
  "🍛 Daal & Rice",
  "🍗 Chicken Karahi",
  "🥔 Aloo Keema",
  "🫓 Paratha",
  "🥘 Biryani",
  "🥣 Chana",
  "🍳 Egg Omelette",
  "🥗 Salad & Raita",
];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Meal Planner",
    text: "Personalized meals based on your taste, diet, goals and cooking time.",
    href: "/planner",
    cta: "Try the planner",
    tone: "bg-orange-50 text-orange-700",
  },
  {
    icon: "📅",
    title: "Weekly Planning",
    text: "A complete seven-day plan with breakfast, lunch and dinner in one go.",
    href: "/weekly-plan",
    cta: "Build a week",
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: "🛒",
    title: "Smart Shopping",
    text: "Turn any plan into an organized grocery list with prices and categories.",
    href: "/shopping-list",
    cta: "Open shopping list",
    tone: "bg-green-50 text-green-700",
  },
  {
    icon: "💾",
    title: "Saved Plans",
    text: "Keep your favorite plans, reuse them in one tap and never start from zero.",
    href: "/saved-plans",
    cta: "View saved plans",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    icon: "🍳",
    title: "What Can I Cook?",
    text: "Enter the ingredients you already have and discover practical meals you can cook with them.",
    href: "/cook",
    cta: "Find meals",
    tone: "bg-orange-50 text-orange-700",
  },
];

const STEPS = [
  {
    icon: "📝",
    title: "Tell us what you need",
    text: "Pick your budget, diet, goal and the ingredients you already have.",
  },
  {
    icon: "🤖",
    title: "AI builds your plan",
    text: "Get meals that fit your day, your taste and your spending limit.",
  },
  {
    icon: "🛒",
    title: "Shop and cook",
    text: "Save the plan, check off your shopping list and start cooking.",
  },
];

const WEEK = [
  { day: "Mon", lunch: "🍛 Chicken Curry", dinner: "🍚 Daal Rice" },
  { day: "Tue", lunch: "🥣 Chana", dinner: "🍗 Chicken Pulao" },
  { day: "Wed", lunch: "🍳 Omelette", dinner: "🥘 Aloo Keema" },
  { day: "Thu", lunch: "🥞 Paratha", dinner: "🍛 Chicken Karahi" },
];

const FAQS = [
  {
    question: "Is LocalPlate AI made for Pakistani food?",
    answer:
      "Yes. Plans focus on familiar Pakistani and South Asian meals and ingredients that are easy to find, but you can choose any food style you like.",
  },
  {
    question: "Can I plan around my budget?",
    answer:
      "Absolutely. Set your budget first and the plan, estimated prices and shopping list are built around it. You can also edit prices with your own numbers.",
  },
  {
    question: "Can I use ingredients I already have?",
    answer:
      "Yes. Add your pantry items and LocalPlate AI reuses them across meals to reduce waste and spending.",
  },
  {
    question: "Are my saved plans and shopping list kept safe?",
    answer:
      "When you are signed in, your plans and shopping list are stored in your account so you can open them again on any device.",
  },
];

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/planner", label: "Planner" },
  { href: "/weekly-plan", label: "Weekly Plan" },
  { href: "/saved-plans", label: "Saved Plans" },
  { href: "/shopping-list", label: "Shopping List" },
  { href: "/cook", label: "What Can I Cook?" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#fffaf5] pb-24 text-zinc-900 md:pb-0">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-80 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 -z-10 size-120 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-orange-100">
                ✨
              </span>
              AI-powered meal planning
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              Eat better.
              <br />
              Spend smarter.
              <br />
              <span className="text-orange-600">Plan with AI.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              LocalPlate AI turns your budget, taste, diet and pantry into
              practical meal plans made for everyday life.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planner"
                className="group inline-flex min-h-14 items-center justify-center rounded-full bg-orange-600 px-8 font-bold text-white shadow-xl shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-700 active:scale-95"
              >
                Create My Meal Plan
                <span
                  aria-hidden="true"
                  className="ml-2 transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              <Link
                href="/weekly-plan"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 font-bold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 active:scale-95"
              >
                📅 Build My Week
              </Link>

              <Link
                href="/cook"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-7 font-bold text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 active:scale-95"
              >
                🍳 What Can I Cook?
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
              {["Budget focused", "Local ingredients", "Free to start"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="absolute -right-2 top-6 z-20 hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl md:block lg:-right-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-lg">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold">Budget matched</p>
                  <p className="text-xs text-zinc-400">Fits Rs. 7,000</p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-orange-100 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                    🍽️
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">Your Meal Dashboard</p>
                    <p className="truncate text-xs text-zinc-400">
                      Personalized by LocalPlate AI
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                  AI Ready
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  Today
                </p>
                <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">
                  Balanced Pakistani Meals
                </h2>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["Budget", "Rs. 7,000"],
                    ["People", "2"],
                    ["Goal", "Healthy"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white/10 p-3">
                      <p className="text-[10px] uppercase text-zinc-400">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {[
                  ["🍳", "Breakfast", "Egg Paratha", "Rs. 180"],
                  ["🍛", "Lunch", "Chicken Curry", "Rs. 420"],
                  ["🍚", "Dinner", "Daal Rice", "Rs. 240"],
                ].map(([icon, meal, name, price]) => (
                  <li
                    key={meal}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        {meal}
                      </p>
                      <p className="truncate text-sm font-bold">{name}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-green-600">
                      {price}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-green-50 px-4 py-3">
                <span className="text-sm font-semibold text-green-800">
                  🛒 18 ingredients ready
                </span>
                <span className="text-sm font-bold text-green-700">
                  Rs. 1,540 left
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL FOOD STRIP */}
      <section
        aria-label="Popular local meals"
        className="border-y border-orange-100 bg-white py-5"
      >
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 sm:px-8 lg:justify-center">
          {LOCAL_FOODS.map((food) => (
            <span
              key={food}
              className="shrink-0 rounded-full border border-orange-100 bg-orange-50/60 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              {food}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-4 flex max-w-7xl justify-center px-5 sm:px-8">
          <Link
            href="/cook"
            className="inline-flex items-center font-bold text-orange-600 transition hover:text-orange-700"
          >
            See what you can cook
            <span className="ml-2">→</span>
          </Link>
        </div>
      </section>

      {/* QUICK START */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            Quick start
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Your first plan in ten seconds
          </h2>
          <p className="mt-3 text-zinc-600">
            Pick your basics and we will open the planner already filled in.
          </p>
        </div>

        <div className="mt-10">
          <QuickStart />
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              One smart food assistant
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to plan meals better
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group flex flex-col rounded-3xl border border-zinc-100 bg-[#fffaf5] p-6 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/60"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl text-2xl ${feature.tone}`}
                >
                  {feature.icon}
                </span>

                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">
                  {feature.text}
                </p>

                <span className="mt-5 text-sm font-bold text-orange-600">
                  {feature.cta}{" "}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            Simple by design
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            From preferences to plate
          </h2>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  {step.icon}
                </span>

                <span className="text-5xl font-black text-orange-100">
                  {index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold">{step.title}</h3>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* WEEKLY PREVIEW */}
      <section className="bg-zinc-950 py-16 text-white md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
              Plan ahead
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              One week.
              <br />
              <span className="text-orange-500">One smart plan.</span>
            </h2>

            <p className="mt-5 max-w-lg leading-7 text-zinc-400">
              Stop deciding what to cook every morning. Build your whole week
              around your budget, diet and preferences.
            </p>

            <Link
              href="/weekly-plan"
              className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-orange-600 px-8 font-bold text-white transition hover:bg-orange-700 active:scale-95"
            >
              Build Weekly Plan →
            </Link>
          </div>

          <div className="rounded-4xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">This week</h3>

              <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400">
                Budget OK
              </span>
            </div>

            <ul className="mt-4 space-y-2.5">
              {WEEK.map((item) => (
                <li
                  key={item.day}
                  className="grid grid-cols-[3rem_1fr] items-center gap-3 rounded-2xl bg-white/5 p-3 sm:grid-cols-[3.5rem_1fr_1fr]"
                >
                  <span className="text-sm font-bold text-orange-400">
                    {item.day}
                  </span>

                  <span className="truncate text-sm">{item.lunch}</span>

                  <span className="col-start-2 truncate text-sm text-zinc-400 sm:col-start-auto">
                    {item.dinner}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Estimated weekly cost</span>
                <span className="font-bold">Rs. 6,420 / 7,000</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-11/12 rounded-full bg-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            FAQ
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm open:border-orange-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {faq.question}

                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-16 sm:px-8 md:pb-24">
        <div className="mx-auto max-w-5xl rounded-4xl bg-linear-to-br from-orange-500 to-orange-700 px-6 py-12 text-center text-white shadow-2xl shadow-orange-200 sm:px-12 md:py-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Your next great meal
            <br />
            starts with a plan.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-orange-50">
            Tell LocalPlate AI what you like, what you can spend and what you
            already have. We will help with the rest.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/planner"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 font-bold text-orange-700 shadow-lg transition hover:bg-orange-50 active:scale-95"
            >
              Create My Meal Plan →
            </Link>

            <Link
              href="/weekly-plan"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/40 px-8 font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              Plan My Week
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-black">
              LocalPlate <span className="text-orange-600">AI</span>
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Smart, budget-friendly and local meal planning.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-zinc-600"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-orange-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
          © 2026 LocalPlate AI. All rights reserved.
        </div>
      </footer>

      {/* Mobile quick action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <Link
          href="/planner"
          className="flex min-h-12 items-center justify-center rounded-full bg-orange-600 font-bold text-white shadow-lg shadow-orange-200 active:scale-95"
        >
          Create My Meal Plan →
        </Link>
      </div>
    </main>
  );
}