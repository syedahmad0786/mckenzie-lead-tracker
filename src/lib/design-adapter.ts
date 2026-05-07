/**
 * Maps NormalizedLead + audit history → DesignLead (UI shape).
 * Phase 1: pure function, no Supabase. Phase 2: same interface, different source.
 */

import { AirtableAuditRecord, DesignLead, LeadStatus, ScoreboardKpis, TimelineEvent } from "./types";
import type { NormalizedLead } from "./pipeline";

export function adaptLead(
  lead: NormalizedLead,
  campaignName: string,
  payoutVisible: boolean,
  audit: AirtableAuditRecord[] = [],
): DesignLead {
  return {
    id: lead.airtableId,
    contactName: lead.contactName ?? "—",
    email: lead.email,
    campaignId: lead.campaignId,
    campaignName,
    dateIntroduced: lead.dateIntroduced,
    status: lead.status,
    dateFirstOrder: lead.dateFirstOrder,
    firstOrderAmount: lead.firstOrderAmount,
    notes: lead.notes,
    payoutAmount: lead.payoutAmount,
    payoutVisible,
    timeline: buildTimeline(lead, campaignName, audit),
  };
}

function buildTimeline(lead: NormalizedLead, campaignName: string, audit: AirtableAuditRecord[]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { at: lead.dateIntroduced, kind: "introduced", label: `Introduced via ${campaignName}` },
  ];

  for (const a of audit) {
    const f = a.fields;
    const at = f["Changed At"] ?? new Date().toISOString();
    const by = f["User Email"] ?? null;

    if (f["Field Changed"] === "Status") {
      if (f["New Value"] === "order_placed") {
        events.push({
          at,
          kind: "order_placed",
          label: lead.firstOrderAmount
            ? `Order placed — ${formatUSD(lead.firstOrderAmount)}`
            : "Order placed",
          // intentional: snapshot notes-at-that-moment per Ryan's review (#4)
          meta: { snapshot_notes: lead.notes ?? null, by },
        });
      } else if (f["New Value"] === "lost") {
        events.push({ at, kind: "lost", label: "Marked Lost", meta: { by } });
      } else {
        events.push({
          at,
          kind: "status_change",
          label: `Status → ${prettyStatus(f["New Value"] as LeadStatus)}`,
          meta: { by },
        });
      }
    } else if (f["Field Changed"] === "Notes") {
      events.push({ at, kind: "notes_edited", label: "Notes edited", meta: { by } });
    }
  }
  return events;
}

export function adaptKpis(k: { leadsSent: number; ordersClosed: number; revenueGenerated: number; payoutOwed: number }): ScoreboardKpis {
  return {
    leadsSent: k.leadsSent ?? 0,
    ordersClosed: k.ordersClosed ?? 0,
    revenueGenerated: Number(k.revenueGenerated ?? 0),
    payoutOwed: Number(k.payoutOwed ?? 0),
  };
}

export function prettyStatus(s: LeadStatus): string {
  switch (s) {
    case "order_placed":   return "Order Placed";
    case "not_yet_closed": return "Not Yet Closed";
    case "lost":           return "Lost";
  }
}

export function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
