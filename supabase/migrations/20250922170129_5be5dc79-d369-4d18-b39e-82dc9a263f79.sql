-- ========== ENUMS ==========
create type public.user_role as enum ('owner', 'staff');
create type public.payment_method as enum ('cash', 'card', 'transfer', 'other');
create type public.stock_movement_type as enum ('purchase', 'sale', 'adjustment', 'return_in', 'return_out');
create type public.expense_category as enum (
  'rent','utilities','marketing','fees','wages','repairs','other'
);

-- ========== FIX EXISTING PROFILES TABLE ==========
-- First remove default, then alter type, then set new default
alter table public.profiles 
  drop column if exists first_name,
  drop column if exists last_name,
  add column if not exists full_name text,
  alter column role drop default,
  alter column role type public.user_role using role::public.user_role,
  alter column role set default 'staff'::public.user_role;

-- Update the trigger function to work with new schema
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, role, full_name)
  values (
    new.id,
    new.email,
    case 
      when new.email in ('owner@lostintime.com', 'admin@lostintime.com') then 'owner'::public.user_role
      else 'staff'::public.user_role
    end,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Helper role predicate functions
create or replace function public.is_owner(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = uid and p.role = 'owner');
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = uid and p.role in ('owner','staff'));
$$;

-- ========== SUPPLIERS ==========
create table if not exists public.suppliers (
  id bigserial primary key,
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists suppliers_name_idx on public.suppliers using gin (to_tsvector('simple', name));

-- ========== PRODUCTS ==========
create table if not exists public.products (
  id bigserial primary key,
  sku text unique,
  name text not null,
  description text,
  category text,
  metal text,
  karat text,
  gemstone text,
  supplier_id bigint references public.suppliers(id) on delete set null,
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  track_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(sku,'')));

-- ========== SALES ==========
create table if not exists public.sales (
  id bigserial primary key,
  sold_at timestamptz not null default now(),
  staff_id uuid references public.profiles(user_id) on delete set null,
  payment public.payment_method not null default 'cash',
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text
);

create index if not exists sales_sold_at_idx on public.sales (sold_at desc);
create index if not exists sales_staff_idx on public.sales (staff_id);

-- ========== SALE ITEMS ==========
create table if not exists public.sale_items (
  id bigserial primary key,
  sale_id bigint not null references public.sales(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null,
  tax_rate numeric(5,2) not null default 0,
  discount numeric(12,2) not null default 0
);

create index if not exists sale_items_sale_idx on public.sale_items (sale_id);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

-- ========== EXPENSES ==========
create table if not exists public.expenses (
  id bigserial primary key,
  incurred_at timestamptz not null default now(),
  category public.expense_category not null default 'other',
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  staff_id uuid references public.profiles(user_id) on delete set null,
  supplier_id bigint references public.suppliers(id) on delete set null,
  is_cogs boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists expenses_incurred_at_idx on public.expenses (incurred_at desc);

-- ========== STOCK MOVEMENTS ==========
create table if not exists public.stock_movements (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity integer not null,
  unit_cost numeric(12,2),
  related_sale_id bigint references public.sales(id) on delete set null,
  supplier_id bigint references public.suppliers(id) on delete set null,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(user_id) on delete set null,
  check (quantity <> 0)
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id);
create index if not exists stock_movements_occurred_at_idx on public.stock_movements (occurred_at desc);