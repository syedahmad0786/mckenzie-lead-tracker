/**
 * Phase 1 types — Airtable is the source of truth.
 * Phase 2 (Supabase) types are restored when the migration lands.
 */

export type LeadStatus = "not_yet_closed" | "order_placed" | "lost";
export type UserRole = "agency_admin" | "client_member" | "aoc_admin";

// =========================================================================
// Airtable record shapes (the raw shape Airtable returns)
// =========================================================================
export interface AirtableLeadRecord {
  id: string;
  fields: {
    Email?: string;
    "Contact Name"?: string;
    Company?: string;
    Phone?: string;
    Campaign?: string;
    "Date Introduced"?: string;
    Status?: LeadStatus;
    "Date First Order"?: string;
    "First Order Amount"?: number;
    Notes?: string;
    "Instantly Campaign ID"?: string;
    "Typeform Response ID"?: string;
  };
}

export interface AirtableClientRecord {
  id: string;
  fields: {
    "Client ID"?: string;          // 'mckenzie'
    "Client Name"?: string;
    "Logo URL"?: string;
    "Accent Color"?: string;
    "Payout % First"?: number;     // 0.15
    "Payout % Subsequent"?: number; // 0
    "Payout Visible"?: boolean;
  };
}

export interface AirtableCampaignRecord {
  id: string;
  fields: {
    "Campaign ID"?: string;        // 'tourist-gift-shop'
    "Client ID"?: string;
    "Campaign Name"?: string;
    Color?: string;
    Archived?: boolean;
  };
}

export interface AirtableAuditRecord {
  id?: string;
  fields: {
    "Lead Airtable ID": string;
    "Field Changed": string;
    "Old Value"?: string | null;
    "New Value"?: string | null;
    "User Email"?: string | null;
    "User Role"?: UserRole | null;
    "Changed At"?: string;          // ISO timestamp
  };
}

// =========================================================================
// UI-facing shapes
// =========================================================================
export interface DesignLead {
  id: string;                       // Airtable record ID
  contactName: string;
  email: string;
  campaignId: string | null;        // slug
  campaignName: string;
  dateIntroduced: string;
  status: LeadStatus;
  dateFirstOrder: string | null;
  firstOrderAmount: number | null;
  notes: string | null;
  payoutAmount: number;             // computed in adapter — hidden in v1
  payoutVisible: boolean;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  at: string;
  kind: "introduced" | "status_change" | "order_placed" | "notes_edited" | "lost";
  label: string;
  meta?: Record<string, unknown>;
}

export interface ScoreboardKpis {
  leadsSent: number;
  ordersClosed: number;
  revenueGenerated: number;
  payoutOwed: number;
}
