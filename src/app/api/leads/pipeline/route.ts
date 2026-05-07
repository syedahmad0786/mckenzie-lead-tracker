import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const clientId = process.env.ACTIVE_CLIENT_ID || "mckenzie";
  const url = new URL(req.url);
  const camps = url.searchParams.getAll("campaign");
  const stats = url.searchParams.getAll("status");
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const clientPromise = sb.from("clients").select("*").eq("id", clientId).maybeSingle();
  const kpiPromise = sb.from("v_kpi_scoreboard").select("*").eq("client_id", clientId).maybeSingle();

  let qb = sb.from("v_lead_with_client").select("*").eq("client_id", clientId).order("date_introduced", { ascending: false });
  if (camps.length) qb = qb.in("campaign_id", camps);
  if (stats.length) qb = qb.in("status", stats);
  if (from) qb = qb.gte("date_introduced", from);
  if (to)   qb = qb.lte("date_introduced", to);

  const [{ data: client }, { data: rows }, { data: kpiRow }] = await Promise.all([clientPromise, qb, kpiPromise]);

  let leads = rows ?? [];
  if (q) {
    leads = leads.filter((l: { email: string; contact_name: string | null }) =>
      l.email.toLowerCase().includes(q) || (l.contact_name ?? "").toLowerCase().includes(q)
    );
  }

  const payoutVisible = !!client?.payout_visible;

  type Row = {
    id: string; airtable_id: string | null; email: string; contact_name: string | null;
    campaign_id: string | null; campaign_name: string | null;
    date_introduced: string; status: "not_yet_closed" | "order_placed" | "lost";
    date_first_order: string | null; first_order_amount: number | null;
    notes: string | null; payout_amount: number;
  };

  return NextResponse.json({
    clientId,
    clientName: client?.name ?? "McKenzie SewOn",
    logoUrl: client?.logo_url ?? null,
    accentColor: client?.accent_color ?? "#00a7e0",
    totalLeads: leads.length,
    payoutVisible,
    leads: (leads as Row[]).map((l) => ({
      id: l.id,
      airtableId: l.airtable_id,
      contactName: l.contact_name ?? "",
      email: l.email,
      campaignId: l.campaign_id,
      campaignName: l.campaign_name ?? "Uncategorized",
      dateIntroduced: l.date_introduced,
      status: l.status,
      dateFirstOrder: l.date_first_order,
      firstOrderAmount: l.first_order_amount,
      notes: l.notes,
      payoutAmount: Number(l.payout_amount ?? 0),
      payoutVisible,
    })),
    kpis: {
      leadsSent:        kpiRow?.leads_sent ?? 0,
      ordersClosed:     kpiRow?.orders_closed ?? 0,
      revenueGenerated: Number(kpiRow?.revenue_generated ?? 0),
      payoutOwed:       Number(kpiRow?.payout_owed ?? 0),
    },
  });
}
