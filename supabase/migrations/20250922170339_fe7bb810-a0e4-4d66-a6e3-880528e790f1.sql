-- ========== BUSINESS TABLES ==========

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id bigserial primary key,
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS suppliers_name_idx ON public.suppliers USING gin (to_tsvector('simple', name));

-- PRODUCTS  
CREATE TABLE IF NOT EXISTS public.products (
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

CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(sku,'')));

-- SALES
CREATE TABLE IF NOT EXISTS public.sales (
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

CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON public.sales (sold_at desc);
CREATE INDEX IF NOT EXISTS sales_staff_idx ON public.sales (staff_id);

-- SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id bigserial primary key,
  sale_id bigint not null references public.sales(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null,
  tax_rate numeric(5,2) not null default 0,
  discount numeric(12,2) not null default 0
);

CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_idx ON public.sale_items (product_id);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
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

CREATE INDEX IF NOT EXISTS expenses_incurred_at_idx ON public.expenses (incurred_at desc);

-- STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
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

CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS stock_movements_occurred_at_idx ON public.stock_movements (occurred_at desc);