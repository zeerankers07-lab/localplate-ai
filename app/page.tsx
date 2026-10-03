export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-zinc-900">

      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative">
        {/* Background decoration */}

        <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />

        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-amber-100/40 blur-3xl" />

        <div className="mx-auto grid min-w-0 max-w-7xl items-center gap-14 px-6 pb-20 pt-16 md:px-12 md:pb-28 md:pt-24 lg:grid-cols-[0.95fr_1.05fr]">

          {/* LEFT */}

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                ✨
              </span>

              AI-powered meal planning
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Eat better.
              <br />
              Spend smarter.
              <br />
              <span className="text-orange-600">
                Plan with AI.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-600 md:text-xl">
              LocalPlate AI turns your budget, taste, diet, goals and pantry
              ingredients into practical meal plans made for everyday life.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/planner"
                className="group inline-flex items-center justify-center rounded-full bg-orange-600 px-7 py-4 font-bold text-white shadow-xl shadow-orange-200 transition hover:-translate-y-1 hover:bg-orange-700"
              >
                Create My Meal Plan
                <span className="ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>

              <a
                href="/weekly-plan"
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-7 py-4 font-bold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50"
              >
                📅 Build My Week
              </a>
            </div>

            {/* Trust */}

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="font-bold text-green-600">✓</span>
                Budget focused
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-green-600">✓</span>
                Local ingredients
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-green-600">✓</span>
                Personalized
              </span>
            </div>
          </div>

          {/* =====================================================
              HERO PRODUCT PREVIEW
          ====================================================== */}

          <div className="relative min-w-0 w-full">

            {/* Floating notification */}

            <div className="absolute -right-2 top-4 z-20 hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl md:block lg:-right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-xl">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Budget matched
                  </p>

                  <p className="text-xs text-zinc-400">
                    Your plan fits Rs. 7,000
                  </p>
                </div>
              </div>
            </div>

            {/* Main dashboard */}

            <div className="relative box-border w-full min-w-0 max-w-full rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-2xl shadow-orange-100 md:p-6">

              {/* Dashboard header */}

              <div className="flex min-w-0 items-center justify-between gap-3 border-b border-zinc-100 pb-5">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                    🍽️
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      Your Meal Dashboard
                    </p>

                    <p className="truncate text-xs text-zinc-400">
                      Personalized by LocalPlate AI
                    </p>
                  </div>

                </div>

                <div className="shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  ● AI Ready
                </div>

              </div>

              {/* Profile */}

              <div className="mt-5 min-w-0 rounded-2xl bg-zinc-950 p-5 text-white">

                <div className="flex min-w-0 items-start justify-between gap-5">

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                      Today&apos;s plan
                    </p>

                    <h2 className="mt-2 break-words text-2xl font-bold">
                      Balanced Pakistani Meals
                    </h2>

                    <p className="mt-2 break-words text-sm text-zinc-400">
                      Designed around your budget and preferences.
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-4xl sm:block">
                    🥘
                  </div>

                </div>

                <div className="mt-5 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">

                  <div className="min-w-0 rounded-xl bg-white/10 p-3">
                    <p className="text-[10px] uppercase text-zinc-500">
                      Budget
                    </p>

                    <p className="mt-1 truncate text-sm font-bold">
                      Rs. 7,000
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl bg-white/10 p-3">
                    <p className="text-[10px] uppercase text-zinc-500">
                      Servings
                    </p>

                    <p className="mt-1 truncate text-sm font-bold">
                      2 People
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl bg-white/10 p-3">
                    <p className="text-[10px] uppercase text-zinc-500">
                      Goal
                    </p>

                    <p className="mt-1 truncate text-sm font-bold">
                      Healthy
                    </p>
                  </div>

                </div>
              </div>

              {/* Meals */}

              <div className="mt-5 min-w-0">

                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">
                    Today&apos;s meals
                  </h3>

                  <span className="shrink-0 text-xs font-semibold text-orange-600">
                    3 meals
                  </span>
                </div>

                <div className="mt-3 space-y-3">

                  {/* Breakfast */}

                  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-zinc-100 bg-[#fffaf5] p-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                      🍳
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-400">
                        Breakfast
                      </p>

                      <p className="mt-0.5 truncate font-bold">
                        Egg Paratha & Yogurt
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">
                        Cost
                      </p>

                      <p className="text-sm font-bold">
                        Rs. 180
                      </p>
                    </div>

                  </div>

                  {/* Lunch */}

                  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-zinc-100 bg-[#fffaf5] p-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-2xl">
                      🍛
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-400">
                        Lunch
                      </p>

                      <p className="mt-0.5 truncate font-bold">
                        Chicken Karahi & Roti
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">
                        Cost
                      </p>

                      <p className="text-sm font-bold">
                        Rs. 520
                      </p>
                    </div>

                  </div>

                  {/* Dinner */}

                  <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-zinc-100 bg-[#fffaf5] p-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                      🍚
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-400">
                        Dinner
                      </p>

                      <p className="mt-0.5 truncate font-bold">
                        Daal Rice & Salad
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">
                        Cost
                      </p>

                      <p className="text-sm font-bold">
                        Rs. 260
                      </p>
                    </div>

                  </div>

                </div>
              </div>

              {/* Budget */}

              <div className="mt-5 min-w-0 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    Weekly budget
                  </span>

                  <span className="font-bold text-orange-600">
                    Rs. 5,460 / 7,000
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full w-[78%] rounded-full bg-orange-600" />
                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-zinc-400">
                  <span>Used 78%</span>
                  <span>Rs. 1,540 remaining</span>
                </div>

              </div>

            </div>

            {/* Floating shopping card */}

            <div className="absolute -bottom-7 -left-4 z-20 hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl md:block lg:-left-8">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  🛒
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Shopping List
                  </p>

                  <p className="text-xs text-zinc-400">
                    18 ingredients ready
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          QUICK STATS
      ========================================================== */}

      <section className="border-y border-zinc-200 bg-white">

        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-zinc-200 md:grid-cols-4 md:divide-y-0">

          <div className="px-5 py-7 text-center">
            <p className="text-3xl font-black text-orange-600">
              7
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Days planned
            </p>
          </div>

          <div className="px-5 py-7 text-center">
            <p className="text-3xl font-black">
              AI
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Personalized planning
            </p>
          </div>

          <div className="px-5 py-7 text-center">
            <p className="text-3xl font-black">
              Local
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Food-first approach
            </p>
          </div>

          <div className="px-5 py-7 text-center">
            <p className="text-3xl font-black text-orange-600">
              Rs.
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Budget aware
            </p>
          </div>

        </div>

      </section>

      {/* =========================================================
          FEATURES
      ========================================================== */}

      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto max-w-7xl px-6 py-24 md:px-12"
      >

        <div className="mx-auto max-w-3xl text-center">

          <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
            One smart food assistant
          </p>

          <h2
            id="features-heading"
            className="mt-4 text-4xl font-black tracking-tight md:text-5xl"
          >
            Everything you need to plan meals better
          </h2>

          <p className="mt-5 text-lg leading-8 text-zinc-600">
            From your first meal idea to your final shopping list, LocalPlate
            AI keeps your food planning in one place.
          </p>

        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <article className="group rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl transition group-hover:scale-110">
              🤖
            </div>

            <h3 className="mt-6 text-xl font-bold">
              AI Meal Planner
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Personalized meals based on your taste, diet, goals, cooking
              time and preferences.
            </p>

            <a
              href="/planner"
              className="mt-5 inline-block text-sm font-bold text-orange-600"
            >
              Try planner →
            </a>

          </article>

          <article className="group rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl transition group-hover:scale-110">
              💰
            </div>

            <h3 className="mt-6 text-xl font-bold">
              Budget Control
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Plan meals around your available budget and keep food spending
              organized.
            </p>

            <a
              href="/planner"
              className="mt-5 inline-block text-sm font-bold text-orange-600"
            >
              Plan by budget →
            </a>

          </article>

          <article className="group rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl transition group-hover:scale-110">
              🛒
            </div>

            <h3 className="mt-6 text-xl font-bold">
              Smart Shopping
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Turn your generated meal plan into an organized grocery
              shopping list.
            </p>

            <a
              href="/shopping-list"
              className="mt-5 inline-block text-sm font-bold text-orange-600"
            >
              View shopping →
            </a>

          </article>

          <article className="group rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl transition group-hover:scale-110">
              📅
            </div>

            <h3 className="mt-6 text-xl font-bold">
              Weekly Planning
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Generate a complete seven-day plan with breakfast, lunch and
              dinner.
            </p>

            <a
              href="/weekly-plan"
              className="mt-5 inline-block text-sm font-bold text-orange-600"
            >
              Build a week →
            </a>

          </article>

        </div>
      </section>

      {/* =========================================================
          PERSONALIZATION
      ========================================================== */}

      <section className="bg-zinc-950 px-6 py-24 text-white md:px-12">

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

          <div>

            <p className="font-semibold uppercase tracking-[0.15em] text-orange-500">
              Personalization that matters
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Your meal plan should know
              <span className="text-orange-500">
                {" "}you.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              LocalPlate AI combines the details that actually affect what
              you cook — your budget, ingredients, diet, goals, taste and
              available time.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <span className="text-2xl">💸</span>

                <p className="mt-3 font-bold">
                  Your budget
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Spend according to your limits.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <span className="text-2xl">🥗</span>

                <p className="mt-3 font-bold">
                  Your diet
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Plan around your food preferences.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <span className="text-2xl">🧺</span>

                <p className="mt-3 font-bold">
                  Your pantry
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Use what you already have.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <span className="text-2xl">⏰</span>

                <p className="mt-3 font-bold">
                  Your time
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Choose meals that fit your routine.
                </p>
              </div>

            </div>

          </div>

          {/* Preference visual */}

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-5 md:p-7">

            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                  AI understands
                </p>

                <h3 className="mt-1 text-xl font-bold">
                  Your preferences
                </h3>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600">
                ✨
              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-400">
                    Budget
                  </span>

                  <span className="font-semibold text-white">
                    Rs. 7,000
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800">
                  <div className="h-full w-[72%] rounded-full bg-orange-600" />
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-800/70 p-4">

                <p className="text-xs text-zinc-500">
                  Food preference
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  <span className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-bold">
                    Pakistani
                  </span>

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Homemade
                  </span>

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Less Oil
                  </span>

                </div>

              </div>

              <div className="rounded-2xl bg-zinc-800/70 p-4">

                <p className="text-xs text-zinc-500">
                  Pantry available
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Rice
                  </span>

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Daal
                  </span>

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Potatoes
                  </span>

                  <span className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold">
                    Spices
                  </span>

                </div>

              </div>

              <div className="rounded-2xl border border-green-900/50 bg-green-950/30 p-4">

                <div className="flex gap-3">

                  <span className="text-xl">
                    ✓
                  </span>

                  <div>
                    <p className="font-bold">
                      AI plan optimized
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Meals match your preferences and budget.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          LOCAL FOOD
      ========================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">

        <div className="grid items-center gap-12 lg:grid-cols-2">

          <div className="order-2 lg:order-1">

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">

                <div className="text-5xl">
                  🍛
                </div>

                <h3 className="mt-5 font-bold">
                  Daal & Rice
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Simple everyday comfort food.
                </p>

              </div>

              <div className="mt-8 rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">

                <div className="text-5xl">
                  🍗
                </div>

                <h3 className="mt-5 font-bold">
                  Chicken Meals
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Practical family-friendly options.
                </p>

              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">

                <div className="text-5xl">
                  🥔
                </div>

                <h3 className="mt-5 font-bold">
                  Pantry Staples
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Ingredients you already have.
                </p>

              </div>

              <div className="mt-8 rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">

                <div className="text-5xl">
                  🥗
                </div>

                <h3 className="mt-5 font-bold">
                  Balanced Meals
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Meals around your goals.
                </p>

              </div>

            </div>

          </div>

          <div className="order-1 lg:order-2">

            <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
              Local food. Real life.
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Made for the food you actually cook.
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-600">
              LocalPlate AI focuses on practical Pakistani and South Asian
              meals using familiar ingredients that are easier to find,
              understand and cook.
            </p>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Whether you are cooking daal, rice, vegetables, chicken,
              paratha or something completely different, your plan starts
              with your preferences.
            </p>

            <a
              href="/planner"
              className="mt-7 inline-flex items-center font-bold text-orange-600"
            >
              Create a local meal plan
              <span className="ml-2">
                →
              </span>
            </a>

          </div>

        </div>

      </section>

      {/* =========================================================
          WEEKLY PLANNER PREVIEW
      ========================================================== */}

      <section className="bg-orange-50 px-6 py-24 md:px-12">

        <div className="mx-auto max-w-7xl">

          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">

            <div>

              <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
                Plan ahead
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                One week.
                <br />
                One smart plan.
              </h2>

              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Stop deciding what to cook every morning. Build your whole
                week around your budget, diet and preferences.
              </p>

              <a
                href="/weekly-plan"
                className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700"
              >
                Build Weekly Plan →
              </a>

            </div>

            {/* Week cards */}

            <div className="min-w-0 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100 md:p-7">

              <div className="flex min-w-0 items-center justify-between gap-3 border-b border-zinc-100 pb-5">

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                    Weekly plan
                  </p>

                  <h3 className="mt-1 truncate text-xl font-bold">
                    This week&apos;s meals
                  </h3>
                </div>

                <span className="shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  Budget OK
                </span>

              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                {[
                  ["Mon", "🍳 Egg Paratha", "🍛 Chicken Curry"],
                  ["Tue", "🥣 Chana", "🍚 Daal Rice"],
                  ["Wed", "🍳 Omelette", "🍗 Chicken Pulao"],
                  ["Thu", "🥞 Paratha", "🥘 Aloo Keema"],
                  ["Fri", "🥣 Daal", "🍛 Chicken Karahi"],
                  ["Sat", "🍳 Eggs", "🍚 Biryani"],
                ].map(([day, lunch, dinner]) => (
                  <div
                    key={day}
                    className="min-w-0 rounded-2xl border border-zinc-100 p-4"
                  >

                    <div className="flex items-center justify-between">
                      <p className="font-bold">
                        {day}
                      </p>

                      <span className="text-xs text-zinc-400">
                        2 meals
                      </span>
                    </div>

                    <p className="mt-3 truncate text-sm text-zinc-600">
                      {lunch}
                    </p>

                    <p className="mt-2 truncate text-sm font-semibold text-zinc-800">
                      {dinner}
                    </p>

                  </div>
                ))}

              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-zinc-50 p-4">

                <div>
                  <p className="text-xs text-zinc-400">
                    Estimated weekly cost
                  </p>

                  <p className="mt-1 text-lg font-black">
                    Rs. 6,420
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-zinc-400">
                    Budget
                  </p>

                  <p className="mt-1 font-bold text-green-600">
                    Rs. 7,000
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================== */}

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-24 md:px-12"
      >

        <div className="mx-auto max-w-3xl text-center">

          <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
            Simple by design
          </p>

          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            From preferences to plate
          </h2>

        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">

          <article className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-lg font-black text-white">
              1
            </div>

            <div className="mt-6 text-4xl">
              📝
            </div>

            <h3 className="mt-4 text-xl font-bold">
              Tell us what you need
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Enter your budget, diet, goals, servings, pantry ingredients
              and food preferences.
            </p>

          </article>

          <article className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-lg font-black text-white">
              2
            </div>

            <div className="mt-6 text-4xl">
              🤖
            </div>

            <h3 className="mt-4 text-xl font-bold">
              AI builds your plan
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              LocalPlate AI combines your preferences into meals that fit
              your everyday needs.
            </p>

          </article>

          <article className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-lg font-black text-white">
              3
            </div>

            <div className="mt-6 text-4xl">
              🛒
            </div>

            <h3 className="mt-4 text-xl font-bold">
              Shop and cook
            </h3>

            <p className="mt-3 leading-7 text-zinc-600">
              Save your plan, organize your shopping list and start cooking.
            </p>

          </article>

        </div>

      </section>

      {/* =========================================================
          BENEFITS
      ========================================================== */}

      <section className="px-6 pb-24 md:px-12">

        <div className="mx-auto max-w-7xl rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-zinc-100 md:p-12">

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

            <div>

              <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
                Why LocalPlate AI
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Less food planning.
                <br />
                More actual living.
              </h2>

              <p className="mt-5 text-lg leading-8 text-zinc-600">
                A good meal plan should make your life easier — not give you
                another complicated task to manage.
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-orange-50 p-5">
                <p className="text-2xl">
                  ⚡
                </p>

                <p className="mt-3 font-bold">
                  Faster decisions
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Know what to cook before the question becomes a problem.
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-2xl">
                  💰
                </p>

                <p className="mt-3 font-bold">
                  Smarter spending
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Build plans around the budget you choose.
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-2xl">
                  🧺
                </p>

                <p className="mt-3 font-bold">
                  Less waste
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Reuse pantry ingredients across meals.
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 p-5">
                <p className="text-2xl">
                  ❤️
                </p>

                <p className="mt-3 font-bold">
                  More personal
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Plans based on your actual preferences.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          SEO
      ========================================================== */}

      <section
        className="mx-auto max-w-7xl px-6 pb-24 md:px-12"
        aria-labelledby="local-meal-planning-heading"
      >

        <div className="rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-sm md:p-12">

          <div className="grid gap-10 lg:grid-cols-2">

            <div>

              <p className="font-semibold uppercase tracking-[0.15em] text-orange-600">
                LOCAL + PERSONALIZED
              </p>

              <h2
                id="local-meal-planning-heading"
                className="mt-4 text-4xl font-black leading-tight"
              >
                AI meal planning built around your real life
              </h2>

            </div>

            <div>

              <p className="text-lg leading-8 text-zinc-600">
                Whether you need a Pakistani meal planner, a weekly meal
                plan, a budget-friendly food plan or ideas for ingredients
                already in your pantry, LocalPlate AI helps turn your
                preferences into a practical plan.
              </p>

              <p className="mt-5 text-lg leading-8 text-zinc-600">
                Choose your budget, diet, goals and food preferences, then
                let AI create meals that work for your everyday routine.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">

                <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold">
                  AI Meal Planner
                </span>

                <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold">
                  Pakistani Meal Planner
                </span>

                <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold">
                  Budget Meal Planner
                </span>

                <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold">
                  Weekly Meal Plan
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}

      <section
        id="about"
        className="px-6 pb-24 md:px-12"
      >

        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-orange-600 px-7 py-16 text-center text-white shadow-2xl shadow-orange-200 md:px-12 md:py-24">

          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/10" />

          <div className="relative">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-lg">
              🍽️
            </div>

            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Your next great meal
              <br />
              starts with a plan.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-orange-100">
              Tell LocalPlate AI what you like, what you can spend and what
              you already have. We&apos;ll help you plan the rest.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <a
                href="/planner"
                className="rounded-full bg-white px-8 py-4 font-black text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                Create My Meal Plan →
              </a>

              <a
                href="/weekly-plan"
                className="rounded-full border border-white/30 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
              >
                Plan My Week
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <footer className="border-t border-zinc-200 bg-white px-6 py-10 md:px-12">

        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-lg">
                🍽️
              </div>

              <div>
                <p className="font-black">
                  LocalPlate
                  <span className="text-orange-600">
                    {" "}AI
                  </span>
                </p>

                <p className="text-xs text-zinc-400">
                  Smart meal planning
                </p>
              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-zinc-500">

            <a
              href="/"
              className="transition hover:text-orange-600"
            >
              Home
            </a>

            <a
              href="/planner"
              className="transition hover:text-orange-600"
            >
              Planner
            </a>

            <a
              href="/weekly-plan"
              className="transition hover:text-orange-600"
            >
              Weekly Plan
            </a>

            <a
              href="/saved-plans"
              className="transition hover:text-orange-600"
            >
              Saved Plans
            </a>

            <a
              href="/shopping-list"
              className="transition hover:text-orange-600"
            >
              Shopping List
            </a>

          </div>

        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-zinc-100 pt-6 text-center text-sm text-zinc-400">

          <p>
            © 2026 LocalPlate AI. All rights reserved.
          </p>

          <p className="mt-2">
            AI meal planner for personalized, budget-friendly and local food
            planning.
          </p>

        </div>

      </footer>

    </main>
  );
}