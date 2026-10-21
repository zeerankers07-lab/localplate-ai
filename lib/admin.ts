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

function isAdminRole(role: unknown) {
  return typeof role === "string" && role.trim().toLowerCase() === "admin";
}

/**
 * Returns the signed-in user only if they are an admin.
 *
 * Uses the SAME rules as proxy.ts (the /admin page guard), so anyone who can
 * open the admin panel can also use the admin APIs:
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

  if (isAdminRole(user.app_metadata?.role)) return user;

  // 3a. Read the role with the user's own session (exactly what proxy.ts does).
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Admin check (user session) failed:", error.message);
    } else if (isAdminRole(profile?.role)) {
      return user;
    }
  } catch (error) {
    console.error("Admin check (user session) failed:", error);
  }

  // 3b. Fallback: read the role with the service-role key (ignores RLS).
  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Admin check (service role) failed:", error.message);
    } else if (isAdminRole(profile?.role)) {
      return user;
    }
  } catch (error) {
    console.error("Admin check (service role) failed:", error);
  }

  return null;
}