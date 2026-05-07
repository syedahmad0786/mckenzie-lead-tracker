import { NextResponse } from "next/server";

/** Phase 1: Supabase deferred. Returns 410 to signal the route is intentionally gone. */
export async function POST() {
  return NextResponse.json(
    { error: "Phase 1 is Airtable-only. See /phase-2-supabase/README.md to enable Supabase sync." },
    { status: 410 },
  );
}
