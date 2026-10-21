import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sameOrigin } from "@/lib/security";

const STATUSES = ["new", "planned", "done", "rejected"] as const;
const TYPES = ["feature", "problem", "other"] as const;
const PAGE_SIZE = 20;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Status = (typeof STATUSES)[number];

// Short error text for the admin (these routes are admin-only).
function errorDetail(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}

function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status);
}

// Removes characters that have a meaning inside a PostgREST filter.
function cleanSearch(value: string) {
  return value.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
}

async function logAction(
  adminId: string,
  action: string,
  entityId: string,
  details: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();

    await admin.from("admin_audit_logs").insert({
      admin_id: adminId,
      action,
      entity_type: "feedback",
      entity_id: entityId,
      details,
    });
  } catch (error) {
    console.error("Could not write the audit log:", error);
  }
}

// List feedback (with filters and paging) and the count per status.
export async function GET(req: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const status = url.searchParams.get("status") || "all";
    const type = url.searchParams.get("type") || "all";
    const search = cleanSearch(url.searchParams.get("q") || "");

    const admin = createAdminClient();
    const from = (page - 1) * PAGE_SIZE;

    let query = admin
      .from("feedback")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (isStatus(status)) query = query.eq("status", status);
    if (TYPES.includes(type as (typeof TYPES)[number])) {
      query = query.eq("type", type);
    }
    if (search) {
      query = query.or(`message.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const counts: Record<string, number> = {};

    await Promise.all(
      STATUSES.map(async (item) => {
        const { count: total } = await admin
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("status", item);

        counts[item] = total ?? 0;
      })
    );

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      pageSize: PAGE_SIZE,
      counts,
    });
  } catch (error) {
    console.error("Admin feedback list error:", error);

    return NextResponse.json(
      { error: `Could not load feedback. (${errorDetail(error)})` },
      { status: 500 }
    );
  }
}

// Change the status of one message.
export async function PATCH(req: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser || !sameOrigin(req)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { id?: unknown; status?: unknown };

    if (typeof body.id !== "string" || !UUID.test(body.id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    if (!isStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("feedback")
      .update({ status: body.status })
      .eq("id", body.id);

    if (error) throw error;

    await logAction(adminUser.id, "feedback_status_updated", body.id, {
      status: body.status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin feedback update error:", error);

    return NextResponse.json(
      { error: "Could not update feedback." },
      { status: 500 }
    );
  }
}

// Delete one message.
export async function DELETE(req: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser || !sameOrigin(req)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const id = new URL(req.url).searchParams.get("id") || "";

    if (!UUID.test(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin.from("feedback").delete().eq("id", id);

    if (error) throw error;

    await logAction(adminUser.id, "feedback_deleted", id, {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin feedback delete error:", error);

    return NextResponse.json(
      { error: "Could not delete feedback." },
      { status: 500 }
    );
  }
}