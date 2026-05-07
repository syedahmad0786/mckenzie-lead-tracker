import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditEntries, fetchLead, updateLead } from "@/lib/airtable";

export const runtime = "nodejs";

const schema = z.object({
  airtableId: z.string().min(1),
  status: z.enum(["not_yet_closed", "order_placed", "lost"]).optional(),
  dateFirstOrder: z.string().nullable().optional(),
  firstOrderAmount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  userEmail: z.string().email().optional(),
  userRole: z.enum(["agency_admin", "client_member", "aoc_admin"]).optional(),
});

/**
 * Inline-edit endpoint. Writes Airtable + appends audit entries.
 * Fires the n8n status-change webhook for downstream Slack notifications.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { airtableId, status, dateFirstOrder, firstOrderAmount, notes, userEmail, userRole } = parsed.data;

  const before = await fetchLead(airtableId);
  if (!before) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  // Validate: order_placed requires both date and amount > 0
  const finalStatus = status ?? before.fields.Status;
  const finalDate = dateFirstOrder !== undefined ? dateFirstOrder : before.fields["Date First Order"];
  const finalAmount = firstOrderAmount !== undefined ? firstOrderAmount : before.fields["First Order Amount"];
  if (finalStatus === "order_placed" && (!finalDate || !finalAmount || finalAmount <= 0)) {
    return NextResponse.json({ error: "order_placed requires a date and amount > 0" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (status !== undefined)            patch.Status = status;
  if (dateFirstOrder !== undefined)    patch["Date First Order"] = dateFirstOrder;
  if (firstOrderAmount !== undefined)  patch["First Order Amount"] = firstOrderAmount;
  if (notes !== undefined)             patch.Notes = notes;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "no changes" }, { status: 400 });

  await updateLead(airtableId, patch);

  // Build audit entries
  const audits: Array<{
    "Lead Airtable ID": string;
    "Field Changed": string;
    "Old Value"?: string | null;
    "New Value"?: string | null;
    "User Email"?: string | null;
    "User Role"?: "agency_admin" | "client_member" | "aoc_admin" | null;
    "Changed At": string;
  }> = [];
  const now = new Date().toISOString();

  if (status !== undefined && status !== before.fields.Status) {
    audits.push(buildAudit(airtableId, "Status", before.fields.Status, status, userEmail, userRole, now));
  }
  if (dateFirstOrder !== undefined && dateFirstOrder !== before.fields["Date First Order"]) {
    audits.push(buildAudit(airtableId, "Date First Order", before.fields["Date First Order"], dateFirstOrder, userEmail, userRole, now));
  }
  if (firstOrderAmount !== undefined && firstOrderAmount !== before.fields["First Order Amount"]) {
    audits.push(buildAudit(airtableId, "First Order Amount", before.fields["First Order Amount"], firstOrderAmount, userEmail, userRole, now));
  }
  if (notes !== undefined && notes !== before.fields.Notes) {
    audits.push(buildAudit(airtableId, "Notes", before.fields.Notes, notes, userEmail, userRole, now));
  }
  if (audits.length) await appendAuditEntries(audits);

  // Fire-and-forget n8n notification (status-change workflow)
  if (process.env.N8N_STATUS_CHANGE_WEBHOOK && status !== undefined && status !== before.fields.Status) {
    fetch(process.env.N8N_STATUS_CHANGE_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        airtableId,
        email: before.fields.Email,
        contactName: before.fields["Contact Name"],
        campaign: before.fields.Campaign,
        oldStatus: before.fields.Status,
        newStatus: status,
        firstOrderAmount: finalAmount,
        userEmail,
      }),
    }).catch(() => { /* don't block the user save on Slack hiccups */ });
  }

  return NextResponse.json({ success: true, auditsAppended: audits.length });
}

function buildAudit(
  leadId: string,
  field: string,
  oldV: unknown,
  newV: unknown,
  userEmail: string | undefined,
  userRole: "agency_admin" | "client_member" | "aoc_admin" | undefined,
  at: string,
) {
  return {
    "Lead Airtable ID": leadId,
    "Field Changed": field,
    "Old Value": oldV == null ? null : String(oldV),
    "New Value": newV == null ? null : String(newV),
    "User Email": userEmail ?? null,
    "User Role": userRole ?? null,
    "Changed At": at,
  };
}
