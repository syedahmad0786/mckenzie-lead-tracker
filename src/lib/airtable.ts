/**
 * Airtable client — Phase 1 source of truth.
 * Tables: Leads, Campaigns, Clients, Audit Log
 *
 * All queries paginate; all writes are idempotent on email (Lujan
 * confirmed: no duplicates within or across campaigns).
 */

import Airtable, { FieldSet, Record as AirtableRecord } from "airtable";
import {
  AirtableLeadRecord,
  AirtableClientRecord,
  AirtableCampaignRecord,
  AirtableAuditRecord,
  LeadStatus,
} from "./types";

// Table names live in the shared "Onboarding Dashboards" base
// (appcAs8YL3V7BcerG) alongside other Modern Amenities tracking tables,
// hence the "Lead Tracker — " prefix to keep namespaces clean.
export const TABLES = {
  Leads:    "Lead Tracker — Leads",
  Campaigns:"Lead Tracker — Campaigns",
  Clients:  "Lead Tracker — Clients",
  AuditLog: "Lead Tracker — Audit Log",
} as const;

let _base: Airtable.Base | null = null;
function base() {
  if (_base) return _base;
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) throw new Error("AIRTABLE_PAT or AIRTABLE_BASE_ID missing");
  _base = new Airtable({ apiKey: pat }).base(baseId);
  return _base;
}

const escape = (s: string) => s.replace(/'/g, "\\'");

// =========================================================================
// Leads
// =========================================================================
export async function fetchAllLeads(filters?: {
  campaignIds?: string[];
  statuses?: LeadStatus[];
  fromDate?: string;
  toDate?: string;
}): Promise<AirtableLeadRecord[]> {
  const out: AirtableLeadRecord[] = [];
  const formula = buildLeadFilter(filters);
  await base()(TABLES.Leads)
    .select({
      pageSize: 100,
      sort: [{ field: "Date Introduced", direction: "desc" }],
      ...(formula ? { filterByFormula: formula } : {}),
    })
    .eachPage((records: ReadonlyArray<AirtableRecord<FieldSet>>, next: () => void) => {
      for (const r of records) out.push({ id: r.id, fields: r.fields as AirtableLeadRecord["fields"] });
      next();
    });
  return out;
}

function buildLeadFilter(f?: { campaignIds?: string[]; statuses?: LeadStatus[]; fromDate?: string; toDate?: string }): string | null {
  if (!f) return null;
  const parts: string[] = [];
  if (f.campaignIds?.length) {
    parts.push(`OR(${f.campaignIds.map((c) => `{Campaign} = '${escape(c)}'`).join(",")})`);
  }
  if (f.statuses?.length) {
    parts.push(`OR(${f.statuses.map((s) => `{Status} = '${s}'`).join(",")})`);
  }
  if (f.fromDate) parts.push(`IS_AFTER({Date Introduced}, '${escape(f.fromDate)}')`);
  if (f.toDate)   parts.push(`IS_BEFORE({Date Introduced}, '${escape(f.toDate)}')`);
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0] : `AND(${parts.join(",")})`;
}

export async function fetchLead(airtableId: string): Promise<AirtableLeadRecord | null> {
  try {
    const r = await base()(TABLES.Leads).find(airtableId);
    return { id: r.id, fields: r.fields as AirtableLeadRecord["fields"] };
  } catch {
    return null;
  }
}

export async function updateLead(
  airtableId: string,
  fields: Partial<AirtableLeadRecord["fields"]>,
): Promise<AirtableLeadRecord> {
  const r = await base()(TABLES.Leads).update(airtableId, fields);
  return { id: r.id, fields: r.fields as AirtableLeadRecord["fields"] };
}

export async function upsertLeadByEmail(
  email: string,
  fields: Partial<AirtableLeadRecord["fields"]>,
): Promise<{ record: AirtableLeadRecord; created: boolean }> {
  const safeEmail = email.toLowerCase();
  const existing = await base()(TABLES.Leads)
    .select({ filterByFormula: `LOWER({Email}) = '${escape(safeEmail)}'`, maxRecords: 1 })
    .firstPage();
  if (existing.length > 0) {
    const r = await base()(TABLES.Leads).update(existing[0].id, fields);
    return { record: { id: r.id, fields: r.fields as AirtableLeadRecord["fields"] }, created: false };
  }
  const created = await base()(TABLES.Leads).create({ Email: safeEmail, ...fields });
  return { record: { id: created.id, fields: created.fields as AirtableLeadRecord["fields"] }, created: true };
}

// =========================================================================
// Campaigns + Clients
// =========================================================================
export async function fetchCampaigns(clientId: string): Promise<AirtableCampaignRecord[]> {
  const records = await base()(TABLES.Campaigns)
    .select({
      filterByFormula: `AND({Client ID} = '${escape(clientId)}', NOT({Archived}))`,
      pageSize: 100,
    })
    .all();
  return records.map((r) => ({ id: r.id, fields: r.fields as AirtableCampaignRecord["fields"] }));
}

export async function fetchClient(clientId: string): Promise<AirtableClientRecord | null> {
  const records = await base()(TABLES.Clients)
    .select({ filterByFormula: `{Client ID} = '${escape(clientId)}'`, maxRecords: 1 })
    .firstPage();
  if (!records.length) return null;
  return { id: records[0].id, fields: records[0].fields as AirtableClientRecord["fields"] };
}

// =========================================================================
// Audit log
// =========================================================================
export async function appendAuditEntries(entries: AirtableAuditRecord["fields"][]): Promise<void> {
  if (!entries.length) return;
  // Airtable batch creates max 10 at a time
  for (let i = 0; i < entries.length; i += 10) {
    const chunk = entries.slice(i, i + 10).map((fields) => ({ fields }));
    await base()(TABLES.AuditLog).create(chunk);
  }
}

export async function fetchAuditFor(leadAirtableId: string): Promise<AirtableAuditRecord[]> {
  const records = await base()(TABLES.AuditLog)
    .select({
      filterByFormula: `{Lead Airtable ID} = '${escape(leadAirtableId)}'`,
      sort: [{ field: "Changed At", direction: "asc" }],
    })
    .all();
  return records.map((r) => ({ id: r.id, fields: r.fields as AirtableAuditRecord["fields"] }));
}
