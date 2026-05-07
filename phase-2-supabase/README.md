# Phase 2 — Supabase migration (deferred per Ahmad on May 7, 2026)

This folder holds the Supabase schema for when we're ready to add the
SQL mirror layer. **Phase 1 ships on Airtable only** to keep the moving
parts down. Revisit when one of the triggers below fires.

## Triggers to migrate

- Lead volume passes ~5k records (Airtable filter performance starts to wobble)
- McKenzie + ≥1 other AOC client live (cross-tenant analytics gets painful in Airtable)
- Plugging into the Wild Ducks AIMS L4 performance tracker (CM-15)
- Custom queries / KPI views the dashboard outgrows

## Files

- `001_init.sql` — idempotent Supabase schema (clients, campaigns, leads, audit_log, sync_runs, KPI views). Apply via Supabase SQL editor.

## What needs to change in the app to migrate

1. Add `@supabase/supabase-js` back to `package.json`
2. Restore `src/lib/supabase.ts` (server + public clients)
3. Restore `src/lib/airtable-to-supabase.ts` sync engine
4. Restore `/api/supabase/sync` and `/api/supabase/sync-lead` routes
5. Switch `/api/leads/pipeline` to read from `v_lead_with_client` + `v_kpi_scoreboard` views instead of Airtable
6. Restore `.github/workflows/supabase-sync.yml` (5-min cron)

The git diff to bring this back is small — one PR. Don't write it
preemptively though; let real volume drive the decision.
