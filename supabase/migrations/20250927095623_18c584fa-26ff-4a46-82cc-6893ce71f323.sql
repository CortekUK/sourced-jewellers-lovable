-- Enable trigram extension for fuzzy text search
create extension if not exists pg_trgm;

-- Create indexes for fast text search
-- PRODUCTS
create index if not exists products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists products_sku_trgm on public.products using gin (sku gin_trgm_ops);
create index if not exists products_internal_sku_trgm on public.products using gin (internal_sku gin_trgm_ops);
create index if not exists products_barcode_trgm on public.products using gin (barcode gin_trgm_ops);
create index if not exists products_category_trgm on public.products using gin (category gin_trgm_ops);
create index if not exists products_metal_trgm on public.products using gin (metal gin_trgm_ops);

-- SUPPLIERS
create index if not exists suppliers_name_trgm on public.suppliers using gin (name gin_trgm_ops);

-- SERIALS
create index if not exists serial_numbers_serial_trgm on public.serial_numbers using gin (serial gin_trgm_ops);

-- SALES
create index if not exists sales_id_idx on public.sales (id);
create index if not exists sales_sold_at_desc_idx2 on public.sales (sold_at desc, id desc);

-- Unified search RPC function
create or replace function public.search_everything(q text, scope text default null, lim int default 8)
returns table(
  kind text,
  id text,
  title text,
  subtitle text,
  url text,
  score real
) language sql stable as $$
with norm as (
  select trim(coalesce(q, '')) as q
),
-- Fast exacts first
exact_hits as (
  select 'product'::text as kind, p.id::text as id,
         p.name as title,
         coalesce('SKU '||p.sku||' · '||p.internal_sku, p.internal_sku) as subtitle,
         '/products/'||p.id as url,
         1.0 as score
  from products p, norm n
  where n.q <> '' and (
    p.internal_sku ilike n.q
    or p.sku ilike n.q
    or p.barcode ilike n.q
  )
  union all
  select 'serial', s.id::text,
         s.serial,
         'Product #'||s.product_id,
         '/products/'||s.product_id||'?tab=serials',
         1.0
  from serial_numbers s, norm n
  where n.q <> '' and s.serial ilike n.q
  union all
  select 'sale', sa.id::text,
         'Sale #'||sa.id,
         to_char(sa.sold_at, 'YYYY-MM-DD HH24:MI'),
         '/sales/'||sa.id,
         1.0
  from sales sa, norm n
  where n.q <> '' and sa.id::text = n.q
),
-- Fuzzy products
prod as (
  select 'product'::text as kind, p.id::text as id,
         p.name as title,
         coalesce(nullif(trim(concat_ws(' · ',
           case when p.sku is not null then 'SKU '||p.sku end,
           'INT '||p.internal_sku,
           nullif(p.category,''),
           nullif(p.metal,''),
           nullif(p.karat,''))),''), 'Product') as subtitle,
         '/products/'||p.id as url,
         greatest(similarity(p.name, (select q from norm)),
                  similarity(coalesce(p.sku,''), (select q from norm)),
                  similarity(coalesce(p.internal_sku,''), (select q from norm))) as score
  from products p, norm
  where (select q from norm) <> ''
    and (
      p.name ilike '%'||(select q from norm)||'%'
      or p.sku ilike '%'||(select q from norm)||'%'
      or p.internal_sku ilike '%'||(select q from norm)||'%'
      or p.barcode ilike '%'||(select q from norm)||'%'
      or p.category ilike '%'||(select q from norm)||'%'
      or p.metal ilike '%'||(select q from norm)||'%'
    )
  order by score desc
  limit lim
),
-- Fuzzy suppliers
sup as (
  select 'supplier'::text as kind, s.id::text as id,
         s.name as title,
         coalesce(nullif(s.email,''),'Supplier') as subtitle,
         '/suppliers/'||s.id as url,
         similarity(s.name, (select q from norm)) as score
  from suppliers s, norm
  where (select q from norm) <> '' and s.name ilike '%'||(select q from norm)||'%'
  order by score desc
  limit least(lim, 6)
),
-- Recent sales fuzzy by id/time string
sale as (
  select 'sale'::text as kind, sa.id::text as id,
         'Sale #'||sa.id as title,
         to_char(sa.sold_at,'YYYY-MM-DD HH24:MI') as subtitle,
         '/sales/'||sa.id as url,
         0.5 as score
  from sales sa, norm
  where (select q from norm) <> ''
    and (sa.id::text ilike '%'||(select q from norm)||'%')
  order by sa.sold_at desc
  limit least(lim, 5)
)
select * from exact_hits
union all
select * from prod
union all
select * from sup
union all
select * from sale
where (scope is null) or (scope = kind)
order by score desc
limit (lim * 4);
$$;