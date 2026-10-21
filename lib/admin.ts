import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Returns the signed-in user only if they are an admin.
 *
 * This uses the SAME rules as proxy.ts (the /admin page guard), so anyone
 * who can open the admin panel can also use the admin APIs:
 *   1. email listed in ADMIN_EMAILS
 *   2. Supabase Auth app_metadata.role === "admin"
 *   3. profiles.role === "admin"
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email?.trim().toLowerCase();

  if (email && configuredAdminEmails().has(email)) return user;

  if (user.app_metadata?.role === "admin") return user;

  try {
    // Service-role read, so it works even if profile RLS hides the role.
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Could not check admin profile role:", error.message);
      return null;
    }

    if (profile?.role === "admin") return user;
  } catch (error) {
    console.error("Could not check admin profile role:", error);
  }

  return null;
}