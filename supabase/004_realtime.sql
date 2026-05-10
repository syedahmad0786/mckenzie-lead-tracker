-- =====================================================================
-- Enable Supabase Realtime on the leads table.
-- Apply via: Supabase dashboard → SQL Editor → paste + Run.
-- One-liner. Idempotent.
-- =====================================================================

alter publication supabase_realtime add table public.leads;
