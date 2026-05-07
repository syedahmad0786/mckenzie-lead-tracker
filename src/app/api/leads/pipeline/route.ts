import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = "not_yet_closed" | "order_placed" | "lost";

interface LeadRow {
  id: string;
  airtable_id: string | null;
  email: string;
  contact_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  date_introduced: string;          // ISO date
  status: Status;
  date_first_order: string | null;
  first_order_amount: number | null;
  notes: string | null;
  payout_amount: number;
}

export async function GET(req: NextRequest) {
  // Resolve the user's tenant from their profile; agency_admin without a client_id sees ACTIVE_CLIENT_ID
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sba = supabaseAdmin();
  const { data: profile } = await sba.from("profiles").select("role,client_id").eq("user_id", user.id).maybeSingle();
  const clientId = profile?.client_id || process.env.ACTIVE_CLIENT_ID || "mckenzie";

  const url = new URL(req.url);
  const camps = url.searchParams.getAll("campaign");
  const stats = url.searchParams.getAll("status");
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  // Pull all leads for this client (admin client to avoid view-RLS weirdness)
  let qb = sba.from("v_lead_with_client").select("*").eq("client_id", clientId).order("date_introduced", { ascending: false });
  if (camps.length) qb = qb.in("campaign_id", camps);
  if (stats.length) qb = qb.in("status", stats);
  if (from) qb = qb.gte("date_introduced", from);
  if (to)   qb = qb.lte("date_introduced", to);
  const { data: rows = [] } = await qb;

  let leads = (rows as LeadRow[] | null) ?? [];
  if (q) {
    leads = leads.filter((l) =>
      l.email.toLowerCase().includes(q) || (l.contact_name ?? "").toLowerCase().includes(q)
    );
  }

  // Compute KPIs across the full client tenant (NOT filtered) so the scoreboard is stable
  const { data: allRows } = await sba.from("v_lead_with_client").select("*").eq("client_id", clientId);
  const all = (allRows as LeadRow[] | null) ?? [];

  const today = new Date(); today.setHours(0,0,0,0);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const ago = (n: number) => { const x = new Date(today); x.setDate(today.getDate() - n); return x; };

  const last30 = all.filter((l) => l.date_introduced >= day(ago(30)));
  const prev30 = all.filter((l) => l.date_introduced >= day(ago(60)) && l.date_introduced < day(ago(30)));
  const closedNow  = last30.filter((l) => l.status === "order_placed");
  const closedPrev = prev30.filter((l) => l.status === "order_placed");
  const revenueNow  = closedNow.reduce((s, l) => s + (l.first_order_amount ?? 0), 0);
  const revenuePrev = closedPrev.reduce((s, l) => s + (l.first_order_amount ?? 0), 0);
  const payoutNow  = last30.reduce((s, l) => s + (l.payout_amount ?? 0), 0);
  const payoutPrev = prev30.reduce((s, l) => s + (l.payout_amount ?? 0), 0);

  const pct = (now: number, prev: number) =>
    prev === 0 ? (now === 0 ? 0 : 100) : Math.round(((now - prev) / prev) * 100);

  // Sparklines: last-30-day daily counts/amounts
  const buckets = (windowDays: number, accessor: (l: LeadRow) => number) => {
    const out: number[] = [];
    for (let d = windowDays - 1; d >= 0; d--) {
      const day_iso = day(ago(d));
      const sum = all
        .filter((l) => l.date_introduced === day_iso)
        .reduce((s, l) => s + accessor(l), 0);
      out.push(sum);
    }
    return out;
  };
  const sparkLeadsSent     = buckets(30, () => 1);
  const sparkOrdersClosed  = buckets(30, (l) => (l.status === "order_placed" ? 1 : 0));
  const sparkRevenue       = buckets(30, (l) => (l.status === "order_placed" ? (l.first_order_amount ?? 0) : 0));
  const sparkPayout        = buckets(30, (l) => l.payout_amount ?? 0);

  const { data: client } = await sba.from("clients").select("*").eq("id", clientId).maybeSingle();
  const payoutVisible = !!client?.payout_visible;

  return NextResponse.json({
    clientId,
    clientName: client?.name ?? "McKenzie SewOn",
    logoUrl: client?.logo_url ?? null,
    accentColor: client?.accent_color ?? "#00a7e0",
    totalLeads: leads.length,
    payoutVisible,
    role: profile?.role ?? "client_member",
    leads: leads.map((l) => ({
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
      leadsSent:        all.length,
      ordersClosed:     all.filter((l) => l.status === "order_placed").length,
      revenueGenerated: all.filter((l) => l.status === "order_placed").reduce((s, l) => s + (l.first_order_amount ?? 0), 0),
      payoutOwed:       all.reduce((s, l) => s + (l.payout_amount ?? 0), 0),
    },
    deltas: {
      leadsSent:        pct(last30.length, prev30.length),
      ordersClosed:     pct(closedNow.length, closedPrev.length),
      revenueGenerated: pct(revenueNow, revenuePrev),
      payoutOwed:       pct(payoutNow, payoutPrev),
    },
    sparks: {
      leadsSent:        sparkLeadsSent,
      ordersClosed:     sparkOrdersClosed,
      revenueGenerated: sparkRevenue,
      payoutOwed:       sparkPayout,
    },
  });
}
