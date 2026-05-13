# Deploy Runbook — Bug fixes + Invites + Activity Log

**Generated:** 2026-05-13
**Risk level:** Low. Pure additive changes + two UI fixes. Rolls back cleanly.

---

## What's changing in this drop

### Bug fixes (visible to users immediately on deploy)

- **Settings tab now routes to `/settings`.** Previously it was a bare `<a>` tag with no `href` — clicking did nothing.
- **User toggle is now a dropdown menu** with name+email, Settings link, and Sign out. Previously, clicking the user pill instantly signed you out, then redirected to `http://localhost:3000/login` (because `NEXT_PUBLIC_APP_URL` wasn't set on Vercel), which looked like a crash.
- **`/api/auth/signout` redirect now derives from `req.url`** instead of an env var, so it works without `NEXT_PUBLIC_APP_URL` being set.
- **Deleted dead `/auth/callback/route.ts`** that was parallel to `page.tsx` and would block future local builds.

### New features

- **Invite colleagues from Settings → Users & roles.** Email + name + role → magic-link invite. Lists current users with role + last-active. Role can be changed inline, users can be removed.
- **General-purpose activity log.** Every re-sync, settings change, lead update, sign-out, and invite is now recorded with user, IP, user-agent, and metadata in a new `activity_log` table.
- **Auto-triggers on `clients` and `campaigns`** capture every row-level change at the DB level (cannot be bypassed by an API call).
- **`v_user_last_activity` view** powers the Users & roles panel — joins profiles with their most recent activity_log timestamp.

### Files added

```
supabase/005_activity_log.sql                       ← NEW migration
src/lib/activity.ts                                 ← NEW helper
src/app/api/admin/invite/route.ts                   ← NEW endpoint
src/app/api/admin/users/route.ts                    ← NEW endpoint (GET / PATCH / DELETE)
```

### Files modified

```
src/app/page.tsx                                    ← Settings Link, user dropdown
src/app/settings/page.tsx                           ← Real Users & roles panel
src/app/api/auth/signout/route.ts                   ← request-based redirect + JSON support + activity log
src/app/api/leads/update/route.ts                   ← activity log
src/app/api/settings/client/route.ts                ← activity log
```

### Files deleted (renamed to `.bak`)

```
src/app/auth/callback/route.ts → src/app/auth/callback/_legacy_route.ts.bak
```

---

## Deployment steps

### 1. Push code to GitHub (~30 sec)

From your local clone of `mckenzie-lead-tracker`:

```bash
# Sync the workspace files into your clone — adjust paths if your local repo lives elsewhere
WORKSPACE=/path/to/mckenzie-lead-tracker      # this workspace folder
LOCAL=/path/to/your/local/clone

rsync -av --exclude=node_modules --exclude=.next --exclude=.git "$WORKSPACE/" "$LOCAL/"

cd "$LOCAL"
git status                                     # review the diff
git add -A
git commit -m "fix(ui): settings link + user dropdown; feat: invites + activity log"
git push origin main
```

Vercel will pick up the push and deploy automatically. Watch the build at
`https://vercel.com/<your-team>/mckenzie-lead-tracker/deployments`.
Expected build time: ~45–70 seconds.

### 2. Run the Supabase migration (~10 sec)

The new code expects an `activity_log` table and a `v_user_last_activity` view.
The Users panel will run in **degraded mode** until you do this — you'll see a banner saying so, and `last_activity_at` will be missing.

1. Open Supabase Dashboard → SQL Editor → New query
2. Paste the contents of `supabase/005_activity_log.sql`
3. Click **Run**
4. Verify in the success message: `activity_log`, `v_user_last_activity`, triggers `trg_clients_activity` + `trg_campaigns_activity` should all be created

### 3. Smoke test (~3 min)

After Vercel reports deploy succeeded:

1. Open `https://mckenzie-lead-tracker.vercel.app/` → sign in
2. Top right: click your name → dropdown should appear with **Settings** + **Sign out**. Both should work.
3. Click **Settings** in the top nav → should land you on `/settings`
4. In Settings, click **Users & roles** in the left sidebar:
   - Should see one user (you), with role + join date + last activity
   - Invite form should render at the top
5. Send yourself an invite to a second email address you control to verify the magic-link flow end-to-end. (Use a domain other than `@modern-amenities.com` to also verify the role is correctly auto-assigned as `client_member`.)
6. Open the email, click the link → should land on `/auth/callback` → auto-redirect to dashboard signed in as the new user.
7. In Supabase Dashboard → Table Editor → `activity_log`, scroll to top: you should see rows for `invite.sent`, `auth.signin`, and any other actions you took.

### 4. Rollback (if anything goes wrong)

Pure code changes:
```bash
cd "$LOCAL" && git revert HEAD && git push origin main
```

SQL migration: the new table is additive. Nothing existing depends on it, so leaving it in place after a code revert is safe. If you DO want to remove it:

```sql
drop view if exists public.v_user_last_activity;
drop trigger if exists trg_clients_activity on public.clients;
drop trigger if exists trg_campaigns_activity on public.campaigns;
drop function if exists public.log_clients_change();
drop function if exists public.log_campaigns_change();
drop table if exists public.activity_log;
notify pgrst, 'reload schema';
```

---

## What to do next (recommended, not blocking)

### Email deliverability (before inviting clients)

Today's invites go through Supabase's default sender. For internal MA testing this is fine; for client invites you want SPF/DKIM-aligned email so verification links don't land in spam.

The cheapest path:
1. Sign up for Resend (https://resend.com) — free tier covers 3K/month
2. Verify the `modern-amenities.com` domain (TXT + DKIM records on your DNS)
3. In Supabase Dashboard → Project Settings → Authentication → Email Templates → SMTP Settings, plug in Resend's SMTP credentials
4. Send a test invite. The email should now come from `noreply@modern-amenities.com` with a green "DKIM verified" badge in Gmail.

Time: ~30 minutes including DNS propagation.

### Slack notifications for invites and sign-ins

Once Kody provides the Slack bot token, add to `activity.ts` a side-effect that
pings `#mckenzie-leads` (or wherever) for `invite.sent`, `auth.signin`, and
`settings.update` events. Single fetch call to a Slack webhook; no new infra.

### Last-synced indicator on the dashboard

The dashboard doesn't currently surface "last sync time". Mentioned in the GTM
analysis as a 1-hour build. With the activity log live, the data is now there:
just query `activity_log where action = 'sync.run' or action = 'sync.cron'
order by created_at desc limit 1` and render in the footer.

---

## Reference: what's logged where

| Event | Where it's recorded | Notes |
|---|---|---|
| Lead status / amount / notes change | `audit_log` (existing) | DB trigger, can't be bypassed |
| Lead view (drawer open) | not yet logged | Add a `logActivity` call in `/api/leads/[id]/audit/route.ts` if needed |
| Re-sync (button or cron) | `activity_log` action `sync.run` / `sync.cron` | Wired in the sheet-sync route on production |
| Settings change | `activity_log` action `settings.update` + DB trigger `trg_clients_activity` | Both layers — API view + row-level diff |
| Invite sent | `activity_log` action `invite.sent` | |
| Role change | `activity_log` action `user.role_change` | |
| User removed | `activity_log` action `user.delete` | The auth.users row is gone but the log row persists |
| Sign in | Supabase's `auth.audit_log_entries` table | Visible in Supabase Dashboard → Auth → Audit Logs |
| Sign out | `activity_log` action `auth.signout` | |
| Failed login | Supabase's `auth.audit_log_entries` only | Surface in UI if needed later |
