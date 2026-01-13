-- Drop existing search function if it exists
DROP FUNCTION IF EXISTS search_everything(text);

-- Create comprehensive search function
CREATE OR REPLACE FUNCTION search_everything(search_query text)
RETURNS TABLE (
  kind text,
  id text,
  title text,
  subtitle text,
  url text,
  score real
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- Search products
  SELECT 
    'product'::text as kind,
    p.id::text as id,
    p.name as title,
    COALESCE(p.sku || ' • ' || p.category, p.sku, p.category, 'No SKU') as subtitle,
    '/products?id=' || p.id::text as url,
    (
      CASE 
        WHEN p.name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN p.sku ILIKE '%' || search_query || '%' THEN 0.9
        WHEN p.internal_sku ILIKE '%' || search_query || '%' THEN 0.9
        WHEN p.category ILIKE '%' || search_query || '%' THEN 0.7
        WHEN p.description ILIKE '%' || search_query || '%' THEN 0.5
        ELSE 0.3
      END
    )::real as score
  FROM products p
  WHERE 
    p.name ILIKE '%' || search_query || '%'
    OR p.sku ILIKE '%' || search_query || '%'
    OR p.internal_sku ILIKE '%' || search_query || '%'
    OR p.category ILIKE '%' || search_query || '%'
    OR p.description ILIKE '%' || search_query || '%'
  
  UNION ALL
  
  -- Search suppliers (including customers)
  SELECT 
    'supplier'::text as kind,
    s.id::text as id,
    s.name as title,
    COALESCE(s.contact_name || ' • ' || s.supplier_type, s.supplier_type, 'No contact') as subtitle,
    '/suppliers/' || s.id::text as url,
    (
      CASE 
        WHEN s.name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN s.contact_name ILIKE '%' || search_query || '%' THEN 0.9
        WHEN s.email ILIKE '%' || search_query || '%' THEN 0.8
        WHEN s.phone ILIKE '%' || search_query || '%' THEN 0.7
        ELSE 0.3
      END
    )::real as score
  FROM suppliers s
  WHERE 
    s.name ILIKE '%' || search_query || '%'
    OR s.contact_name ILIKE '%' || search_query || '%'
    OR s.email ILIKE '%' || search_query || '%'
    OR s.phone ILIKE '%' || search_query || '%'
  
  UNION ALL
  
  -- Search sales
  SELECT 
    'sale'::text as kind,
    sa.id::text as id,
    '#' || sa.id::text || ' - ' || COALESCE(sa.customer_name, 'No customer') as title,
    '£' || sa.total::text || ' • ' || to_char(sa.sold_at, 'DD/MM/YYYY') as subtitle,
    '/transactions/' || sa.id::text as url,
    (
      CASE 
        WHEN sa.customer_name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN sa.customer_email ILIKE '%' || search_query || '%' THEN 0.9
        WHEN sa.id::text = search_query THEN 1.0
        ELSE 0.5
      END
    )::real as score
  FROM sales sa
  WHERE 
    sa.customer_name ILIKE '%' || search_query || '%'
    OR sa.customer_email ILIKE '%' || search_query || '%'
    OR sa.id::text = search_query
    OR '#' || sa.id::text = search_query
  
  ORDER BY score DESC, title ASC
  LIMIT 50;
END;
$$;