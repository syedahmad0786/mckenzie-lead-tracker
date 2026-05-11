import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SHEET_ID = "1VV44N1sURf5RJEZGo49l-VEtGBDi8LlNQWli65GlItU";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1`;

/**
 * Sheets → Supabase poll.
 * Auth: EITHER `x-cron-secret` header (for GH Actions cron),
 *       OR an authenticated agency_admin/aoc_admin user session (for the dashboard button).
 */
async function authorize(req: NextRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret && secret === process.env.CRON_SECRET) return { ok: true };

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "unauthorized" };

  const sba = supabaseAdmin();
  const { data: profile } = await sba.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (!profile || !["agency_admin", "aoc_admin"].includes(profile.role)) {
    return { ok: false, status: 403, error: "forbidden — agency_admin only" };
  }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const t0 = Date.now();

  // 1) Fetch sheet CSV
  const sheetRes = await fetch(SHEET_URL, { cache: "no-store" });
  if (!sheetRes.ok) return NextResponse.json({ error: `sheet fetch ${sheetRes.status}` }, { status: 502 });
  const csv = await sheetRes.text();

  // 2) Parse CSV (handles quotes, commas-in-quotes, doubled-quote escape)
  const lines = csv.split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return NextResponse.json({ ok: true, parsed: 0, inserted: 0 });
  const parseLine = (l: string): string[] => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (inQ && l[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
      } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur); return out;
  };
  const headers = parseLine(lines[0]);
  const seen = new Set<string>();
  const sheetLeads: Array<{
    email: string;
    contact_name: string | null;
    company: string | null;
    date_introduced: string;
    form_submitted: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const row = Object.fromEntries(headers.map((h, j) => [h, (cols[j] || "").trim()]));
    const email = (row.Email || "").toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const name = [row["First Name"], row["Last Name"]].filter(Boolean).join(" ") || null;
    const date = (row["Form Sent At"] || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    sheetLeads.push({
      email, contact_name: name,
      company: row.Company || null,
      date_introduced: date,
      form_submitted: row["Form Submitted"] || "No",
    });
  }

  // 3) Diff against Supabase
  const sb = supabaseAdmin();
  const { data: existingRows } = await sb.from("leads").select("email").eq("client_id", "mckenzie");
  const existing = new Set((existingRows ?? []).map((r) => (r.email || "").toLowerCase()));
  const fresh = sheetLeads.filter((l) => !existing.has(l.email));

  if (fresh.length === 0) {
    return NextResponse.json({
      ok: true, parsed: sheetLeads.length, existing: existing.size, inserted: 0, durationMs: Date.now() - t0,
    });
  }

  // 4) Insert
  const rows = fresh.map((l) => ({
    client_id: "mckenzie",
    campaign_id: "construction",
    email: l.email,
    contact_name: l.contact_name,
    company: l.company,
    date_introduced: l.date_introduced,
    status: "not_yet_closed" as const,
    notes: `Auto-imported from Sheets. Form Submitted: ${l.form_submitted}.`,
  }));
  const { error } = await sb.from("leads").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    parsed: sheetLeads.length,
    existing: existing.size,
    inserted: rows.length,
    sampleEmail: rows[0].email,
    durationMs: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
