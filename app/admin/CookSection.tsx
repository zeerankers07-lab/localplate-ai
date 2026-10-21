"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type CookUser = {
  userId: string;
  email: string | null;
  name: string | null;
  updatedAt: string | null;
  recipeCount: number;
  mealCount: number;
  recipeTitles: string[];
};

type CookRecipe = {
  id: string;
  title: string;
  markdown: string;
  savedAt: number;
};

type CookMeal = {
  id: string;
  day: string;
  slot: string;
  title: string;
  markdown: string;
  symbol: string;
};

type CookDetail = {
  savedRecipes: CookRecipe[];
  mealPlan: CookMeal[];
  updatedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function CookSection() {
  const [items, setItems] = useState<CookUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchTimer = useRef<number | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CookDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), q: query });
      const response = await fetch(`/api/admin/cook?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not load What Can I Cook data.");
      }

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalUsers(data.totalUsers ?? 0);
      setPageSize(data.pageSize ?? 10);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load What Can I Cook data."
      );
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, []);

  function onSearchChange(value: string) {
    setSearch(value);

    if (searchTimer.current) window.clearTimeout(searchTimer.current);

    searchTimer.current = window.setTimeout(() => {
      setPage(1);
      setQuery(value.trim());
    }, 400);
  }

  async function toggle(userId: string) {
    if (openId === userId) {
      setOpenId(null);
      return;
    }

    setOpenId(userId);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await fetch(
        `/api/admin/cook?user_id=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not load details.");
      }

      setDetail(data as CookDetail);
    } catch (detailLoadError) {
      setDetailError(
        detailLoadError instanceof Error
          ? detailLoadError.message
          : "Could not load details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section
      id="cook"
      className="lp-fade-up mt-8 scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-[#0f121b]/80 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-violet-500 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />

            <div>
              <h2 className="text-xl font-semibold text-white">
                What Can I Cook
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Saved recipes and meal plans users built on the Cook page.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2">
            Users with Cook data{" "}
            <span className="ms-1 font-semibold text-white">{totalUsers}</span>
          </span>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by user name or email"
          aria-label="Search cook data"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/60"
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-400">
            No What Can I Cook data found.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const isOpen = openId === item.userId;

              return (
                <li
                  key={item.userId}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {item.name || item.email || "Unknown user"}
                    </span>

                    {item.name && item.email && (
                      <span className="text-xs text-slate-500">
                        {item.email}
                      </span>
                    )}

                    <span className="ms-auto text-xs text-slate-500">
                      Updated {formatDate(item.updatedAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-amber-400/10 px-2 py-1 font-medium text-amber-200">
                      {item.recipeCount} saved recipes
                    </span>
                    <span className="rounded-md bg-violet-400/10 px-2 py-1 font-medium text-violet-200">
                      {item.mealCount} planned meals
                    </span>
                  </div>

                  {item.recipeTitles.length > 0 && (
                    <p className="mt-3 text-sm text-slate-400">
                      {item.recipeTitles.join(" · ")}
                      {item.recipeCount > item.recipeTitles.length && " · …"}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => toggle(item.userId)}
                    aria-expanded={isOpen}
                    className="mt-4 h-9 rounded-lg border border-white/10 px-3 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    {isOpen ? "Hide details" : "View details"}
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                      {detailLoading && (
                        <div className="h-16 animate-pulse rounded-xl bg-white/5" />
                      )}

                      {detailError && (
                        <p className="text-sm text-red-300">{detailError}</p>
                      )}

                      {detail && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              Meal plan
                            </h3>

                            {detail.mealPlan.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-500">
                                No planned meals.
                              </p>
                            ) : (
                              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                                {detail.mealPlan.map((meal) => (
                                  <li
                                    key={meal.id}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                  >
                                    <span className="text-xs capitalize text-slate-500">
                                      {meal.day} · {meal.slot}
                                    </span>
                                    <div>
                                      {meal.symbol} {meal.title}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              Saved recipes
                            </h3>

                            {detail.savedRecipes.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-500">
                                No saved recipes.
                              </p>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {detail.savedRecipes.map((recipe) => (
                                  <details
                                    key={recipe.id}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                  >
                                    <summary className="cursor-pointer text-sm font-medium text-slate-200">
                                      {recipe.title}
                                    </summary>

                                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-white">
                                      <ReactMarkdown>
                                        {recipe.markdown}
                                      </ReactMarkdown>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {total > pageSize && (
          <div className="flex items-center justify-between pt-2 text-sm text-slate-400">
            <span>
              Page {page} of {totalPages} · {total} users
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || loading}
                className="h-9 rounded-lg border border-white/10 px-3 text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={page >= totalPages || loading}
                className="h-9 rounded-lg border border-white/10 px-3 text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}