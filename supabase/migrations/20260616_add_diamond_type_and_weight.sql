-- Add diamond type (Natural / Lab) and weight to products
alter table public.products
  add column if not exists diamond_type text,
  add column if not exists weight text;

comment on column public.products.diamond_type is 'Diamond type: Natural or Lab';
comment on column public.products.weight is 'Stone/item weight (e.g. carats or grams)';
