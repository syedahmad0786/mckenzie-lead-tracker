-- =====================================================================
-- McKenzie Lead Tracker — Phase 2 Supabase schema (deferred)
-- Apply only when migrating per phase-2-supabase/README.md.
-- Idempotent: drops + recreates in dependency order. Safe to re-run.
-- =====================================================================

drop view  if exists v_lead_with_client          cascade;
drop view  if exists v_kpi_scoreboard            cascade;
drop table if exists audit_log                   cascade;
drop table if exists leads                       cascade;
drop table if exists campaigns                   cascade;
drop table if exists clients                     cascade;
drop table if exists sync_runs                   cascade;
drop type  if exists lead_status                 cascade;
drop type  if exists user_role                   cascade;

create type lead_status as enum ('not_yet_closed', 'order_placed', 'lost');
create type user_role as enum ('agency_admin', 'client_member', 'aoc_admin');

create table clients (
  id              text primary key,
  name            text not null,
  logo_url        text,
  accent_color    text default '#00a7e0',
  payout_pct_first      numeric(5,4) default 0.15,
  payout_pct_subsequent numeric(5,4) default 0.0000,
  payout_visible        boolean      default false,
  attribution_window_days integer default 365,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

insert into clients (id, name, logo_url, accent_color) values
  ('mckenzie', 'McKenzie SewOn',
   'http://www.mcsewon.com/wp-content/uploads/2016/03/mcsewon-LogoBlack-350x71.png',
   '#00a7e0')
on conflict (id) do update
  set name = excluded.name, logo_url = excluded.logo_url, accent_color = excluded.accent_color, updated_at = now();

create table campaigns (
  id          text primary key,
  client_id   text not null references clients(id) on delete cascade,
  name        text not null,
  color       text,
  instantly_campaign_ids text[] default '{}',
  archived    boolean default false,
  created_at  timestamptz default now()
);

insert into campaigns (id, client_id, name) values
  ('tourist-gift-shop',     'mckenzie', 'Tourist Gift Shop'),
  ('museum-donors',         'mckenzie', 'Museum Donors'),
  ('acquisitions',          'mckenzie', 'Acquisitions'),
  ('construction',          'mckenzie', 'Construction'),
  ('banks-credit-unions',   'mckenzie', 'Banks & Credit Unions'),
  ('schools',               'mckenzie', 'Schools')
on conflict (id) do update set name = excluded.name;

create table leads (
  id                    uuid primary key default gen_random_uuid(),
  airtable_id           text unique,
  client_id             text not null references clients(id) on delete cascade,
  campaign_id           text references campaigns(id) on delete set null,
  email                 text not null,
  contact_name          text,
  company               text,
  phone                 text,
  date_introduced       date not null,
  status                lead_status not null default 'not_yet_closed',
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
  raw_typeform_payload          jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_leads_email      on leads (email);
create index idx_leads_client     on leads (client_id);
create index idx_leads_campaign   on leads (campaign_id);
create index idx_leads_status     on leads (status);
create index idx_leads_introduced on leads (date_introduced desc);

create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  user_email    text,
  user_role     user_role,
  field_changed text not null,
  old_value     text,
  new_value     text,
  changed_at    timestamptz default now()
);

create table sync_runs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  fetched         integer default 0,
  upserted        integer default 0,
  errors          integer default 0,
  duration_ms     integer,
  notes           text,
  ran_at          timestamptz default now()
);

create view v_lead_with_client as
select l.*, c.name as campaign_name, c.color as campaign_color,
       cl.name as client_name, cl.accent_color, cl.payout_pct_first, cl.payout_visible
from leads l
left join campaigns c on c.id = l.campaign_id
join clients cl on cl.id = l.client_id;

create view v_kpi_scoreboard as
select client_id,
       count(*)                                                         as leads_sent,
       count(*) filter (where status = 'order_placed')                  as orders_closed,
       coalesce(sum(first_order_amount) filter (where status = 'order_placed'), 0) as revenue_generated,
       coalesce(sum(payout_amount), 0)                                  as payout_owed
from leads
group by client_id;

alter table clients   enable row level security;
alter table campaigns enable row level security;
alter table leads     enable row level security;
alter table audit_log enable row level security;
