/**
 * DEPRECATED in Phase 1 (Airtable-only). Re-export shim for safety —
 * if anything still imports from this file it gets a runtime error
 * that points at the Phase 2 migration.
 */

export function fullResync(): never {
  throw new Error(
    "fullResync() called in Phase 1 — Airtable is the source of truth, no sync needed. " +
    "See phase-2-supabase/README.md to enable Supabase sync.",
  );
}
export function syncOneByAirtableId(): never {
  throw new Error("syncOneByAirtableId() called in Phase 1 — Airtable-only. See phase-2-supabase/README.md.");
}
