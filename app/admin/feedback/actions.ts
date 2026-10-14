"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["new", "planned", "done"] as const;

export async function updateFeedbackStatus(formData: FormData) {
  // Server actions are public endpoints, so check admin access again here.
  const adminUser = await getAdminUser();

  if (!adminUser) {
    throw new Error("Not allowed.");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !(STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid request.");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("feedback")
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Could not update feedback status:", error.message);
    throw new Error("Could not update feedback.");
  }

  revalidatePath("/admin/feedback");
}