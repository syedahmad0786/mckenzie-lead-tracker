-- =====================================================================
-- McKenzie Lead Tracker — Supabase schema (Phase 2)
-- Apply via: Supabase dashboard → SQL Editor → paste + Run
-- Idempotent: safe to re-run.
--
-- Adds on top of the Phase 1 model:
--   • profiles table linked to auth.users (Supabase Auth)
--   • audit_log fed by AFTER UPDATE trigger
--   • RLS policies (agency_admin sees all, client_member sees only their client_id)
-- =====================================================================

-- 1) Drop in dependency order ------------------------------------------------
drop trigger  if exists trg_leads_audit on public.leads;
drop function if exists public.audit_lead_change cascade;

drop view  if exists public.v_lead_with_client cascade;
drop view  if exists public.v_kpi_scoreboard cascade;
drop table if exists public.audit_log         cascade;
drop table if exists public.leads             cascade;
drop table if exists public.campaigns         cascade;
drop table if exists public.clients           cascade;
drop table if exists public.profiles          cascade;
drop type  if exists public.lead_status       cascade;
drop type  if exists public.user_role         cascade;

create type public.lead_status as enum ('not_yet_closed', 'order_placed', 'lost');
create type public.user_role   as enum ('agency_admin', 'client_member', 'aoc_admin');

-- 2) clients ----------------------------------------------------------------
create table public.clients (
  id              text primary key,
  name            text not null,
  logo_url        text,
  accent_color    text default '#0F766E',
  payout_pct_first      numeric(5,4) default 0.15,
  payout_pct_subsequent numeric(5,4) default 0.0000,
  payout_visible        boolean      default false,
  attribution_window_days integer default 365,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

insert into public.clients (id, name, logo_url, accent_color)
values ('mckenzie', 'McKenzie SewOn',
        'http://www.mcsewon.com/wp-content/uploads/2016/03/mcsewon-LogoBlack-350x71.png',
        '#00a7e0')
on conflict (id) do nothing;

-- 3) campaigns --------------------------------------------------------------
create table public.campaigns (
  id          text primary key,
  client_id   text not null references public.clients(id) on delete cascade,
  name        text not null,
  color       text,
  archived    boolean default false,
  created_at  timestamptz default now()
);

insert into public.campaigns (id, client_id, name) values
  ('tourist-gift-shop',     'mckenzie', 'Tourist Gift Shop'),
  ('museum-donors',         'mckenzie', 'Museum Donors'),
  ('acquisitions',          'mckenzie', 'Acquisitions'),
  ('construction',          'mckenzie', 'Construction'),
  ('banks-credit-unions',   'mckenzie', 'Banks & Credit Unions'),
  ('schools',               'mckenzie', 'Schools')
on conflict (id) do nothing;

-- 4) profiles (linked to Supabase Auth) -------------------------------------
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  display_name text,
  role        public.user_role not null default 'client_member',
  client_id   text references public.clients(id) on delete set null,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) leads ------------------------------------------------------------------
create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  airtable_id           text unique,
  client_id             text not null references public.clients(id) on delete cascade,
  campaign_id           text references public.campaigns(id) on delete set null,
  email                 text not null,
  contact_name          text,
  company               text,
  phone                 text,
  date_introduced       date not null default current_date,
  status                public.lead_status not null default 'not_yet_closed',
  date_first_order      date,
  first_order_amount    numeric(12,2),
  currency              text default 'USD',
  notes                 text,
  payout_amount         numeric(12,2) generated always as (
    case when status = 'order_placed' and first_order_amount is not null
         then round(first_order_amount * 0.15, 2) else 0 end
  ) stored,
  source_instantly_campaign_id  text,
  source_typeform_response_id   text,
  raw_payload                   jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_leads_email      on public.leads (email);
create index idx_leads_client     on public.leads (client_id);
create index idx_leads_campaign   on public.leads (campaign_id);
create index idx_leads_status     on public.leads (status);
create index idx_leads_introduced on public.leads (date_introduced desc);

create or replace function public.bump_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_leads_bump
  before update on public.leads
  for each row execute function public.bump_updated_at();

-- 6) audit_log + trigger ----------------------------------------------------
create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  field_changed text not null,
  old_value     text,
  new_value     text,
  changed_at    timestamptz default now()
);

create index idx_audit_lead on public.audit_log (lead_id, changed_at desc);

create or replace function public.audit_lead_change() returns trigger
language plpgsql security definer as $$
declare
  uid uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  uemail text := nullif(current_setting('request.jwt.claim.email', true), '');
begin
  if NEW.status is distinct from OLD.status then
    insert into public.audit_log (lead_id, user_id, user_email, field_changed, old_value, new_value)
    values (NEW.id, uid, uemail, 'status', OLD.status::text, NEW.status::text);
  end if;
  if NEW.first_order_amount is distinct from OLD.first_order_amount then
    insert into public.audit_log (lead_id, user_id, user_email, field_changed, old_value, new_value)
    values (NEW.id, uid, uemail, 'first_order_amount', OLD.first_order_amount::text, NEW.first_order_amount::text);
  end if;
  if NEW.date_first_order is distinct from OLD.date_first_order then
    insert into public.audit_log (lead_id, user_id, user_email, field_changed, old_value, new_value)
    values (NEW.id, uid, uemail, 'date_first_order', OLD.date_first_order::text, NEW.date_first_order::text);
  end if;
  if NEW.notes is distinct from OLD.notes then
    insert into public.audit_log (lead_id, user_id, user_email, field_changed, old_value, new_value)
    values (NEW.id, uid, uemail, 'notes', OLD.notes, NEW.notes);
  end if;
  return NEW;
end $$;

create trigger trg_leads_audit
  after update on public.leads
  for each row execute function public.audit_lead_change();

-- 7) Views ------------------------------------------------------------------
create view public.v_lead_with_client as
select l.*,
       c.name as campaign_name,
       cl.name as client_name,
       cl.accent_color,
       cl.logo_url,
       cl.payout_pct_first,
       cl.payout_visible
from public.leads l
left join public.campaigns c on c.id = l.campaign_id
join public.clients cl on cl.id = l.client_id;

create view public.v_kpi_scoreboard as
select client_id,
       count(*)                                                                   as leads_sent,
       count(*) filter (where status = 'order_placed')                            as orders_closed,
       coalesce(sum(first_order_amount) filter (where status = 'order_placed'), 0) as revenue_generated,
       coalesce(sum(payout_amount), 0)                                            as payout_owed
from public.leads
group by client_id;

-- 8) RLS --------------------------------------------------------------------
alter table public.clients   enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads     enable row level security;
alter table public.audit_log enable row level security;
alter table public.profiles  enable row level security;

-- Authenticated users can read their own profile
create policy "profiles_self_read"
  on public.profiles for select using (auth.uid() = user_id);

-- Helper: who am I?
create or replace function public.current_role() returns public.user_role
language sql stable security definer as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_client_id() returns text
language sql stable security definer as $$
  select client_id from public.profiles where user_id = auth.uid()
$$;

-- agency_admin / aoc_admin see everything
-- client_member only sees rows for their client_id
create policy "leads_read"  on public.leads for select using (
  public.current_role() in ('agency_admin','aoc_admin')
  or client_id = public.current_client_id()
);
create policy "leads_write" on public.leads for update using (
  public.current_role() in ('agency_admin','aoc_admin')
  or (public.current_role() = 'client_member' and client_id = public.current_client_id())
);

create policy "campaigns_read" on public.campaigns for select using (
  public.current_role() in ('agency_admin','aoc_admin')
  or client_id = public.current_client_id()
);
create policy "clients_read"   on public.clients   for select using (
  public.current_role() in ('agency_admin','aoc_admin')
  or id = public.current_client_id()
);
create policy "audit_read"     on public.audit_log for select using (
  public.current_role() in ('agency_admin','aoc_admin')
  or exists (select 1 from public.leads l where l.id = audit_log.lead_id and l.client_id = public.current_client_id())
);
