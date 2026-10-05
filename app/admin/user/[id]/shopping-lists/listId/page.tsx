import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Shopping List Details",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    id: string;
    listId: string;
  }>;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

export default async function AdminShoppingListPage({
  params,
}: PageProps) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/planner");
  }

  const { id, listId } = await params;

  const admin = createAdminClient();

  const { data: shoppingList, error } = await admin
    .from("shopping_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", id)
    .maybeSingle();

  if (error || !shoppingList) {
    notFound();
  }

  const entries = Object.entries(
    shoppingList as Record<string, unknown>
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-2">
          <Link
            href={"/admin/users/" + id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            ← Back to User
          </Link>

          <Link
            href="/admin"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold tracking-[0.25em] text-emerald-600">
            LOCALPLATE AI
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Shopping List Details
          </h1>

          <p className="mt-2 break-all text-sm text-zinc-500">
            List ID: {listId}
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5">
            <h2 className="font-bold">
              Shopping List Data
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Complete stored record for this shopping list.
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {entries.map(function ([key, value]) {
              const isLarge =
                typeof value === "object" ||
                String(value).length > 150;

              return (
                <div
                  key={key}
                  className="grid gap-2 px-6 py-5 sm:grid-cols-[180px_1fr]"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {key.replaceAll("_", " ")}
                  </p>

                  {isLarge ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-xs leading-6 text-zinc-700">
                      {formatValue(value)}
                    </pre>
                  ) : (
                    <p className="break-words text-sm font-medium text-zinc-800">
                      {formatValue(value)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            Read-only administrator view
          </p>

          <p className="mt-1 text-sm leading-6 text-emerald-800">
            This page displays the stored shopping list record without
            exposing authentication credentials or allowing direct
            modification.
          </p>
        </section>
      </div>
    </main>
  );
}