-- =====================================================================
-- McKenzie Lead Tracker — GTM fixes
-- Apply via: Supabase dashboard → SQL Editor → paste + Run
-- =====================================================================

-- ============================================================
-- FIX #1: New signups need client_id + role auto-assignment
-- ============================================================
-- Default: anyone signing up with @modern-amenities.com or @mcsewon.com
-- gets the right role + client linkage so they SEE data immediately.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
declare
  domain text := lower(split_part(new.email, '@', 2));
  default_role public.user_role;
  default_client text;
begin
  if domain = 'modern-amenities.com' or domain = 'modernamenities.com' then
    default_role   := 'agency_admin';
    default_client := 'mckenzie';
  elsif domain = 'mcsewon.com' then
    default_role   := 'client_member';
    default_client := 'mckenzie';
  else
    default_role   := 'client_member';
    default_client := 'mckenzie';   -- single-tenant for now; swap to NULL when multi-client lands
  end if;

  insert into public.profiles (user_id, email, display_name, role, client_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    default_role,
    default_client
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

-- Backfill any existing auth.users that don't have a profile yet
insert into public.profiles (user_id, email, display_name, role, client_id)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
       case
         when lower(split_part(u.email,'@',2)) in ('modern-amenities.com','modernamenities.com') then 'agency_admin'::public.user_role
         else 'client_member'::public.user_role
       end,
       'mckenzie'
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

-- ============================================================
-- FIX #4: Settings save needs RLS policies for agency_admin
-- ============================================================
drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients for update
  using (public.current_role() in ('agency_admin','aoc_admin'));

drop policy if exists "campaigns_update" on public.campaigns;
create policy "campaigns_update" on public.campaigns for update
  using (public.current_role() in ('agency_admin','aoc_admin'));

drop policy if exists "campaigns_insert" on public.campaigns;
create policy "campaigns_insert" on public.campaigns for insert
  with check (public.current_role() in ('agency_admin','aoc_admin'));

-- ============================================================
-- FIX #8: View needs to honor RLS through the underlying tables
-- ============================================================
-- (Views inherit RLS from base tables when created with security_invoker = true)
alter view public.v_lead_with_client set (security_invoker = true);
alter view public.v_kpi_scoreboard   set (security_invoker = true);

-- ============================================================
-- Reload PostgREST schema cache so new tables / policies are visible
-- ============================================================
notify pgrst, 'reload schema';
