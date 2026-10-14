import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin";
import { updateFeedbackStatus } from "./actions";

export const metadata: Metadata = {
  title: "Feedback",
  robots: { index: false, follow: false },
};

// Always read fresh data.
export const dynamic = "force-dynamic";

const STATUSES = ["new", "planned", "done"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  planned: "Planned",
  done: "Done",
};

const TYPE_LABEL: Record<string, string> = {
  feature: "Feature request",
  problem: "Problem",
  other: "Other",
};

const PAGE_SIZE = 50;

type FeedbackRow = {
  id: string;
  type: string | null;
  message: string | null;
  email: string | null;
  page: string | null;
  language: string | null;
  currency: string | null;
  status: Status | null;
  created_at: string | null;
};

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/planner");
  }

  const params = await searchParams;

  const filter: Status | "all" = (STATUSES as readonly string[]).includes(
    params.status ?? ""
  )
    ? (params.status as Status)
    : "all";

  const pageNumber = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (pageNumber - 1) * PAGE_SIZE;

  const admin = createAdminClient();

  let query = admin
    .from("feedback")
    .select(
      "id, type, message, email, page, language, currency, status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const [listResult, ...countResults] = await Promise.all([
    query,
    ...STATUSES.map((status) =>
      admin
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
    ),
  ]);

  const rows = (listResult.data ?? []) as FeedbackRow[];
  const total = listResult.count ?? 0;
  const loadError = listResult.error?.message;

  const counts: Record<Status, number> = {
    new: countResults[0].count ?? 0,
    planned: countResults[1].count ?? 0,
    done: countResults[2].count ?? 0,
  };
  const allCount = counts.new + counts.planned + counts.done;

  const tabs: { key: Status | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: allCount },
    ...STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABEL[status],
      count: counts[status],
    })),
  ];

  const hasPrev = pageNumber > 1;
  const hasNext = from + rows.length < total;

  const linkFor = (nextFilter: string, nextPage = 1) => {
    const search = new URLSearchParams();

    if (nextFilter !== "all") search.set("status", nextFilter);
    if (nextPage > 1) search.set("page", String(nextPage));

    const text = search.toString();
    return text ? `/admin/feedback?${text}` : "/admin/feedback";
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Admin
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Feedback
        </h1>

        <nav
          aria-label="Filter by status"
          className="mt-5 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={linkFor(tab.key)}
              aria-current={filter === tab.key ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === tab.key
                  ? "bg-orange-600 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {tab.label}{" "}
              <span className="opacity-70">{tab.count}</span>
            </Link>
          ))}
        </nav>

        {loadError && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load feedback: {loadError}. Did you run
            002_feedback_status.sql in Supabase?
          </p>
        )}

        {!loadError && rows.length === 0 && (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-100">
            No feedback here yet.
          </p>
        )}

        <ul className="mt-5 space-y-3">
          {rows.map((row) => {
            const status: Status = row.status ?? "new";

            return (
              <li
                key={row.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700">
                    {TYPE_LABEL[row.type ?? ""] ?? row.type ?? "Other"}
                  </span>
                  <span>{formatDate(row.created_at)}</span>
                  {row.page && <span>{row.page}</span>}
                  {row.language && (
                    <span>
                      {row.language.toUpperCase()}
                      {row.currency ? ` · ${row.currency}` : ""}
                    </span>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-800">
                  {row.message}
                </p>

                {row.email && (
                  <p className="mt-2 text-sm">
                    <a
                      href={`mailto:${row.email}`}
                      className="text-orange-700 underline"
                    >
                      {row.email}
                    </a>
                  </p>
                )}

                <form
                  action={updateFeedbackStatus}
                  className="mt-4 inline-flex rounded-xl bg-zinc-100 p-1"
                >
                  <input type="hidden" name="id" value={row.id} />

                  {STATUSES.map((option) => (
                    <button
                      key={option}
                      type="submit"
                      name="status"
                      value={option}
                      aria-pressed={status === option}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        status === option
                          ? "bg-white text-orange-700 shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {STATUS_LABEL[option]}
                    </button>
                  ))}
                </form>
              </li>
            );
          })}
        </ul>

        {(hasPrev || hasNext) && (
          <div className="mt-6 flex items-center justify-between text-sm">
            {hasPrev ? (
              <Link
                href={linkFor(filter, pageNumber - 1)}
                className="font-semibold text-orange-700 hover:text-orange-800"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}

            {hasNext && (
              <Link
                href={linkFor(filter, pageNumber + 1)}
                className="font-semibold text-orange-700 hover:text-orange-800"
              >
                Older →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}