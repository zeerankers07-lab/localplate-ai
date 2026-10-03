import { createClient } from "@/lib/supabase/server";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email?.trim().toLowerCase();
  const isAdmin = Boolean(
    email && configuredAdminEmails().has(email)
  );
  return isAdmin ? user : null;
}
