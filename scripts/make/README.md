# Make.com integration

The team uses Make.com (us2 zone, team `285569`, organization `2518043`)
to run per-campaign Typeform → AI summary → email-to-Chris → Google
Sheets → Instantly status update workflows. Each campaign has its own
scenario.

Lujan + Saad own the scenario configurations. Ahmad has API access via
the team API token (set as `MAKE_API_TOKEN`).

## Confirmed McKenzie scenarios (as of May 7, 2026)

| ID       | Active | Hook ID  | Webhook URL                                                | Name                                                |
|----------|--------|----------|------------------------------------------------------------|-----------------------------------------------------|
| 4851014  | ✅     | 2210702  | `https://hook.us2.make.com/hrhroxam7ts2tyxmbjyayyyux9lidtho` | McKenzie Form Submission Construction Workflow      |
| 4552621  | ⏸️     | 2119640  | `https://hook.us2.make.com/h561p9fpbdg1qoi6rg3jueu5e5fz32hr` | McKenzie Form Tourist Campaign Submission Workflow  |

Three more scenarios are being created this weekend (Acquisitions
Relaunch, Acquisitions Prequalified, Banks & Credit Unions). Re-run
`./inventory.sh` after Lujan creates them to capture their hook URLs.

## Module flow inside each Make scenario

```
Typeform webhook  →  OpenAI (prospect summary)  →  Gmail (to Chris)
                                                  →  Google Sheets (audit row)
                                                  →  Instantly (update lead status)
```

The McKenzie tracker plugs in *parallel* to this flow, not in series.
See `Integration approach` below.

## Integration approach (decided May 7)

**Option A (chosen) — fork at the Typeform layer.**
Typeform webhooks already POST to Make. We add a *second* webhook on
each form pointing at n8n's `lead-tracker-typeform` endpoint. Both
systems receive every submission; neither blocks the other.

```
Typeform submission
   ├──→ Make.com (existing AI summary + email + sheet + Instantly)
   └──→ n8n  /webhook/lead-tracker-typeform  →  Airtable + Slack
```

**Why this over a final HTTP module in each Make scenario:**
- Zero edits to existing Make scenarios — Lujan doesn't have to touch them.
- New campaigns auto-work: the Typeform webhook config is the change point, not the Make blueprint.
- Make doesn't depend on n8n availability and vice versa.

**Drawback:** the n8n side doesn't see the AI-generated prospect summary that Make produces. If we want that in Airtable, add `lead-tracker-make-bridge` as an additional final HTTP module — it's optional.

## Helper scripts

### `inventory.sh`
Lists every McKenzie-related Make scenario with hook IDs and active
state. Run this whenever a new campaign launches.

```bash
MAKE_API_TOKEN=<token> ./scripts/make/inventory.sh
```

## Where to put `MAKE_API_TOKEN`

- *Local dev:* in `.env.local` (gitignored).
- *Vercel:* not needed — the dashboard itself doesn't call Make's API; only the inventory helper does.
- *NEVER commit:* don't add the value to `.env.example` or any tracked file.
