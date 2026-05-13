/**
 * Activity log helper.
 *
 * Use this from any API route to write a row into the general-purpose
 * activity_log table introduced in supabase/005_activity_log.sql. It's
 * separate from `audit_log`, which is reserved for lead-level field
 * changes (status, amount, notes) written by a Postgres trigger.
 *
 * activity_log captures everything else: re-syncs, sign-outs, invites,
 * lead views, settings reads, etc.
 *
 * All writes are best-effort and never throw — a logging failure must
 * never break the user-facing operation it's meant to record.
 */
import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export type ActivityAction =
  | "auth.signin"
  | "auth.signout"
  | "auth.signup"
  | "sync.run"
  | "sync.cron"
  | "lead.view"
  | "lead.update"
  | "lead.export_csv"
  | "settings.update"
  | "invite.sent"
  | "user.delete"
  | "user.role_change";

export interface ActivityRecord {
  action: ActivityAction | string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity row with the current authenticated user attached.
 *
 * Pass `req` so we can capture IP + user-agent. If there's no session
 * (e.g. a cron-secret invocation), we'll still log the action but
 * with a null user_id and the action stamped as the system role.
 */
export async function logActivity(req: NextRequest | null, rec: ActivityRecord): Promise<void> {
  try {
    const sba = supabaseAdmin();

    let userId: string | null = null;
    let userEmail: string | null = null;
    let userRole: string | null = null;
    let clientId: string | null = null;

    try {
      const sb = await supabaseServer();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
        const { data: profile } = await sba
          .from("profiles")
          .select("role, client_id")
          .eq("user_id", user.id)
          .maybeSingle();
        userRole = profile?.role ?? null;
        clientId = profile?.client_id ?? null;
      }
    } catch {
      // Server context isn't available (e.g. called from a webhook).
      // We still log the action, just without user attribution.
    }

    const ip = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req?.headers.get("x-real-ip")
      || null;
    const ua = req?.headers.get("user-agent") || null;

    await sba.from("activity_log").insert({
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      client_id: clientId,
      action: rec.action,
      target_type: rec.target_type ?? null,
      target_id: rec.target_id ?? null,
      metadata: rec.metadata ?? {},
      ip,
      user_agent: ua,
    });
  } catch (err) {
    // Best-effort. Never throw.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[activity] log failed:", err);
    }
  }
}

/**
 * Variant for "system" actions that have no associated request context —
 * e.g. a cron call whose authorization was a shared secret rather than a JWT.
 */
export async function logSystemActivity(
  rec: ActivityRecord & { actor?: string },
): Promise<void> {
  try {
    const sba = supabaseAdmin();
    await sba.from("activity_log").insert({
      user_id: null,
      user_email: rec.actor ?? "system",
      user_role: "system",
      client_id: null,
      action: rec.action,
      target_type: rec.target_type ?? null,
      target_id: rec.target_id ?? null,
      metadata: rec.metadata ?? {},
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[activity] system log failed:", err);
    }
  }
}
