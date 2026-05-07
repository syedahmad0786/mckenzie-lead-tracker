# What's done vs what's next

## Done so far (live)
- ✅ Live dashboard at https://mckenzie-lead-tracker.vercel.app
- ✅ Airtable base (`appcAs8YL3V7BcerG`) with 4 prefixed lead-tracker tables, seeded
- ✅ GitHub repo `syedahmad0786/mckenzie-lead-tracker` (auto-deploys on push)
- ✅ 9 n8n workflows imported + activated, Airtable cred wired
- ✅ Make.com bridge + Typeform + Instantly webhooks live
- ✅ Supabase env vars on Vercel (URL + service role key)
- ✅ Design assets from your artifact saved in `design-from-artifact/`

## Pending — actions you need to take (~5 min)

### 1. Apply the Supabase schema
Open https://supabase.com/dashboard/project/ubpxczuvdxbluscdwafs/sql, paste the
contents of `supabase/001_init.sql`, hit Run. That creates clients/campaigns/leads
/profiles/audit_log tables, the auth-trigger that auto-creates profile rows on
signup, RLS policies (agency_admin sees all, client_member sees only their data),
and the audit trigger that fires on every leads update.

### 2. Send me the publishable / anon key
Dashboard → Project Settings → API → "Publishable" or "anon public" key.
Paste it back; I'll update `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel.

### 3. Configure Auth email templates (one-time)
Dashboard → Authentication → URL Configuration:
  - Site URL: https://mckenzie-lead-tracker.vercel.app
  - Redirect URLs add: https://mckenzie-lead-tracker.vercel.app/auth/callback
Dashboard → Authentication → Email Templates:
  - Adjust the "Confirm signup" / "Magic link" / "Reset password" copy to taste.

## Next turn — what I'll build once #1–#3 land

### Phase A — port the new design
Take the JSX/CSS in `design-from-artifact/` and port into Next.js components
under `src/components/design-v2/`. Replace the current homepage layout with the
new TopBar + Scoreboard + FilterBar + LeadTable + LeadDrawer + Settings + Login.
Keep MA brand tokens (gold/forest, Archivo + DM Sans). Logo: pull live from
`mcsewon.com`.

### Phase B — switch backend to Supabase
- Replace Airtable reads with Supabase reads (the views `v_lead_with_client` +
  `v_kpi_scoreboard` are already designed)
- Keep Airtable as a pass-through write target via n8n so existing flows stay
  alive while we transition (or stop writing to Airtable entirely once Supabase
  is the source of truth — your call)
- Add `/auth/callback`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
  routes wired to Supabase Auth
- Audit log already fires automatically via the SQL trigger — no app code needed

### Phase C — pull leads directly from Make / Sheets
The Make scenarios already write to a Google Sheet (`Google Sheets: addRow`
node in each scenario per their blueprint). Two options:

**Option 1 (recommended):** add an n8n Google Sheets "Watch Rows" trigger →
upsert into Supabase. Zero edits to Make scenarios. New campaigns automatically
work.

**Option 2:** read the sheet on every dashboard refresh. Simpler but slower
and hits Sheets API on every page load.

I'd default to Option 1. Will need: which sheet ID(s) the Make scenarios
write to (visible in each scenario's "Google Sheets" module config), and a
Google service account credential added to n8n.

### Phase D — auth-protected dashboard with role-based views
- New users sign up at `/signup` → email verification → land on dashboard.
- Agency admins (you, Ryan, Kody) see all clients.
- Client members (Lauren, David, Erin from McKenzie) see only their client's leads.
- All edits stamped with `user_id` + `user_email` in `audit_log` automatically.

### Phase E — fix the n8n env-var thing
Currently every workflow has the Airtable base ID hardcoded because n8n's
`N8N_BLOCK_ENV_ACCESS_IN_NODE` is on. Once Supabase is the source of truth,
n8n only needs the Airtable cred for the bridge (writes), not for reads —
so the env-var issue dissolves.

