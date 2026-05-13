import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * Invite a colleague by email. Agency-admin / AOC-admin only.
 *
 * Uses Supabase Auth's admin.inviteUserByEmail under the hood, which:
 *   1) creates a user row in auth.users (if not already present)
 *   2) fires the public.handle_new_user trigger → creates a profile with
 *      a role derived from the email domain (agency_admin for @modern-amenities.com,
 *      client_member for everyone else), pinned to client_id='mckenzie'
 *   3) sends an invitation email with a magic link that lands on /auth/callback
 *      and signs them in. They set their password via the reset-password flow.
 *
 * The caller can OVERRIDE the auto-assigned role by passing a role in the body,
 * which we apply to profiles AFTER the trigger runs. This is the only way to
 * grant a non-MA-email user agency_admin (e.g. a contractor with a gmail address).
 */
const schema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1).max(120).optional(),
  role: z.enum(["agency_admin", "client_member", "aoc_admin"]).optional(),
  client_id: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sba = supabaseAdmin();
  const { data: caller } = await sba
    .from("profiles")
    .select("role,client_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!caller || !["agency_admin", "aoc_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "forbidden — agency_admin only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { email, display_name, role, client_id } = parsed.data;

  // Where the user lands after clicking the invite email.
  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/auth/callback`;

  const { data: inviteResult, error: inviteErr } = await sba.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { display_name: display_name ?? email.split("@")[0] },
  });

  if (inviteErr) {
    // Most common failure: the email is already in use. Don't fail loudly —
    // it's still useful to upgrade their role / client_id, and to log the attempt.
    if (!/already.*registered|exists/i.test(inviteErr.message)) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }
  }

  // If caller explicitly set role or client_id, apply them now (the trigger has
  // already created a default profile, but we may want to override).
  if (role || client_id) {
    const patch: Record<string, unknown> = {};
    if (role) patch.role = role;
    if (client_id) patch.client_id = client_id;
    if (display_name) patch.display_name = display_name;

    // Resolve user id by email (either freshly created or pre-existing)
    const targetUserId = inviteResult?.user?.id;
    if (targetUserId) {
      await sba.from("profiles").update(patch).eq("user_id", targetUserId);
    } else {
      // Fallback: lookup by email
      await sba.from("profiles").update(patch).eq("email", email.toLowerCase());
    }
  }

  await logActivity(req, {
    action: "invite.sent",
    target_type: "user",
    target_id: inviteResult?.user?.id ?? email,
    metadata: {
      email,
      role: role ?? "(auto)",
      client_id: client_id ?? caller.client_id ?? "mckenzie",
      preexisting: !!inviteErr,
    },
  });

  return NextResponse.json({
    ok: true,
    preexisting: !!inviteErr,
    email,
    user_id: inviteResult?.user?.id ?? null,
  });
}
