import { NextRequest, NextResponse } from "next/server";
import { fetchAllLeads, fetchCampaigns, fetchClient } from "@/lib/airtable";
import { classifyLead, computeKpis } from "@/lib/pipeline";
import { adaptKpis, adaptLead } from "@/lib/design-adapter";
import { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/leads/pipeline?campaign=...&status=...&from=...&to=...&q=... */
export async function GET(req: NextRequest) {
  const clientId = process.env.ACTIVE_CLIENT_ID || "mckenzie";
  const url = new URL(req.url);
  const campaignFilter = url.searchParams.getAll("campaign");
  const statusFilter = url.searchParams.getAll("status") as LeadStatus[];
  const search = (url.searchParams.get("q") || "").trim().toLowerCase();
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  // Pull config + campaigns + leads in parallel
  const [client, campaigns, allLeads] = await Promise.all([
    fetchClient(clientId),
    fetchCampaigns(clientId),
    fetchAllLeads({ campaignIds: campaignFilter.length ? campaignFilter : undefined, statuses: statusFilter.length ? statusFilter : undefined, fromDate: from, toDate: to }),
  ]);

  const knownCampaigns = campaigns.map((c) => ({
    id: c.fields["Campaign ID"] ?? "",
    name: c.fields["Campaign Name"] ?? "",
  }));
  const campaignNameById: Record<string, string> = Object.fromEntries(knownCampaigns.map((k) => [k.id, k.name]));

  const payoutVisible = client?.fields["Payout Visible"] ?? false;
  const payoutPctFirst = client?.fields["Payout % First"] ?? 0.15;

  let normalized = allLeads.map((r) => classifyLead(r, knownCampaigns, payoutPctFirst));
  if (search) {
    normalized = normalized.filter(
      (l) =>
        l.email.toLowerCase().includes(search) ||
        (l.contactName ?? "").toLowerCase().includes(search),
    );
  }

  const leads = normalized.map((l) => adaptLead(
    l,
    l.campaignId ? campaignNameById[l.campaignId] ?? l.campaignNameRaw ?? "Uncategorized" : "Uncategorized",
    payoutVisible,
    [], // audit history is fetched lazily in the drawer to avoid N+1 here
  ));

  // KPIs are total-tenant counts (NOT filtered) so the scoreboard is stable.
  const totalLeads = await fetchAllLeads();
  const totalNormalized = totalLeads.map((r) => classifyLead(r, knownCampaigns, payoutPctFirst));
  const kpis = computeKpis(totalNormalized);

  return NextResponse.json({
    clientId,
    clientName: client?.fields["Client Name"] ?? "Unknown",
    logoUrl: client?.fields["Logo URL"] ?? null,
    accentColor: client?.fields["Accent Color"] ?? "#00a7e0",
    totalLeads: totalLeads.length,
    leads,
    kpis: adaptKpis(kpis),
    payoutVisible,
  });
}
