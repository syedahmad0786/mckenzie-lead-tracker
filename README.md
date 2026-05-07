# McKenzie Lead Tracker

Shared lead-handoff and order-tracking dashboard between Modern Amenities
(agency) and McKenzie SewOn (client). Built as the reusable template for
every future AI Operator Collective client.

## Architecture (Phase 1 — Airtable only)

```
Instantly (positive reply tag)
   │
   ▼
Make.com  (Lujan + Saad scenarios:
           Construction 4851014 active,
           Tourist 4552621 inactive,
           Acquisitions Relaunch / Prequalified / Banks & Credit Unions launching)
   │
   │   each scenario adds a final HTTP step → /webhook/lead-tracker-make-bridge
   │
   ▼
Typeform completion
   │
   │   webhook → /webhook/lead-tracker-typeform
   ▼
n8n (n8n.aimanagingservices.com, tag `lead-tracker`)
   │
   ▼
Airtable: Leads, Campaigns, Clients, Audit Log     ← single source of truth
   ▲
   │
   │  reads / writes via the Next.js API routes
   ▼
Next.js dashboard on Vercel (this repo)
   │
   ▼
Slack: #mckenzie-tracker-leads, #ma-mckenzie-internal, #mckenzie-tracker-errors
   (driven entirely by n8n — 9 workflows)
```

End-to-end latency: ~1s on lead webhook → dashboard, ~real-time on user edit.

**Phase 2 (deferred):** add Supabase as a SQL mirror for cross-tenant
analytics and to plug into the Wild Ducks AIMS performance tracker.
Schema + migration plan live in [`phase-2-supabase/`](./phase-2-supabase).

## Stack

- **Airtable** — operational source of truth (Leads, Campaigns, Clients, Audit Log)
- **Next.js on Vercel** — UI + API routes (under `ahmad-bukharis-projects-74a52414`)
- **n8n** at `n8n.aimanagingservices.com` — orchestration (9 workflows tagged `lead-tracker`)
- **Slack** — notifications (3 channels)
- **GitHub Actions** — daily digest cron trigger

## Initial setup (in order)

> **Heads up:** four credential decisions are pending — see [`SETUP_BLOCKERS.md`](./SETUP_BLOCKERS.md). Resolve those first.

### 1. Airtable base

Create base per [`scripts/n8n/AIRTABLE_SCHEMA.md`](./scripts/supabase/AIRTABLE_SCHEMA.md). Tables:

- `Leads` — primary, one row per lead, email-keyed
- `Campaigns` — one row per campaign per client
- `Clients` — multi-tenant from day one (McKenzie + future AOC clients)
- `Audit Log` — one row per field change

Seed the 6 McKenzie campaigns: Tourist Gift Shop, Museum Donors, Acquisitions, Construction, Banks & Credit Unions, Schools.

### 2. Vercel project

```bash
gh repo create syedahmad0786/mckenzie-lead-tracker --public --source=.
git push -u origin main
vercel link            # accept org ahmad-bukharis-projects-74a52414
vercel env add AIRTABLE_PAT production
vercel env add AIRTABLE_BASE_ID production
# …repeat for every key in .env.example
vercel deploy --prod --yes
```

### 3. n8n workflows

Import each JSON in `scripts/n8n/` via *Workflows → Import from file*. After import:

1. Add credentials once: `Lead Tracker PAT` (Airtable), `Lead Tracker Bot` (Slack).
2. Open each workflow and **flip Active in the UI** (n8n public API can't activate webhook workflows).
3. Copy each production webhook URL and paste into Vercel env vars per [`scripts/n8n/README.md`](./scripts/n8n/README.md).

### 4. Make.com integration

For each existing scenario (Construction `4851014`, Tourist `4552621`) and the three launching this weekend (Acquisitions Relaunch, Acquisitions Prequalified, Banks & Credit Unions):

1. Add a final HTTP module that POSTs the lead JSON to:
   `https://n8n.aimanagingservices.com/webhook/lead-tracker-make-bridge`
2. The bridge workflow normalizes the payload and upserts into Airtable.

### 5. Instantly + Typeform webhooks

- Instantly: configure positive-reply webhook → n8n `/webhook/lead-tracker-instantly`
- Typeform: configure form webhook → n8n `/webhook/lead-tracker-typeform`

Both with the secret from `INSTANTLY_WEBHOOK_SECRET` / `TYPEFORM_WEBHOOK_SECRET`.

### 6. GitHub Actions cron (daily digest)

Set repo secrets:

```bash
gh secret set N8N_DAILY_DIGEST_WEBHOOK --body "https://n8n.aimanagingservices.com/webhook/lead-tracker-daily-digest"
gh secret set N8N_TRIGGER_SECRET       --body "<random 32-byte hex>"
```

The workflow at `.github/workflows/supabase-sync.yml` (renamed-purpose, file kept for git history) hits the daily-digest webhook every morning at 9am ET.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill in AIRTABLE_PAT + AIRTABLE_BASE_ID at minimum
npm run dev
```

Open `http://localhost:3000`.

## Key URLs and IDs (post-deploy)

| Thing | URL / ID |
|---|---|
| Dashboard | `https://tracker.modern-amenities.com` (or chosen subdomain) |
| GitHub repo | `github.com/syedahmad0786/mckenzie-lead-tracker` |
| Vercel project | `mckenzie-lead-tracker` · org `ahmad-bukharis-projects-74a52414` |
| Airtable base | TBD — see SETUP_BLOCKERS |
| n8n | `n8n.aimanagingservices.com` (workflows tagged `lead-tracker`) |
| Slack channels | `#mckenzie-tracker-leads`, `#ma-mckenzie-internal`, `#mckenzie-tracker-errors` |

## File map

```
.github/workflows/
  supabase-sync.yml             ← repurposed: triggers n8n daily-digest webhook
phase-2-supabase/
  README.md                     ← when to migrate
  001_init.sql                  ← idempotent schema, ready when needed
scripts/n8n/
  README.md                     ← workflow inventory + wiring diagram
  lead-tracker-instantly-to-airtable.json
  lead-tracker-typeform-to-airtable.json
  lead-tracker-make-bridge.json
  lead-tracker-status-change-slack.json
  lead-tracker-order-placed-celebration.json
  lead-tracker-stale-lead-reminder.json
  lead-tracker-daily-digest.json
  lead-tracker-weekly-digest.json
  lead-tracker-error-alert.json
scripts/supabase/
  001_init.sql                  ← deprecated stub, points to phase-2-supabase/
  AIRTABLE_SCHEMA.md
src/app/
  page.tsx                      ← main dashboard
  layout.tsx, globals.css
  api/
    leads/pipeline/             ← GET — leads + KPIs (reads Airtable directly)
    leads/update/               ← POST — inline edits (writes Airtable + audit + n8n)
    instantly/webhook/          ← POST — direct webhook receiver (alternate to n8n)
    typeform/webhook/           ← POST — direct webhook receiver (alternate to n8n)
    supabase/sync/, sync-lead/  ← 410 Gone in Phase 1
src/lib/
  airtable.ts                   ← Phase-1 source of truth client (leads, clients, campaigns, audit)
  pipeline.ts                   ← classifier (the most important file) + KPI computer
  design-adapter.ts             ← row → UI shape
  types.ts
  supabase.ts                   ← deprecated stub — restore in Phase 2
  airtable-to-supabase.ts       ← deprecated stub — restore in Phase 2
src/components/design/
  DashboardShell.tsx, KpiTile.tsx, FilterBar.tsx, LeadTable.tsx,
  LeadDrawer.tsx, StatusPill.tsx, CampaignChip.tsx
```

## Differences from the onboarding dashboard

| Onboarding dashboard | McKenzie Lead Tracker (Phase 1) |
|---|---|
| Airtable + Supabase + Next.js + n8n | **Airtable + Next.js + n8n** (Supabase deferred) |
| 6-stage platform pipeline | 3-status lead pipeline |
| All state changes platform-driven | Manual order entry by McKenzie team |
| No payout layer | Payout calculated server-side, hidden in v1 UI |
| Single client | `Clients` table — multi-tenant from day one |
| Lead source = Close CRM | Lead source = Instantly → Make.com → n8n bridge |
| 5-min Supabase sync cron | Daily digest cron (n8n does the rest in real time) |

## Status

See `SETUP_BLOCKERS.md` for the active list. Recently shipped:

- ✅ Branding swap to McKenzie blue `#00a7e0`
- ✅ Real campaign names seeded (Tourist Gift Shop, Museum Donors, Acquisitions, Construction, Banks & Credit Unions, Schools)
- ✅ "Showing N of M total leads" counter when filters active
- ✅ Payout column hidden in both table and lead drawer; calc still runs internally
- ✅ Email = lead identity match key (Lujan confirmed no dupes)
- ✅ Phase-1 Airtable-only architecture
- ✅ Full n8n workflow set (9 workflows, all Slack-connected)

Open:

- 4 setup blockers (see `SETUP_BLOCKERS.md`)
- Audit-trail visibility for Client Members — Ryan + Kody decision pending
- Make.com bridge needs adding to existing scenarios (10 min per scenario)
- Syncore integration — Phase 2
