# Airtable schema — McKenzie Lead Tracker (Phase 1)

Phase 1 is **Airtable only** — these four tables are the entire data
model. Field names are case-sensitive and must match exactly.

## Base

- **Name:** `Lead Tracker — McKenzie`
- **Workspace:** Modern Amenities (or `ahmad-bukharis` — TBC, see SETUP_BLOCKERS)

## Table: `Leads` (primary)

| Field name             | Type             | Notes                                                         |
|------------------------|------------------|---------------------------------------------------------------|
| Email                  | Single line text | Primary identifier (lowercase). Unique across all campaigns.  |
| Contact Name           | Single line text |                                                               |
| Company                | Single line text |                                                               |
| Phone                  | Phone number     |                                                               |
| Campaign               | Single line text | Display name — slug-resolved by classifier                    |
| Date Introduced        | Date             | When handed off to McKenzie                                   |
| Status                 | Single select    | Options: `not_yet_closed`, `order_placed`, `lost`             |
| Date First Order       | Date             | Required when Status = order_placed                            |
| First Order Amount     | Currency (USD)   | Required when Status = order_placed                            |
| Notes                  | Long text        |                                                               |
| Instantly Campaign ID  | Single line text | Hidden — populated by Instantly webhook                       |
| Typeform Response ID   | Single line text | Hidden — populated by Typeform webhook                        |

### Rules
1. Email is the unique key (Lujan: no dupes within or across campaigns).
2. Status defaults to `not_yet_closed` when a webhook creates a lead.
3. `order_placed` without a date AND amount > 0 is auto-downgraded by the classifier.

## Table: `Campaigns`

| Field name      | Type             | Notes                                              |
|-----------------|------------------|----------------------------------------------------|
| Campaign ID     | Single line text | Slug, e.g. `tourist-gift-shop` (primary field)     |
| Client ID       | Single line text | Links to Clients table — e.g. `mckenzie`           |
| Campaign Name   | Single line text | Display name, e.g. "Tourist Gift Shop"             |
| Color           | Single line text | Optional — hex chip color override                 |
| Archived        | Checkbox         |                                                     |

### Seed data — McKenzie's 6 real campaigns

| Campaign ID            | Client ID  | Campaign Name           |
|------------------------|------------|-------------------------|
| tourist-gift-shop      | mckenzie   | Tourist Gift Shop       |
| museum-donors          | mckenzie   | Museum Donors           |
| acquisitions           | mckenzie   | Acquisitions            |
| construction           | mckenzie   | Construction            |
| banks-credit-unions    | mckenzie   | Banks & Credit Unions   |
| schools                | mckenzie   | Schools                 |

## Table: `Clients`

| Field name           | Type             | Notes                                                         |
|----------------------|------------------|---------------------------------------------------------------|
| Client ID            | Single line text | Slug, e.g. `mckenzie` (primary field)                          |
| Client Name          | Single line text |                                                               |
| Logo URL             | URL              | Used for header + PDF export                                   |
| Accent Color         | Single line text | Hex, e.g. `#00a7e0` for McKenzie                              |
| Payout % First       | Percent          | 0.15 (i.e. 15%) for McKenzie                                  |
| Payout % Subsequent  | Percent          | 0 for McKenzie                                                |
| Payout Visible       | Checkbox         | UNCHECKED for v1 — hides payout column in UI                  |

### Seed — single row

| Client ID | Client Name      | Logo URL                                                                                | Accent Color | Payout % First | Payout Visible |
|-----------|------------------|-----------------------------------------------------------------------------------------|--------------|----------------|----------------|
| mckenzie  | McKenzie SewOn   | http://www.mcsewon.com/wp-content/uploads/2016/03/mcsewon-LogoBlack-350x71.png          | #00a7e0      | 0.15           | unchecked      |

## Table: `Audit Log`

| Field name        | Type             | Notes                                              |
|-------------------|------------------|----------------------------------------------------|
| Lead Airtable ID  | Single line text | The lead's Airtable record id (primary field)      |
| Field Changed     | Single line text | e.g. `Status`, `First Order Amount`                |
| Old Value         | Long text        |                                                     |
| New Value         | Long text        |                                                     |
| User Email        | Single line text | Who made the change (when known)                   |
| User Role         | Single select    | `agency_admin`, `client_member`, `aoc_admin`        |
| Changed At        | Date and time    |                                                     |

The `Audit Log` table powers the lead-detail-drawer timeline and the
"who changed what" trail Ryan referenced in his review.
