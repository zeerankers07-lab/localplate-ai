import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "User Details",
  robots: {
    index: false,
    follow: false,
  },
};

type UserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCreatedAt(item: Record<string, unknown>) {
  const value = item.created_at;

  return typeof value === "string" ? value : null;
}

function getId(item: Record<string, unknown>) {
  const value = item.id;

  return value === undefined || value === null
    ? "unknown"
    : String(value);
}

export default async function AdminUserPage({
  params,
}: UserPageProps) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/planner");
  }

  const { id } = await params;

  const admin = createAdminClient();

  const userResult = await admin.auth.admin.getUserById(id);

  if (userResult.error || !userResult.data.user) {
    notFound();
  }

  const user = userResult.data.user;

  const [plansResult, shoppingResult] = await Promise.all([
    admin
      .from("saved_plans")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),

    admin
      .from("shopping_lists")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const plans = (plansResult.data || []) as Record<string, unknown>[];
  const shoppingLists = (shoppingResult.data ||
    []) as Record<string, unknown>[];

  const provider =
    user.app_metadata?.provider ||
    user.app_metadata?.providers?.[0] ||
    "email";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-xs font-bold tracking-[0.25em] text-blue-600">
            LOCALPLATE AI
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            User Details
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Complete account activity overview.
          </p>
        </div>

        {/* USER PROFILE */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold">
                  {user.email || "User"}
                </p>

                <p className="mt-1 break-all text-xs text-zinc-400">
                  {user.id}
                </p>
              </div>

              {user.email_confirmed_at ? (
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified Account
                </span>
              ) : (
                <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Email Not Verified
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Email" value={user.email || "—"} />

            <InfoCard label="Provider" value={String(provider)} />

            <InfoCard
              label="Created"
              value={formatDate(user.created_at)}
            />

            <InfoCard
              label="Last Sign In"
              value={formatDate(user.last_sign_in_at)}
            />

            <InfoCard
              label="Email Verified"
              value={user.email_confirmed_at ? "Yes" : "No"}
            />

            <InfoCard
              label="Phone"
              value={user.phone || "—"}
            />

            <InfoCard
              label="Phone Verified"
              value={user.phone_confirmed_at ? "Yes" : "No"}
            />

            <InfoCard
              label="User ID"
              value={user.id}
            />
          </div>
        </section>

        {/* ACTIVITY SUMMARY */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <SummaryCard
            title="Saved Plans"
            value={String(plans.length)}
            description="Plans saved by this user"
          />

          <SummaryCard
            title="Shopping Lists"
            value={String(shoppingLists.length)}
            description="Shopping lists created by this user"
          />
        </section>

        {/* PLANS */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  Saved Plans
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Plans associated with this account.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {plans.length} total
              </span>
            </div>
          </div>

          {plans.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {plans.map(function (plan) {
                const planId = getId(plan);

                return (
                  <div
                    key={planId}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">
                        Saved Plan #{planId}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Created: {formatDate(getCreatedAt(plan))}
                      </p>
                    </div>

                    <Link
                      href={
                        "/admin/users/" +
                        id +
                        "/plans/" +
                        planId
                      }
                      className="inline-flex w-fit rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      View Plan
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="This user has no saved plans." />
          )}
        </section>

        {/* SHOPPING LISTS */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  Shopping Lists
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Shopping list records associated with this account.
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {shoppingLists.length} total
              </span>
            </div>
          </div>

          {shoppingLists.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {shoppingLists.map(function (list) {
                const listId = getId(list);

                return (
                  <div
                    key={listId}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">
                        Shopping List #{listId}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Created: {formatDate(getCreatedAt(list))}
                      </p>
                    </div>

                    <Link
                      href={
                        "/admin/users/" +
                        id +
                        "/shopping-lists/" +
                        listId
                      }
                      className="inline-flex w-fit rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      View List
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="This user has no shopping lists." />
          )}
        </section>

        {/* SECURITY */}
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">
            Privacy & Security
          </h3>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            This administration interface does not display passwords,
            authentication secrets, access tokens or other sensitive
            credentials.
          </p>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-semibold text-zinc-800">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}