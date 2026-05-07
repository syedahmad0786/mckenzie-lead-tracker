/**
 * DEPRECATED in Phase 1 (May 7, 2026).
 *
 * Phase 1 architecture is Airtable-only. Importing from this file will
 * throw — keeping the file present so any stale import surfaces loudly
 * rather than silently failing.
 *
 * When migrating to Supabase, restore this file from the git history
 * and follow phase-2-supabase/README.md.
 */

export function supabaseServer(): never {
  throw new Error(
    "supabaseServer() called in Phase 1 — this app is Airtable-only. " +
    "See phase-2-supabase/README.md to enable Supabase.",
  );
}

export function supabasePublic(): never {
  throw new Error(
    "supabasePublic() called in Phase 1 — this app is Airtable-only.",
  );
}
