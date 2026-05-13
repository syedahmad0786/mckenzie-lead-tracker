-- =====================================================================
-- McKenzie Lead Tracker — General-purpose activity log
-- Apply via: Supabase dashboard → SQL Editor → paste + Run
-- Idempotent. Safe to re-run.
--
-- Captures every action across the app that isn't already covered by
-- the lead-level audit_log (which keeps recording status / amount / notes
-- changes). This table answers questions like "who triggered the last
-- re-sync", "who changed the payout %", or "when did Lauren first sign in".
-- =====================================================================

-- 1) Table -------------------------------------------------------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  user_role   text,
  client_id   text references public.clients(id) on delete set null,
  action      text not null,                  -- e.g. 'sync.run', 'lead.view', 'settings.update', 'invite.sent'
  target_type text,                            -- e.g. 'lead', 'client', 'campaign', 'user'
  target_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_user      on public.activity_log (user_id, created_at desc);
create index if not exists idx_activity_action    on public.activity_log (action, created_at desc);
create index if not exists idx_activity_client    on public.activity_log (client_id, created_at desc);
create index if not exists idx_activity_target    on public.activity_log (target_type, target_id);

-- 2) RLS ---------------------------------------------------------------------
alter table public.activity_log enable row level security;

drop policy if exists "activity_read_admin"  on public.activity_log;
drop policy if exists "activity_read_self"   on public.activity_log;
drop policy if exists "activity_insert_any"  on public.activity_log;

-- agency_admin / aoc_admin can read everything for their client(s)
create policy "activity_read_admin" on public.activity_log for select
  using (
    public.current_role() in ('agency_admin', 'aoc_admin')
    and (client_id is null or client_id = public.current_client_id() or public.current_role() = 'aoc_admin')
  );

-- regular users can read their own activity
create policy "activity_read_self" on public.activity_log for select
  using (user_id = auth.uid());

-- any authenticated user can insert their own activity rows
create policy "activity_insert_any" on public.activity_log for insert
  with check (user_id is null or user_id = auth.uid());

-- 3) Triggers — auto-log settings + campaign edits ---------------------------
create or replace function public.log_clients_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  uemail text := nullif(current_setting('request.jwt.claim.email', true), '');
begin
  insert into public.activity_log (user_id, user_email, client_id, action, target_type, target_id, metadata)
  values (
    uid, uemail, NEW.id,
    'client.update', 'client', NEW.id,
    jsonb_build_object(
      'changed_fields',
      (select jsonb_object_agg(k, jsonb_build_object('old', old_v, 'new', new_v))
       from (
         select 'name'             as k, to_jsonb(OLD.name)             as old_v, to_jsonb(NEW.name)             as new_v where OLD.name             is distinct from NEW.name
         union all
         select 'accent_color',         to_jsonb(OLD.accent_color),         to_jsonb(NEW.accent_color)         where OLD.accent_color         is distinct from NEW.accent_color
         union all
         select 'logo_url',             to_jsonb(OLD.logo_url),             to_jsonb(NEW.logo_url)             where OLD.logo_url             is distinct from NEW.logo_url
         union all
         select 'payout_pct_first',     to_jsonb(OLD.payout_pct_first),     to_jsonb(NEW.payout_pct_first)     where OLD.payout_pct_first     is distinct from NEW.payout_pct_first
         union all
         select 'payout_visible',       to_jsonb(OLD.payout_visible),       to_jsonb(NEW.payout_visible)       where OLD.payout_visible       is distinct from NEW.payout_visible
       ) diffs)
    )
  );
  return NEW;
end $$;

drop trigger if exists trg_clients_activity on public.clients;
create trigger trg_clients_activity
  after update on public.clients
  for each row execute function public.log_clients_change();

create or replace function public.log_campaigns_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  uemail text := nullif(current_setting('request.jwt.claim.email', true), '');
begin
  insert into public.activity_log (user_id, user_email, client_id, action, target_type, target_id, metadata)
  values (
    uid, uemail,
    coalesce(NEW.client_id, OLD.client_id),
    case TG_OP
      when 'INSERT' then 'campaign.create'
      when 'UPDATE' then 'campaign.update'
      when 'DELETE' then 'campaign.delete'
    end,
    'campaign',
    coalesce(NEW.id, OLD.id),
    case TG_OP
      when 'INSERT' then to_jsonb(NEW)
      when 'DELETE' then to_jsonb(OLD)
      else jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
    end
  );
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_campaigns_activity on public.campaigns;
create trigger trg_campaigns_activity
  after insert or update or delete on public.campaigns
  for each row execute function public.log_campaigns_change();

-- 4) Roll-up view: last activity per user (handy for the Users & roles panel)
create or replace view public.v_user_last_activity as
select p.user_id,
       p.email,
       p.display_name,
       p.role,
       p.client_id,
       p.created_at as profile_created_at,
       max(a.created_at) as last_activity_at,
       count(a.id) as total_actions
from public.profiles p
left join public.activity_log a on a.user_id = p.user_id
group by p.user_id, p.email, p.display_name, p.role, p.client_id, p.created_at;

alter view public.v_user_last_activity set (security_invoker = true);

-- 5) Reload PostgREST schema cache
notify pgrst, 'reload schema';
