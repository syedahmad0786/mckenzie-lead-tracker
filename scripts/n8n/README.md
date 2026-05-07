# n8n workflows — Lead Tracker

All workflows are tagged `lead-tracker` in n8n at `n8n.aimanagingservices.com`.
Each is a standalone JSON; import via *Workflows → Import from file*. Set
the credentials (Airtable PAT + Slack Bot) once in n8n's Credentials panel
and reference them by name across workflows.

## How they wire together

```
Inbound (lead enters the system)
─────────────────────────────────
 Instantly  →  lead-tracker-instantly-to-airtable    →  Airtable Leads + #leads
 Typeform   →  lead-tracker-typeform-to-airtable     →  Airtable Leads + #leads
 Make.com   →  lead-tracker-make-bridge              →  Airtable Leads
                  (each Make scenario adds an HTTP module that POSTs here)

Lead lifecycle (status changes inside the dashboard)
────────────────────────────────────────────────────
 /api/leads/update  →  lead-tracker-status-change-slack
                          ├── newStatus = 'order_placed' →  lead-tracker-order-placed-celebration
                          ├── newStatus = 'lost'         →  Slack #leads
                          └── otherwise                  →  Slack #leads

Scheduled
─────────
 Daily 9am ET  →  lead-tracker-stale-lead-reminder    →  #leads (>30d not_yet_closed)
 Daily 9am ET  →  lead-tracker-daily-digest           →  #leads (yesterday roll-up)
 Mondays 9am   →  lead-tracker-weekly-digest          →  #leads + agency-private

Error path
──────────
 anywhere → lead-tracker-error-alert  →  #errors (with severity routing)
```

## Slack channels referenced

Set as n8n environment variables (or workflow-level `$env.*`):

- `SLACK_LEADS_CHANNEL` — public-to-the-team channel for lead activity, e.g. `#mckenzie-tracker-leads`
- `SLACK_AGENCY_PRIVATE_CHANNEL` — agency-only, holds payout numbers, e.g. `#ma-mckenzie-internal`
- `SLACK_ERRORS_CHANNEL` — ops alerts, e.g. `#mckenzie-tracker-errors`

## Webhook URLs the dashboard fires to

After importing each workflow, copy its production webhook URL and
paste into Vercel env:

| n8n workflow | Vercel env var |
|---|---|
| lead-tracker-instantly-to-airtable | (Instantly itself POSTs here — set webhook in Instantly) |
| lead-tracker-typeform-to-airtable  | (Typeform itself POSTs here — set webhook in Typeform) |
| lead-tracker-make-bridge           | (Each Make scenario POSTs here as its last step) |
| lead-tracker-status-change-slack   | `N8N_STATUS_CHANGE_WEBHOOK` |
| lead-tracker-order-placed-celebration | `N8N_ORDER_PLACED_WEBHOOK` |
| lead-tracker-error-alert           | `N8N_ERROR_ALERT_WEBHOOK` |
| lead-tracker-daily-digest          | `N8N_DAILY_DIGEST_WEBHOOK` (also triggered by GH Actions cron) |
| lead-tracker-weekly-digest         | (cron-only) |
| lead-tracker-stale-lead-reminder   | (cron-only) |

## Importing

1. In n8n: *Workflows → Import from file → select JSON*
2. Add credentials: `Lead Tracker PAT` (Airtable) + `Lead Tracker Bot` (Slack)
3. Open each imported workflow and **flip the Active toggle in the UI** —
   the n8n public API can't activate webhook-triggered workflows
   (this is a known n8n limitation noted in the onboarding-dashboard skill).

## Adding a new AOC client (template duplication)

For each workflow that references `Leads`, `{Status}`, etc., the table
name is hardcoded but the base ID is `$env.AIRTABLE_BASE_ID`. So:

1. Duplicate each workflow in n8n (Cmd-D in the workflow list).
2. Rename: `lead-tracker-<client>-instantly-to-airtable`, etc.
3. Override `AIRTABLE_BASE_ID` and Slack channel env vars at the
   workflow level (right-click → Settings → Environment variables).
4. Activate.

For the next AOC client, this is roughly 10 minutes of duplication +
env-override per client. Phase 2 will move this into a single
parameterized router workflow.
