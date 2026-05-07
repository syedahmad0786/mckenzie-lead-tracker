import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).optional(),
  logo_url: z.string().url().nullable().optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  payout_pct_first: z.number().min(0).max(1).optional(),
  payout_visible: z.boolean().optional(),
});

/** Update client config — agency_admin or aoc_admin only. */
export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sba = supabaseAdmin();
  const { data: profile } = await sba.from("profiles").select("role,client_id").eq("user_id", user.id).maybeSingle();
  if (!profile || !["agency_admin", "aoc_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "forbidden — agency_admin only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });

  const clientId = profile.client_id ?? "mckenzie";
  const { error } = await sba.from("clients").update(parsed.data).eq("id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
