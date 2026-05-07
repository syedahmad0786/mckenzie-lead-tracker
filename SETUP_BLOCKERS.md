# Setup blockers (Phase 1 — Airtable only)

Four credential decisions outstanding before this can be deployed.
Once these are answered, the scaffold in this repo is ready to push +
deploy with no further code changes — only env vars to populate.

## 1. Airtable workspace  *(from Ahmad)*
- Under **Modern Amenities workspace** or **`ahmad-bukharis` workspace**?
- Recommended: MA workspace if McKenzie + future AOC clients should sit
  under company billing. `ahmad-bukharis` if speed matters more.

## 2. Domain  *(from Ahmad / IT)*
- Subdomain choice: `tracker.modern-amenities.com` or `mckenzie.modern-amenities.com`?
- Who manages DNS for `modern-amenities.com`?

## 3. Slack  *(from Kody)*
Three channels to create + a bot token:
- `#mckenzie-tracker-leads` — public-to-team lead activity
- `#ma-mckenzie-internal`   — agency-only, holds payout numbers
- `#mckenzie-tracker-errors` — ops alerts
Bot needs scopes: `chat:write`, `channels:read`, `groups:read`.

## 4. McKenzie users  *(from Kody / Ryan)*
- Full email addresses for Lauren, David, Erin (and anyone else who should log in).

## Deferred (no longer blocking Phase 1)

- ~~Supabase project~~ → moved to Phase 2 per Ahmad on May 7, 2026
- ~~Email service~~ → "will get emails later" per Ahmad
- ~~Anthropic API key~~ → not needed in v1
- ~~Make.com API token~~ → manual scenario edit per Lujan, no programmatic access required

## Once unblocked — runbook

```bash
# 1. Create Airtable base per scripts/supabase/AIRTABLE_SCHEMA.md
#    Set up tables: Leads, Campaigns, Clients, Audit Log
#    Seed Clients row + 6 Campaigns rows

# 2. Create GitHub repo and push
gh repo create syedahmad0786/mckenzie-lead-tracker --public --source=.
git push -u origin main

# 3. Provision Vercel
vercel link
for var in AIRTABLE_PAT AIRTABLE_BASE_ID N8N_BASE_URL N8N_API_KEY \
           N8N_TRIGGER_SECRET N8N_STATUS_CHANGE_WEBHOOK \
           N8N_NEW_LEAD_WEBHOOK N8N_ORDER_PLACED_WEBHOOK \
           N8N_ERROR_ALERT_WEBHOOK N8N_DAILY_DIGEST_WEBHOOK \
           N8N_WEEKLY_DIGEST_WEBHOOK INSTANTLY_WEBHOOK_SECRET \
           TYPEFORM_WEBHOOK_SECRET NEXT_PUBLIC_APP_URL ACTIVE_CLIENT_ID; do
  vercel env add $var production
done

# 4. Deploy
npm run typecheck
vercel deploy --prod --yes

# 5. Set DNS — A record for chosen subdomain → Vercel

# 6. Import all 9 n8n workflows from scripts/n8n/*.json
#    Add Airtable + Slack credentials in n8n UI
#    Flip Active toggle on each (n8n public API can't activate webhook workflows)

# 7. Set Vercel env webhook URLs to the n8n production webhook URLs

# 8. Configure Make.com — add HTTP node at end of each scenario
#    POST → https://n8n.aimanagingservices.com/webhook/lead-tracker-make-bridge

# 9. Configure Instantly + Typeform webhooks (point at n8n endpoints)

# 10. Set GitHub Actions secrets for the daily-digest cron
gh secret set N8N_DAILY_DIGEST_WEBHOOK --body "<n8n url>"
gh secret set N8N_TRIGGER_SECRET --body "<random 32 byte hex>"
```
