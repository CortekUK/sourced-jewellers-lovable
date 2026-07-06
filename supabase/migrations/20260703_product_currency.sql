-- Per-product currency (GBP or AED). No auto-conversion: the price is entered
-- and displayed in the product's own currency. Defaults to GBP for all existing
-- and new products so nothing changes until a product is set to AED.

alter table public.products
  add column if not exists currency text not null default 'GBP';

alter table public.products
  drop constraint if exists products_currency_check;
alter table public.products
  add constraint products_currency_check check (currency in ('GBP', 'AED'));
