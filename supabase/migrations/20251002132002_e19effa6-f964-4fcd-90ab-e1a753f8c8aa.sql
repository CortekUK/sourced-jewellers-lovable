-- Drop and recreate search_everything to use query params for products
DROP FUNCTION IF EXISTS search_everything(text);

CREATE OR REPLACE FUNCTION search_everything(q text, scope text DEFAULT NULL::text, lim integer DEFAULT 8)
RETURNS TABLE(kind text, id text, title text, subtitle text, url text, score real)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
with norm as (
  select trim(coalesce(q, '')) as q,
         q ~ '^px:' as is_px_token
),
-- Fast exacts first (with PX filter if applicable)
exact_hits as (
  select 'product'::text as kind, p.id::text as id,
         p.name as title,
         coalesce('SKU '||p.sku||' · '||p.internal_sku, p.internal_sku) as subtitle,
         '/products?id='||p.id as url,
         1.0 as score
  from products p, norm n
  where n.q <> '' and (
    p.internal_sku ilike regexp_replace(n.q, '^px:', '')
    or p.sku ilike regexp_replace(n.q, '^px:', '')
    or p.barcode ilike regexp_replace(n.q, '^px:', '')
  )
  and (not n.is_px_token or p.is_trade_in = true)
  union all
  select 'sale', sa.id::text,
         'Sale #'||sa.id,
         to_char(sa.sold_at, 'YYYY-MM-DD HH24:MI'),
         '/sales/'||sa.id,
         1.0
  from sales sa, norm n
  where n.q <> '' and sa.id::text = regexp_replace(n.q, '^px:', '')
),
-- Fuzzy products (with PX filter if applicable)
prod as (
  select 'product'::text as kind, p.id::text as id,
         p.name as title,
         coalesce(nullif(trim(concat_ws(' · ',
           case when p.sku is not null then 'SKU '||p.sku end,
           'INT '||p.internal_sku,
           nullif(p.category,''),
           nullif(p.metal,''),
           nullif(p.karat,''))),''), 'Product') as subtitle,
         '/products?id='||p.id as url,
         greatest(similarity(p.name, regexp_replace((select q from norm), '^px:', '')),
                  similarity(coalesce(p.sku,''), regexp_replace((select q from norm), '^px:', '')),
                  similarity(coalesce(p.internal_sku,''), regexp_replace((select q from norm), '^px:', ''))) as score
  from products p, norm
  where regexp_replace((select q from norm), '^px:', '') <> ''
    and (
      p.name ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
      or p.sku ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
      or p.internal_sku ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
      or p.barcode ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
      or p.category ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
      or p.metal ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
    )
  and (not (select is_px_token from norm) or p.is_trade_in = true)
  order by score desc
  limit lim
),
-- Fuzzy suppliers (no PX filter needed for suppliers)
sup as (
  select 'supplier'::text as kind, s.id::text as id,
         s.name as title,
         coalesce(nullif(s.email,''),'Supplier') as subtitle,
         '/suppliers/'||s.id as url,
         similarity(s.name, regexp_replace((select q from norm), '^px:', '')) as score
  from suppliers s, norm
  where regexp_replace((select q from norm), '^px:', '') <> '' 
    and s.name ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%'
    and not (select is_px_token from norm)
  order by score desc
  limit least(lim, 6)
),
-- Recent sales fuzzy by id/time string (no PX filter for sales)
sale as (
  select 'sale'::text as kind, sa.id::text as id,
         'Sale #'||sa.id as title,
         to_char(sa.sold_at,'YYYY-MM-DD HH24:MI') as subtitle,
         '/sales/'||sa.id as url,
         0.5 as score
  from sales sa, norm
  where regexp_replace((select q from norm), '^px:', '') <> ''
    and (sa.id::text ilike '%'||regexp_replace((select q from norm), '^px:', '')||'%')
    and not (select is_px_token from norm)
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