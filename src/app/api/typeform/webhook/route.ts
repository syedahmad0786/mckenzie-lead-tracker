import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { upsertLeadByEmail } from "@/lib/airtable";

export const runtime = "nodejs";

/**
 * Typeform webhook receiver. Fires when a lead completes the McKenzie handoff form.
 * Make.com's existing scenarios continue to send the prospect summary email to Chris;
 * this endpoint additionally writes the lead into Airtable.
 *
 *   POST /api/typeform/webhook
 *   Headers: typeform-signature: sha256=<hmac>
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("typeform-signature") || "";
  if (!verifyTypeformSig(body, signature, process.env.TYPEFORM_WEBHOOK_SECRET || "")) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: TypeformPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const answers = payload.form_response?.answers ?? [];
  const email = pickField(answers, "email")?.toLowerCase();
  if (!email) return NextResponse.json({ error: "no email in submission" }, { status: 400 });

  const fields = {
    Email: email,
    "Contact Name": pickField(answers, "name") ?? null,
    Company: pickField(answers, "company") ?? null,
    Phone: pickField(answers, "phone") ?? null,
    "Date Introduced": new Date().toISOString().slice(0, 10),
    Status: "not_yet_closed" as const,
    "Typeform Response ID": payload.form_response?.token ?? null,
    "Instantly Campaign ID": pickHidden(payload, "campaign_id") ?? null,
    Campaign: pickHidden(payload, "campaign_name") ?? null,
  };

  await upsertLeadByEmail(email, fields);
  return NextResponse.json({ success: true });
}

function verifyTypeformSig(body: string, header: string, secret: string): boolean {
  if (!secret) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

interface TypeformAnswer {
  field?: { ref?: string };
  type: string;
  email?: string;
  text?: string;
  phone_number?: string;
  number?: number;
  choice?: { label?: string };
}
interface TypeformPayload {
  form_response?: {
    token?: string;
    answers?: TypeformAnswer[];
    hidden?: Record<string, string>;
  };
}

function pickField(answers: TypeformAnswer[], hint: string): string | null {
  const a = answers.find((x) => (x.field?.ref ?? "").toLowerCase().includes(hint));
  if (!a) return null;
  return a.email ?? a.text ?? a.phone_number ?? a.choice?.label ?? null;
}
function pickHidden(p: TypeformPayload, key: string): string | null {
  return p.form_response?.hidden?.[key] ?? null;
}
