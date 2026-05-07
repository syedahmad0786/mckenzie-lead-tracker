-- =====================================================================
-- McKenzie Lead Tracker — Ensure profiles + RLS + auth trigger
-- Apply via: Supabase dashboard → SQL Editor → paste + Run
-- This is a minimal, idempotent repair. Safe to re-run.
-- =====================================================================

-- 1) Create user_role enum if missing
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('agency_admin', 'client_member', 'aoc_admin');
  end if;
end $$;

-- 2) Create profiles table (no-op if it already exists)
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  display_name text,
  role         public.user_role not null default 'client_member',
  client_id    text references public.clients(id) on delete set null,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = user_id);

-- 3) Auth trigger that auto-creates the profile on signup with sensible role assignment
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  domain text := lower(split_part(new.email, '@', 2));
  default_role public.user_role;
begin
  if domain in ('modern-amenities.com', 'modernamenities.com') then
    default_role := 'agency_admin';
  else
    default_role := 'client_member';
  end if;

  insert into public.profiles (user_id, email, display_name, role, client_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    default_role,
    'mckenzie'
  )
  on conflict (user_id) do update
    set role      = excluded.role,
        client_id = excluded.client_id;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Backfill any existing auth.users that don't have a profile yet
insert into public.profiles (user_id, email, display_name, role, client_id)
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
       case when lower(split_part(u.email, '@', 2)) in ('modern-amenities.com','modernamenities.com')
            then 'agency_admin'::public.user_role
            else 'client_member'::public.user_role end,
       'mckenzie'
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);

-- 5) Helper functions used by RLS policies elsewhere
create or replace function public.current_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_client_id() returns text
language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where user_id = auth.uid()
$$;

-- 6) Allow agency_admin to update clients
drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients for update
  using (public.current_role() in ('agency_admin','aoc_admin'));

-- 7) Reload PostgREST schema cache so the new tables are queryable via REST
notify pgrst, 'reload schema';
