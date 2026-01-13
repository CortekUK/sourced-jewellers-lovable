-- 1) Internal SKU (auto)
create sequence if not exists product_sku_seq;

alter table public.products
  add column if not exists internal_sku text,
  add column if not exists track_serial boolean not null default false;

-- Drop external SKU uniqueness (keep searchable but optional)
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name='products' and constraint_name='products_sku_key'
  ) then
    alter table public.products drop constraint products_sku_key;
  end if;
end $$;

create index if not exists products_sku_idx on public.products (sku);

-- Backfill internal_sku for existing rows
update public.products
set internal_sku = 'LIT-' || lpad(nextval('product_sku_seq')::text, 5, '0')
where internal_sku is null;

-- Enforce uniqueness + not null
alter table public.products alter column internal_sku set not null;
create unique index if not exists products_internal_sku_key on public.products (internal_sku);

-- Auto-fill internal_sku on insert
create or replace function public.gen_internal_sku()
returns trigger language plpgsql as $$
begin
  if new.internal_sku is null then
    new.internal_sku := 'LIT-' || lpad(nextval('product_sku_seq')::text, 5, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_products_gen_sku on public.products;
create trigger trg_products_gen_sku
before insert on public.products
for each row execute function public.gen_internal_sku();

-- 2) Serial numbers (simple)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'serial_status') then
    create type public.serial_status as enum ('in_stock','sold','returned','lost');
  end if;
end $$;

create table if not exists public.serial_numbers (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  serial text not null unique,
  status public.serial_status not null default 'in_stock',
  sale_item_id bigint references public.sale_items(id) on delete set null,
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

create index if not exists serial_numbers_product_idx on public.serial_numbers (product_id);
create index if not exists serial_numbers_status_idx on public.serial_numbers (status);

-- Auto-set sold_at when status changes to 'sold'
create or replace function public.set_serial_sold_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold' and (old.status is distinct from 'sold') then
    new.sold_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_serial_sold_at on public.serial_numbers;
create trigger trg_serial_sold_at
before update on public.serial_numbers
for each row execute function public.set_serial_sold_at();

-- RLS
alter table public.serial_numbers enable row level security;

create policy "serials read (staff+owner)" on public.serial_numbers
for select using (public.is_staff(auth.uid()));

create policy "serials insert (staff+owner)" on public.serial_numbers
for insert with check (public.is_staff(auth.uid()));

create policy "serials update (staff+owner)" on public.serial_numbers
for update using (public.is_staff(auth.uid()));

create policy "serials delete (owner only)" on public.serial_numbers
for delete using (public.is_owner(auth.uid()));