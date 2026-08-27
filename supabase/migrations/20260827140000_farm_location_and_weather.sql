-- Farm location + shared weather forecast cache.
--
-- Two things happen here:
--   1. `public.profiles` gains the coordinates and district a farmer picks
--      during post-login onboarding, which is what every weather lookup keys off.
--   2. `public.weather_forecasts` becomes a district-level day cache so repeat
--      opens for the same area do not hit the upstream forecast API again.

alter table public.profiles
  add column if not exists district text,
  add column if not exists latitude numeric(8, 5),
  add column if not exists longitude numeric(8, 5),
  add column if not exists location_source text,
  add column if not exists location_updated_at timestamptz;

comment on column public.profiles.district is
  'District id from the app''s bundled district list, e.g. multan.';
comment on column public.profiles.location_source is
  'How the coordinates were obtained: gps (device), manual (district picker) or default (farmer skipped both).';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_latitude_range'
  ) then
    alter table public.profiles
      add constraint profiles_latitude_range check (
        latitude is null or (latitude >= -90 and latitude <= 90)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_longitude_range'
  ) then
    alter table public.profiles
      add constraint profiles_longitude_range check (
        longitude is null or (longitude >= -180 and longitude <= 180)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_location_source_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_location_source_allowed check (
        location_source is null
        or location_source in ('gps', 'manual', 'default')
      );
  end if;
end;
$$;

-- One row per district per forecast day. Rows are shared by every farmer in
-- that district, so a single fetch warms the cache for all of them.
create table if not exists public.weather_forecasts (
  district text not null,
  forecast_date date not null,
  latitude numeric(8, 5) not null,
  longitude numeric(8, 5) not null,
  weather_code smallint not null,
  temp_max_c numeric(4, 1) not null,
  temp_min_c numeric(4, 1) not null,
  precipitation_mm numeric(5, 1) not null default 0,
  precipitation_chance smallint,
  wind_max_kph numeric(5, 1),
  -- Live observation, only written on the row for the current day.
  observed_temp_c numeric(4, 1),
  observed_humidity smallint,
  observed_wind_kph numeric(5, 1),
  observed_weather_code smallint,
  observed_at timestamptz,
  fetched_at timestamptz not null default now(),
  primary key (district, forecast_date)
);

comment on table public.weather_forecasts is
  'Shared district-level forecast cache. Readable by any signed-in farmer; written only through public.cache_weather_forecast().';
comment on column public.weather_forecasts.fetched_at is
  'When this row was last refreshed from the upstream forecast API. Clients treat older rows as stale.';

-- Lookups are always "this district, from today onwards", which the primary
-- key on (district, forecast_date) already serves.
alter table public.weather_forecasts enable row level security;

-- Weather is not private data, so any signed-in farmer may read the whole
-- cache. There is deliberately no insert or update policy: writes go through
-- the validating function below.
drop policy if exists "weather_forecasts_select_all" on public.weather_forecasts;
create policy "weather_forecasts_select_all"
  on public.weather_forecasts
  for select
  to authenticated
  using (true);

-- Clients fetch the forecast themselves and hand it back here to warm the
-- cache. Values are range-checked so one bad client cannot store readings that
-- would render as nonsense for everyone else in the district.
create or replace function public.cache_weather_forecast(
  p_district text,
  p_latitude numeric,
  p_longitude numeric,
  p_days jsonb,
  p_observation jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_entry jsonb;
  day_date date;
  live_observation jsonb;
  observation jsonb;
begin
  if p_district is null or p_district !~ '^[a-z][a-z0-9-]{1,48}$' then
    raise exception 'invalid district: %', p_district;
  end if;

  if p_latitude is null or p_latitude < -90 or p_latitude > 90
    or p_longitude is null or p_longitude < -180 or p_longitude > 180 then
    raise exception 'invalid coordinates';
  end if;

  if p_days is null or jsonb_typeof(p_days) <> 'array'
    or jsonb_array_length(p_days) > 10 then
    raise exception 'days must be an array of at most 10 entries';
  end if;

  live_observation := case
    when p_observation is null then null
    when coalesce(nullif(p_observation ->> 'temp_c', '')::numeric, 999)
      not between -40 and 60 then null
    when coalesce(nullif(p_observation ->> 'weather_code', '')::int, -1)
      not between 0 and 99 then null
    when coalesce(nullif(p_observation ->> 'humidity', '')::int, 0)
      not between 0 and 100 then null
    when coalesce(nullif(p_observation ->> 'wind_kph', '')::numeric, 0)
      not between 0 and 300 then null
    else p_observation
  end;

  for day_entry in select * from jsonb_array_elements(p_days)
  loop
    day_date := nullif(day_entry ->> 'forecast_date', '')::date;

    -- Skip anything a client could not plausibly have just fetched, and any
    -- reading outside a sane range for Pakistan. A bad day is dropped rather
    -- than failing the whole call, so the good days still land.
    continue when day_date is null
      or day_date < current_date - 1
      or day_date > current_date + 10
      or coalesce(nullif(day_entry ->> 'weather_code', '')::int, -1) not between 0 and 99
      or coalesce(nullif(day_entry ->> 'temp_max_c', '')::numeric, 999) not between -40 and 60
      or coalesce(nullif(day_entry ->> 'temp_min_c', '')::numeric, 999) not between -40 and 60
      or coalesce(nullif(day_entry ->> 'precipitation_mm', '')::numeric, 0) not between 0 and 500
      or coalesce(nullif(day_entry ->> 'precipitation_chance', '')::int, 0) not between 0 and 100
      or coalesce(nullif(day_entry ->> 'wind_max_kph', '')::numeric, 0) not between 0 and 300;

    -- The observation belongs to today only; older cached days keep theirs.
    observation := case
      when live_observation is not null and day_date = current_date
      then live_observation
      else null
    end;

    insert into public.weather_forecasts as w (
      district,
      forecast_date,
      latitude,
      longitude,
      weather_code,
      temp_max_c,
      temp_min_c,
      precipitation_mm,
      precipitation_chance,
      wind_max_kph,
      observed_temp_c,
      observed_humidity,
      observed_wind_kph,
      observed_weather_code,
      observed_at,
      fetched_at
    )
    values (
      p_district,
      day_date,
      p_latitude,
      p_longitude,
      (day_entry ->> 'weather_code')::smallint,
      (day_entry ->> 'temp_max_c')::numeric,
      (day_entry ->> 'temp_min_c')::numeric,
      coalesce((day_entry ->> 'precipitation_mm')::numeric, 0),
      nullif(day_entry ->> 'precipitation_chance', '')::smallint,
      nullif(day_entry ->> 'wind_max_kph', '')::numeric,
      nullif(observation ->> 'temp_c', '')::numeric,
      nullif(observation ->> 'humidity', '')::smallint,
      nullif(observation ->> 'wind_kph', '')::numeric,
      nullif(observation ->> 'weather_code', '')::smallint,
      case when observation is null then null else now() end,
      now()
    )
    on conflict (district, forecast_date) do update
    set
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      weather_code = excluded.weather_code,
      temp_max_c = excluded.temp_max_c,
      temp_min_c = excluded.temp_min_c,
      precipitation_mm = excluded.precipitation_mm,
      precipitation_chance = excluded.precipitation_chance,
      wind_max_kph = excluded.wind_max_kph,
      observed_temp_c = coalesce(excluded.observed_temp_c, w.observed_temp_c),
      observed_humidity = coalesce(excluded.observed_humidity, w.observed_humidity),
      observed_wind_kph = coalesce(excluded.observed_wind_kph, w.observed_wind_kph),
      observed_weather_code = coalesce(
        excluded.observed_weather_code,
        w.observed_weather_code
      ),
      observed_at = coalesce(excluded.observed_at, w.observed_at),
      fetched_at = excluded.fetched_at;
  end loop;
end;
$$;

revoke all on function public.cache_weather_forecast(
  text, numeric, numeric, jsonb, jsonb
) from public, anon;

grant execute on function public.cache_weather_forecast(
  text, numeric, numeric, jsonb, jsonb
) to authenticated;

-- Keeps the shared cache from growing without bound. Safe to call from a cron
-- job (pg_cron) or manually; nothing in the app depends on past days.
create or replace function private.purge_stale_weather_forecasts()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.weather_forecasts
  where forecast_date < current_date - 3;
$$;
