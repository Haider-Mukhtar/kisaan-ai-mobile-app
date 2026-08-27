-- Phone-based farmer profiles.
--
-- `public.profiles` is the app-facing user record, keyed 1:1 to `auth.users`.
-- Rows are created by a trigger on signup so a profile always exists for a
-- session, and the farmer fills in the remaining fields during post-login
-- onboarding.

create schema if not exists private;

revoke all on schema private from anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text,
  village text,
  farm_size_acres numeric(6, 2),
  crops text[] not null default '{}',
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_e164_pk check (phone ~ '^\+923(?:[0-4][0-9]|55)[0-9]{7}$'),
  constraint profiles_farm_size_positive check (
    farm_size_acres is null or farm_size_acres > 0
  )
);

comment on table public.profiles is
  'Farmer records keyed to auth.users. Phone is stored in E.164 (+92XXXXXXXXXX).';
comment on column public.profiles.profile_completed_at is
  'Set when post-login onboarding is finished; null means onboarding is pending.';

alter table public.profiles enable row level security;

-- Each farmer reads and writes only their own row. auth.uid() is wrapped in a
-- subselect so Postgres evaluates it once per statement instead of per row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- UPDATE needs a matching SELECT policy (above) or it silently affects 0 rows.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Seed a profile as soon as the auth user exists. The phone arrives via signup
-- metadata; if it is missing we skip the insert rather than fail the signup,
-- and the client's ensureProfile() upsert becomes the fallback.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_phone text;
begin
  new_phone := coalesce(
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.phone
  );

  if new_phone is null then
    return new;
  end if;

  insert into public.profiles (id, phone)
  values (new.id, new_phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function private.touch_updated_at();
