import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("Admin check:", {
    userId: user.id,
    profile,
    profileError,
  });
  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">
        LocalPlate AI Admin
      </h1>

      <p className="mt-2 text-gray-600">
        Welcome to the admin dashboard.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Users</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Meal Plans</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Weekly Plans</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">AI Requests</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>
      </div>
    </main>
  );
}