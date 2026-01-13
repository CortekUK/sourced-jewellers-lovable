-- Create RPC function for aged stock count
CREATE OR REPLACE FUNCTION public.aged_stock_count(days_threshold int DEFAULT 180)
RETURNS int LANGUAGE sql STABLE AS $$
  WITH last_sale AS (
    SELECT si.product_id, max(s.sold_at) as last_sold
    FROM sale_items si JOIN sales s ON s.id=si.sale_id
    GROUP BY si.product_id
  )
  SELECT count(*)::int FROM v_stock_on_hand soh
  LEFT JOIN last_sale ls ON ls.product_id=soh.product_id
  WHERE soh.qty_on_hand > 0
    AND (ls.last_sold IS NULL OR ls.last_sold < now() - (days_threshold || ' days')::interval);
$$;