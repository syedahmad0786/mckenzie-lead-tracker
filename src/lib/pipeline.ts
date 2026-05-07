/**
 * Lead classifier (Phase 1 — Airtable only).
 *
 * Converts a raw Airtable lead record into the normalized shape the UI
 * uses, applying the same invariants the onboarding-dashboard classifier
 * applies. When Phase 2 lands (Supabase mirror), this same logic runs at
 * sync time instead of read time.
 *
 * INVARIANTS:
 *   1) Default status is `not_yet_closed`.
 *   2) `order_placed` requires BOTH `Date First Order` AND `First Order Amount` > 0.
 *      If either is missing, downgrade to `not_yet_closed` and warn.
 *   3) `lost` is terminal — payout is 0 and order fields are ignored.
 *   4) Email is the unique key (lowercase). Confirmed by Lujan: no dupes.
 *   5) Campaign is resolved from the Airtable string by slug-matching against
 *      the campaigns table; unknown campaigns fall back to null + warning.
 *   6) Payout = 15% × First Order Amount, but ONLY when status = order_placed.
 *      Hidden in the UI per Ryan + Kody for v1.
 */

import { AirtableLeadRecord, LeadStatus } from "./types";

const VALID_STATUSES: LeadStatus[] = ["not_yet_closed", "order_placed", "lost"];

export interface NormalizedLead {
  airtableId: string;
  email: string;
  contactName: string | null;
  company: string | null;
  phone: string | null;
  campaignId: string | null;
  campaignNameRaw: string | null;
  dateIntroduced: string;           // ISO date
  status: LeadStatus;
  dateFirstOrder: string | null;
  firstOrderAmount: number | null;
  notes: string | null;
  payoutAmount: number;             // computed
  warnings: string[];
}

export interface KnownCampaign { id: string; name: string }

export function classifyLead(
  record: AirtableLeadRecord,
  knownCampaigns: KnownCampaign[],
  payoutPctFirst = 0.15,
): NormalizedLead {
  const f = record.fields;
  const warnings: string[] = [];

  const email = (f.Email ?? "").trim().toLowerCase();
  if (!email) warnings.push(`record ${record.id}: missing Email`);

  const campaignRaw = (f.Campaign ?? "").trim() || null;
  let campaignId: string | null = null;
  if (campaignRaw) {
    const slug = slugify(campaignRaw);
    const match = knownCampaigns.find((c) => c.id === slug || c.name === campaignRaw);
    campaignId = match?.id ?? null;
    if (!campaignId) warnings.push(`record ${record.id}: unknown campaign "${campaignRaw}"`);
  }

  const rawStatus = (f.Status as LeadStatus | undefined) ?? "not_yet_closed";
  let status: LeadStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : "not_yet_closed";

  let dateFirstOrder = f["Date First Order"] ?? null;
  let firstOrderAmount = typeof f["First Order Amount"] === "number" ? f["First Order Amount"] : null;

  if (status === "order_placed" && (!dateFirstOrder || !firstOrderAmount || firstOrderAmount <= 0)) {
    warnings.push(`record ${record.id}: order_placed missing date/amount → downgraded`);
    status = "not_yet_closed";
  }
  if (status === "lost") {
    dateFirstOrder = null;
    firstOrderAmount = null;
  }

  const payoutAmount =
    status === "order_placed" && firstOrderAmount
      ? Math.round(firstOrderAmount * payoutPctFirst * 100) / 100
      : 0;

  return {
    airtableId: record.id,
    email,
    contactName: f["Contact Name"] ?? null,
    company: f.Company ?? null,
    phone: f.Phone ?? null,
    campaignId,
    campaignNameRaw: campaignRaw,
    dateIntroduced: f["Date Introduced"] ?? new Date().toISOString().slice(0, 10),
    status,
    dateFirstOrder,
    firstOrderAmount,
    notes: f.Notes ?? null,
    payoutAmount,
    warnings,
  };
}

export function computeKpis(leads: NormalizedLead[]) {
  let revenue = 0;
  let payout = 0;
  let placed = 0;
  for (const l of leads) {
    if (l.status === "order_placed") {
      placed += 1;
      revenue += l.firstOrderAmount ?? 0;
      payout += l.payoutAmount;
    }
  }
  return {
    leadsSent: leads.length,
    ordersClosed: placed,
    revenueGenerated: revenue,
    payoutOwed: payout,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
