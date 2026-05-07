import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const sba = supabaseAdmin();
  // Resolve lead by either supabase id or airtable_id
  let leadId = id;
  if (id.startsWith("rec")) {
    const { data: row } = await sba.from("leads").select("id").eq("airtable_id", id).maybeSingle();
    if (!row) return NextResponse.json({ entries: [] });
    leadId = row.id;
  }
  const { data } = await sba.from("audit_log").select("*").eq("lead_id", leadId).order("changed_at", { ascending: true });
  return NextResponse.json({ entries: data ?? [] });
}
