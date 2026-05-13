import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * GET   /api/admin/users           List all users + their role + last activity.
 *                                  Agency-admin only. Reads v_user_last_activity.
 * PATCH /api/admin/users           Update a user's role or client_id.
 *                                  Body: { user_id, role?, client_id? }
 * DELETE /api/admin/users?id=…     Delete a user (revokes access).
 *                                  This signs them out + removes their auth row.
 */

async function requireAdmin(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "unauthorized" };

  const sba = supabaseAdmin();
  const { data: caller } = await sba
    .from("profiles")
    .select("role,client_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!caller || !["agency_admin", "aoc_admin"].includes(caller.role)) {
    return { ok: false as const, status: 403, error: "forbidden — agency_admin only" };
  }
  return { ok: true as const, caller, callerUserId: user.id };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const sba = supabaseAdmin();
  const { data, error } = await sba
    .from("v_user_last_activity")
    .select("*")
    .order("profile_created_at", { ascending: false });
  if (error) {
    // The view may not exist if 005 migration hasn't been run yet — fall back to profiles.
    const { data: profiles } = await sba
      .from("profiles")
      .select("user_id,email,display_name,role,client_id,created_at")
      .order("created_at", { ascending: false });
    return NextResponse.json({
      users: profiles ?? [],
      degraded: true,
      message: "v_user_last_activity not found — run supabase/005_activity_log.sql",
    });
  }
  return NextResponse.json({ users: data ?? [] });
}

const patchSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["agency_admin", "client_member", "aoc_admin"]).optional(),
  client_id: z.string().min(1).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { user_id, role, client_id } = parsed.data;

  // Don't let an admin demote themselves accidentally.
  if (user_id === gate.callerUserId && role && role !== "agency_admin" && role !== "aoc_admin") {
    return NextResponse.json({ error: "you cannot change your own admin role" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (role !== undefined) patch.role = role;
  if (client_id !== undefined) patch.client_id = client_id;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no changes" }, { status: 400 });
  }

  const sba = supabaseAdmin();
  const { error } = await sba.from("profiles").update(patch).eq("user_id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(req, {
    action: "user.role_change",
    target_type: "user",
    target_id: user_id,
    metadata: patch,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  if (id === gate.callerUserId) {
    return NextResponse.json({ error: "you cannot delete your own account" }, { status: 400 });
  }

  const sba = supabaseAdmin();
  const { error } = await sba.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(req, {
    action: "user.delete",
    target_type: "user",
    target_id: id,
  });

  return NextResponse.json({ ok: true });
}
