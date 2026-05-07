import { NextResponse } from "next/server";

/** Phase 1: Supabase deferred. Per-lead sync is unnecessary when Airtable is the source of truth. */
export async function POST() {
  return NextResponse.json(
    { error: "Phase 1 is Airtable-only. Per-lead sync not needed. See /phase-2-supabase/README.md." },
    { status: 410 },
  );
}
