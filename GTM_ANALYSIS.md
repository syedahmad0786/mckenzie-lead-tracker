# McKenzie Lead Tracker — Deep GTM Analysis

**Author:** Ahmad Bukhari · Modern Amenities
**Date:** May 12, 2026
**Status:** Live system at https://mckenzie-lead-tracker.vercel.app — 21 leads tracked, $0 revenue logged, 5 public routes verified, real-time push working

---

## 1. What this product actually is

This is not a SaaS lead-tracker. It is the **revenue-attribution layer of Modern Amenities' AOC operator service**. The software exists to settle a single dispute that every agency-of-choice arrangement creates between an agency and its client:

> Whose pipeline is this, and what was the agency actually responsible for closing?

The dashboard is the artifact that makes that answer unambiguous. McKenzie sees every handoff Modern Amenities sourced, the order it became, the revenue it earned, and the payout MA is owed — in real time, in one place, with an audit trail. The product wraps a service. The service is the thing being sold; the dashboard is what makes the service legible enough to renew.

That framing matters because it kills two bad GTM instincts:

1. **Don't price this as software.** Per-seat or per-lead SaaS pricing will be both undersold and unbuyable. The dashboard has no value without MA running campaigns into it.
2. **Don't sell it to the lead-tracking buyer.** The buyer is a B2B services principal who has been burned by an opaque agency before. They are buying *visibility into the agency's work*, not a CRM.

## 2. What the live test proves

I just took the production system through a full surface test (1440×900 + 380×800 mobile):

| Surface | Result |
|---|---|
| `/login` | Renders split-screen with McKenzie wordmark, Archivo Narrow display type, "21 leads tracked / $0 revenue" live counter |
| `/signup` | Renders, email-verification copy correct, MA footer present |
| `/forgot-password` | Renders, copy mentions Supabase Auth + 1hr expiry |
| `/reset-password` | 200 |
| `/auth/callback` | Visible page with MS monogram, "All set — taking you to the dashboard…" |
| `/` (unauthenticated) | Correctly redirects to `/login?next=/` |
| `/mckenzie-logo.png`, `/ma-logo.png` | Both serve |
| `/api/sync/sheets` (no auth) | Correctly returns `401 unauthorized` |
| Console errors | Zero |
| Mobile (380px) | Renders, no horizontal scroll |

**What this means commercially:** the asset is real, demoable today, and uses the customer's real brand. Every prospect call from here forward should open with a 60-second screenshare. The product has crossed the "is it actually built" threshold that most agency-side tooling never reaches.

## 3. ICP — who pays for this

This product fits a narrow but well-defined buyer:

**Firmographic**
- US-based B2B service or product business
- $5M–$50M revenue
- Lead-driven (every dollar requires a qualified intro, not a Shopify checkout)
- Founder/owner still in the deal flow (decisions made in days, not quarters)
- Currently buys outbound, paid, or fractional marketing — and *complains about it*

**Psychographic — the actual qualifier**
- Has been burned by an agency before and now demands receipts
- Sales team is small enough that one new revenue channel materially moves the quarter
- Owner thinks in terms of "what did each $ produce" rather than "what's our brand"

McKenzie SewOn fits every one of these. So do roughly 50–200 companies in MA's existing network and warm reach. **That is the addressable market.** Stop trying to make this into a horizontal product.

## 4. Pricing & monetization

The current pricing geometry should be a three-line invoice on the principal's desk:

1. **Setup / activation fee** — $5K–$10K, one-time, covers brand-token theming, campaign onboarding, Make/n8n wiring, sheet plumbing, user provisioning. This is real work and we are doing it; charge for it.
2. **Monthly retainer for the operator service** — $7.5K–$15K depending on campaign count, deliverability load, and ICP complexity. This is what funds the people running scenarios, copy, and Saad's enrichment.
3. **Performance share** — 8–15% of attributed closed-won revenue, settled monthly from the dashboard. This is the line item that closes the deal because it aligns incentives and the dashboard is the evidence.

**Why this structure works**
- The dashboard's existence turns the performance share from a haggle into a fact. Mike + Kody finalizing payout rules unlocks this immediately.
- A flat retainer alone leaves money on the table when a campaign hits. A pure rev-share leaves MA exposed to slow-payers and dispute risk. Both together is the right hedge.
- The setup fee filters tire-kickers and pays for the first month's build before churn risk peaks.

**What NOT to do**
- Per-seat pricing. There are 3–6 seats per client; this is unsellable as a primary line.
- Per-lead pricing. McKenzie's 21 leads → $0 revenue (yet) makes the point: until close, "leads" is the wrong unit of value.
- "Pay for the dashboard." The dashboard is the trust artifact, not the product.

## 5. Sales motion

This is a founder-to-founder sale, with the dashboard as the proof object.

**Stage 0 — Bait** (1 week)
- Modern Amenities publishes the McKenzie case study: "21 qualified handoffs into a $X custom-sewing operation in 6 weeks, with a real-time payout ledger." The dashboard screenshot IS the case study.
- LinkedIn posts from MA leadership pointing at it.

**Stage 1 — Discovery call** (45 min)
- Open with a 5-minute screenshare of the live McKenzie dashboard (not a fake demo — the real one with `revenue=$0` is more credible than a Stripe-style fake).
- Walk through the audit trail of one lead from intro → status change → notes.
- Ask: *"Could your current agency show you this?"*

**Stage 2 — Pilot proposal** (5-day turnaround)
- 60-day paid pilot: setup fee + 2 months retainer, performance share clauses already inserted but at zero until the first attributed close.
- One campaign live by day 14; second by day 30; close-attribution wired by day 45.
- Pilot success = ≥X qualified intros AND a working settlement ledger, NOT a specific revenue number (which we don't control).

**Stage 3 — Conversion** (day 60)
- Pilot rolls into 12-month engagement on the same three-line invoice structure.
- Performance share activates retroactively for the pilot period (this is a strong commercial gesture and costs MA nothing because there's usually little revenue to share in the first 60 days).

**Who pitches this**
- Discovery: MA founder/principal. Nobody else has the standing to set the trust frame.
- Pilot kickoff: principal + Lujan (campaigns) + Saad (data/enrichment) on the call.
- Steady-state: Kody owns the relationship.

## 6. Onboarding playbook — first 30 days for a new AOC client

What McKenzie's onboarding taught us, codified into a repeatable plan:

| Day | Owner | Action | Failure mode if skipped |
|---|---|---|---|
| 0 | Sales | Master Services Agreement + payout rules signed; SoW lists campaigns | Performance share becomes unenforceable later |
| 1 | Eng | New Supabase project (NOT shared with McKenzie's), new Vercel project, new domain, fresh client_id | Cross-tenant data leak; legal exposure |
| 2 | Eng | Brand tokens scraped from client's site CSS, Archivo Narrow-equivalent font sourced, logo pulled at native resolution | Looks like a generic agency template; immediate trust damage |
| 3 | Eng | Email/password + magic link configured on Supabase Auth; SMTP sender set to the agency domain | Verification emails go to spam, first impression broken |
| 5 | Campaigns | First Make/n8n scenario wired; sheet column "Campaign" present from day one | Same campaign-attribution debt we're paying off with McKenzie now |
| 7 | Eng | GH Actions cron live; CRON_SECRET set in repo secrets; first sync run logged | Manual re-sync becomes a daily chore |
| 10 | CS | Client admins invited; their first lead lands; we walk them through the drawer | Client logs in, sees zero leads, thinks the system is broken |
| 14 | Sales | First weekly sync; show payout calc even at $0 to set the expectation | Payout dispute in month 2 |
| 21 | Eng | Audit trail + status change workflow validated end-to-end with a real lead | We discover a bug during a close, not before |
| 30 | All | Pilot review: campaigns active, leads flowing, settlement preview generated | No checkpoint = pilot drifts into year-long retainer without a renewal decision |

**The single most-important lesson from McKenzie:** the dashboard must be brand-skinned *before* the first client login, not after. The cost is 2 hours; the trust dividend lasts the relationship.

## 7. Activation & retention metrics

These are the metrics MA should be running this product against — and they are mostly distinct from what the dashboard *shows* the client.

**Activation (per client)**
- Time-to-first-lead-in-dashboard: target <14 days
- Time-to-first-client-login: target <72 hours after first invite
- Number of campaigns live by day 30: target ≥2

**Engagement (per client per month)**
- Distinct client-side logins per week: target ≥1 per active admin
- Status changes made by client-side users (not MA): target ≥10/mo
- Lead-detail drawer opens per month: this is the "are they reading it" metric

**Outcome (per client per quarter)**
- Attributed closed-won revenue
- Settlement disputes opened: target = 0
- Renewal NPS or equivalent qualitative check

**Leading indicator of churn**
- Client logs in <1×/week for 3 consecutive weeks = at-risk. The dashboard is the relationship's heartbeat; if it stops, the contract follows.

We are not instrumenting these yet. We should be — it's a 1-day build with a Supabase audit table and a weekly digest.

## 8. Competitive positioning

The honest map of what we're competing against and where we win/lose.

| Competitor | What they offer | Where we win | Where we lose |
|---|---|---|---|
| Traditional B2B agencies (Belkins, CIENCE, MarketStar) | Lead-gen + monthly report | Real-time attribution, owner-grade UI | They have brand recognition and case studies at scale |
| Fractional CRO/consultants | Strategic advisory, no execution | We execute; they don't | They charge less for advisory-only engagements |
| Apollo + HubSpot DIY | Tooling, no service | Software-only doesn't fix the agency problem | Cheaper if the client has an in-house BD team |
| Clay + a freelancer | Modern stack, low cost | Trust artifact + accountable team | Cost — and Clay's audience is sophisticated enough to assemble this themselves |

**Our defensible position:** "We are the only operator that closes the loop on every lead we send you, in your own brand, with a real-time payout ledger you can audit." The combination of execution + attribution + UI is hard to fake; it requires both an agency competence and a software competence.

**The risk to that position:** Clay and similar tooling are getting close enough that a sophisticated buyer might assemble 80% of what we do for 40% of the cost. Our answer is: yes, but you can't assemble the team or the accountability — and that's what you're paying for.

## 9. Risk surface — where trust breaks

These are the specific failure modes that will cost us a client if they happen, ranked by likelihood × severity.

1. **Payout dispute over an unattributed lead.** A close happens, we claim it, they say it was their existing pipeline. *Mitigation:* every lead must carry a source/campaign field from the moment it enters the sheet. The Banks campaign and the 3 Construction tiers MUST have the Campaign column wired before they go live. **Status: blocker, pending Saad.**
2. **Real-time push fails silently.** Lead lands in Sheets, doesn't appear in dashboard, client thinks we're sandbagging volume. *Mitigation:* cron runs every 5 min; we should add a "last sync" timestamp to the dashboard footer and a Slack alert if no sync in 15 min. **Status: 1-hour build, not done.**
3. **Realtime WS subscription fails for one user.** They watch the dashboard during a meeting expecting to see a lead land live, nothing happens. *Mitigation:* Realtime is enabled and RLS-correct, but we have not tested under flaky network or with the magic-link auth path. **Status: needs a real session test with a non-agency user.**
4. **Email verification lands in spam.** Onboarding stalls at signup. *Mitigation:* configure SPF/DKIM on whatever sender Supabase uses (or switch to a dedicated SMTP). **Status: not done; will bite the next client.**
5. **Slack notifications missing.** Kody and team don't get pinged on new leads or status changes. *Mitigation:* 7 of 10 n8n workflows are still waiting on a Slack bot token. **Status: blocker, pending Kody.**
6. **Dashboard goes down during a board meeting.** Vercel/Supabase outage at the wrong moment. *Mitigation:* status page + on-call rotation for the MA infra team. **Status: nothing in place.**

## 10. Concrete blockers to closing AOC client #2

If we want to be selling this to a second client by June, here is the actual punch list:

**This week**
- [ ] Get Slack bot token from Kody → wire the remaining n8n workflows. Without this, the client doesn't see real-time pings in their own Slack, which is the second-loudest demo moment after the dashboard itself.
- [ ] Saad: confirm Campaign column will be added to the sheet for all new campaigns (Banks + Construction tiers + Tourist + Schools + Museum donors + Acquisitions). The sync already auto-detects it.
- [ ] Mike + Kody: finalize payout rules — at minimum, a written rule for one campaign. The calc runs; the UI is hidden behind a feature flag. Ship it for one campaign and learn.
- [ ] Add "last synced" timestamp + Slack alert if no sync >15 min. 1-hour build.
- [ ] Configure proper SPF/DKIM on the Supabase Auth sender (or switch to Resend/Postmark). Critical for the next client's signup flow.

**Next 2 weeks**
- [ ] Write the McKenzie case study (1-page PDF + landing page) with the real dashboard screenshot. This is the single highest-leverage piece of GTM content we can produce right now.
- [ ] Build the new-client provisioning script — one command that scaffolds a fresh Supabase + Vercel + brand-tokens + GH Actions cron for a new tenant. Without this, every new client is a 3-day eng project.
- [ ] Instrument activation metrics in a separate analytics table (logins, status changes, drawer opens). 1-day build.
- [ ] Add a "Settlement preview" PDF export to the dashboard. This becomes the monthly invoice attachment.

**Before pilot #2 kickoff**
- [ ] Document the onboarding playbook (section 6 above) as a runbook in Notion.
- [ ] Pre-write the MSA + SoW + payout addendum so legal isn't the bottleneck.
- [ ] Stand up a status page (status.modern-amenities.com or similar) covering the lead-tracker domain.

## 11. Distribution channels

In rough order of expected efficiency for client #2 through #5:

1. **MA founder's direct network.** Highest-trust, fastest. The next 2–3 clients should come from here.
2. **McKenzie referral.** Once the dashboard shows real revenue, ask Mike for one warm intro. One referral from a happy AOC client is worth 20 cold outbound replies.
3. **LinkedIn long-form from MA principal.** "Here's the dashboard we built for one of our AOC clients. Here's why agencies don't usually let you see this." Concrete artifact + opinion = engagement.
4. **Targeted outbound — but only to ICP-fit profiles.** Use the Apollo/Clay setup we already have. 50 hand-picked $5M–$50M B2B founders, sequenced personally, NOT a 5000-contact blast.
5. **Partner / community plays.** EOS Worldwide implementers, Vistage/YPO chairs, fractional-CMO networks — they all sit next to our ICP and refer for cost.

**Channels to ignore (for now)**
- SEO / content marketing. Too slow given our buyer behavior.
- Paid LinkedIn ads. Wrong unit economics at this deal size.
- Trade shows. Not until client #5+.

## 12. 90-day GTM plan

**Days 1–14 (May 13 – May 27)**
- Close the McKenzie operational punch list (Slack token, Campaign column, payout rules, sync alerts, email deliverability).
- Ship the McKenzie case study.
- Hand-pick 25 ICP-fit prospects in the principal's network for soft outreach.

**Days 15–45 (May 28 – Jun 27)**
- First three discovery calls with prospects from the warm list.
- One pilot signed (target).
- Build the new-tenant provisioning script.
- Activation metrics live for McKenzie.

**Days 46–90 (Jun 28 – Aug 10)**
- Pilot #1 live by mid-July; pilot #2 in market.
- McKenzie hits its first attributed close → first revenue line in the dashboard → first invoice with a performance-share line item. This is the moment the product becomes financially self-evident.
- Begin a quarterly newsletter to prospects with anonymized aggregate stats.

**90-day success criteria**
- ≥1 paying AOC client beyond McKenzie, on the three-line pricing structure.
- McKenzie generating attributed revenue in the dashboard, with a clean settlement.
- A repeatable onboarding playbook executed end-to-end at least once.
- Zero settlement disputes.

## 13. The one thing to remember

The dashboard is not the product. The dashboard is the **evidence**. Modern Amenities is selling a service whose biggest objection has always been *"how do I know what you actually did for me?"* — and the dashboard is the answer. Every GTM decision from here should be evaluated against whether it makes that answer more credible, faster, to more of the right buyers.

If it doesn't, it's a distraction.
