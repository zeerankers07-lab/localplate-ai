"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FeedbackItem = {
  id: string;
  type: "feature" | "problem" | "other";
  message: string;
  email: string | null;
  page: string | null;
  language: string | null;
  currency: string | null;
  status: "new" | "planned" | "done" | "rejected";
  created_at: string;
  user_id: string | null;
};

type Counts = Record<string, number>;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "planned", label: "Planned" },
  { id: "done", label: "Done" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  planned: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const TYPE_LABELS: Record<string, { label: string; style: string }> = {
  feature: {
    label: "Feature request",
    style: "bg-amber-400/10 text-amber-200",
  },
  problem: { label: "Problem", style: "bg-red-400/10 text-red-200" },
  other: { label: "Other", style: "bg-slate-400/10 text-slate-300" },
};

function formatDate(value: string) {
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

export default function FeedbackSection() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        status,
        type,
        q: query,
      });

      const response = await fetch(`/api/admin/feedback?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not load feedback.");
      }

      setItems(data.items ?? []);
      setCounts(data.counts ?? {});
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 20);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, type, query]);

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

  async function changeStatus(id: string, next: string) {
    setBusyId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Update failed.");

      await load();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Update failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this message permanently?")) return;

    setBusyId(id);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/feedback?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Delete failed.");

      await load();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allCount = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <section
      id="feedback"
      className="lp-fade-up mt-8 scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-[#0f121b]/80 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-violet-500 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />

            <div>
              <h2 className="text-xl font-semibold text-white">Feedback</h2>
              <p className="mt-1 text-sm text-slate-400">
                Feature requests and problems sent by users.
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
          {STATUS_FILTERS.map((item) => {
            const active = status === item.id;
            const count = item.id === "all" ? allCount : counts[item.id] ?? 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStatus(item.id);
                  setPage(1);
                }}
                aria-pressed={active}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
                  active
                    ? "border-violet-400/50 bg-violet-500/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
                <span className="text-xs text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search message or email"
            aria-label="Search feedback"
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/60"
          />

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            aria-label="Type"
            className="h-11 rounded-xl border border-white/10 bg-[#0f121b] px-3 text-sm text-slate-200 outline-none focus:border-violet-400/60"
          >
            <option value="all">All types</option>
            <option value="feature">Feature request</option>
            <option value="problem">Problem</option>
            <option value="other">Other</option>
          </select>
        </div>

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
                className="h-24 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-400">
            No feedback found.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const kind = TYPE_LABELS[item.type] ?? TYPE_LABELS.other;

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${kind.style}`}
                    >
                      {kind.label}
                    </span>

                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                        STATUS_STYLES[item.status] ?? STATUS_STYLES.new
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="ms-auto text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                    {item.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{item.email || "Anonymous"}</span>
                    {item.page && <span>Page: {item.page}</span>}
                    {item.language && <span>Language: {item.language}</span>}
                    {item.currency && <span>Currency: {item.currency}</span>}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`status-${item.id}`}>
                      Status
                    </label>

                    <select
                      id={`status-${item.id}`}
                      value={item.status}
                      disabled={busyId === item.id}
                      onChange={(event) =>
                        changeStatus(item.id, event.target.value)
                      }
                      className="h-9 rounded-lg border border-white/10 bg-[#0f121b] px-3 text-sm text-slate-200 outline-none focus:border-violet-400/60 disabled:opacity-60"
                    >
                      <option value="new">New</option>
                      <option value="planned">Planned</option>
                      <option value="done">Done</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={busyId === item.id}
                      className="h-9 rounded-lg border border-red-500/30 px-3 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {total > pageSize && (
          <div className="flex items-center justify-between pt-2 text-sm text-slate-400">
            <span>
              Page {page} of {totalPages} · {total} messages
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