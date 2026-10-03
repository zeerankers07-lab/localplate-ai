import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/planner");

  const admin = createAdminClient();

  const [usersResult, plansResult, shoppingResult] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("saved_plans").select("id", { count: "exact", head: true }),
    admin.from("shopping_lists").select("user_id", { count: "exact", head: true }),
  ]);

  const users = (usersResult.data?.users || [])
    .slice()
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  const totalUsers = usersResult.data?.users?.length ?? 0;
  const totalPlans = plansResult.count ?? 0;
  const totalShoppingLists = shoppingResult.count ?? 0;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-blue-700">LOCALPLATE AI</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-500">Private operations overview. Only configured admins can access this page.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
            {adminUser.email}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric title="Users shown" value={String(totalUsers)} note="First 100 users returned by Supabase Admin API" />
          <Metric title="Saved plans" value={String(totalPlans)} note="All rows protected by RLS for normal users" />
          <Metric title="Shopping lists" value={String(totalShoppingLists)} note="Owner-scoped records" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold">Recent users</h2>
            <p className="mt-1 text-xs text-zinc-500">Read-only overview. User passwords and secrets are never displayed.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Verified</th>
                  <th className="px-5 py-3">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3 font-medium">{user.email || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3 text-zinc-600">{user.email_confirmed_at ? "Yes" : "No"}</td>
                    <td className="px-5 py-3 text-zinc-600">{user.app_metadata?.provider || "email"}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-400">{note}</p>
    </div>
  );
}
