-- City or town entered during the single-question profile onboarding.

alter table public.profiles
  add column if not exists city text;

comment on column public.profiles.city is
  'Farmer-entered city or nearest town; district remains the normalized weather location.';
