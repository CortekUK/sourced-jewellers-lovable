-- Per-location currency for the cash drawer (and other location-level money).
-- Dubai's till holds AED cash, so its drawer should display in AED. No
-- conversion — amounts are shown as stored.

alter table public.locations
  add column if not exists currency text not null default 'GBP';

alter table public.locations
  drop constraint if exists locations_currency_check;
alter table public.locations
  add constraint locations_currency_check check (currency in ('GBP', 'AED'));

update public.locations set currency = 'AED' where name = 'Dubai';
