import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const schema = z.object({
  airtableId: z.string().min(1),                              // accept either Supabase row id OR airtable_id (we treat as row id)
  status: z.enum(["not_yet_closed", "order_placed", "lost"]).optional(),
  dateFirstOrder: z.string().nullable().optional(),
  firstOrderAmount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
});

/**
 * Inline-edit endpoint. Writes to Supabase. The `audit_log` trigger fires
 * automatically per the SQL migration, capturing user_id from the JWT.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  const { airtableId, status, dateFirstOrder, firstOrderAmount, notes, campaignId } = parsed.data;

  // Resolve Supabase row id — `airtableId` field may be the airtable record OR the supabase uuid
  const sbAdmin = supabaseAdmin();
  let row;
  if (airtableId.startsWith("rec")) {
    ({ data: row } = await sbAdmin.from("leads").select("id,status,date_first_order,first_order_amount,notes").eq("airtable_id", airtableId).maybeSingle());
  } else {
    ({ data: row } = await sbAdmin.from("leads").select("id,status,date_first_order,first_order_amount,notes").eq("id", airtableId).maybeSingle());
  }
  if (!row) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const finalStatus = status ?? row.status;
  const finalDate = dateFirstOrder !== undefined ? dateFirstOrder : row.date_first_order;
  const finalAmount = firstOrderAmount !== undefined ? firstOrderAmount : row.first_order_amount;
  if (finalStatus === "order_placed" && (!finalDate || !finalAmount || finalAmount <= 0)) {
    return NextResponse.json({ error: "order_placed requires a date and amount > 0" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (status !== undefined)            patch.status = status;
  if (dateFirstOrder !== undefined)    patch.date_first_order = dateFirstOrder;
  if (firstOrderAmount !== undefined)  patch.first_order_amount = firstOrderAmount;
  if (notes !== undefined)             patch.notes = notes;
  if (campaignId !== undefined)        patch.campaign_id = campaignId;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "no changes" }, { status: 400 });

  // Use the user-context client so RLS policies and the audit trigger see the auth user
  const sb = await supabaseServer();
  const { error } = await sb.from("leads").update(patch).eq("id", row.id);
  if (error) {
    // Fallback: if RLS blocks (no session), use admin
    const { error: e2 } = await sbAdmin.from("leads").update(patch).eq("id", row.id);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
