import { NextRequest, NextResponse } from "next/server";
import { upsertLeadByEmail } from "@/lib/airtable";

export const runtime = "nodejs";

/**
 * Instantly webhook receiver. Fires on positive-reply tag.
 * Pre-creates the lead as "not_yet_closed" so it appears on the dashboard
 * before Typeform completion (per Lujan's existing flow: positive reply
 * triggers the subsequence that sends the Typeform link).
 */
export async function POST(req: NextRequest) {
  const headerKey = req.headers.get("x-instantly-secret") || "";
  if (headerKey !== (process.env.INSTANTLY_WEBHOOK_SECRET || "")) {
    return NextResponse.json({ error: "invalid secret" }, { status: 401 });
  }

  let body: InstantlyPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = (body.lead_email || body.email || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "no email" }, { status: 400 });

  await upsertLeadByEmail(email, {
    Email: email,
    "Contact Name": body.first_name && body.last_name ? `${body.first_name} ${body.last_name}` : (body.first_name || undefined),
    Company: body.company_name ?? undefined,
    "Date Introduced": new Date().toISOString().slice(0, 10),
    Status: "not_yet_closed",
    "Instantly Campaign ID": body.campaign_id ?? undefined,
    Campaign: body.campaign_name ?? undefined,
  });

  return NextResponse.json({ success: true });
}

interface InstantlyPayload {
  event_type?: string;
  lead_email?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  campaign_id?: string;
  campaign_name?: string;
}
