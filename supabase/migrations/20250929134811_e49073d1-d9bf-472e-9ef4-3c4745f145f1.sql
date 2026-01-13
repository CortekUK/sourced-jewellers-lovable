-- Create view for PX & Consignment sales breakdown
CREATE OR REPLACE VIEW public.v_pnl_px_consign AS
SELECT
  si.id as sale_item_id,
  si.sale_id,
  si.product_id,
  p.is_trade_in,
  p.is_consignment,
  (si.quantity * si.unit_price) - COALESCE(si.discount, 0) as revenue,
  (si.quantity * si.unit_cost) as cogs,
  CASE 
    WHEN p.is_trade_in THEN 'px'
    WHEN p.is_consignment THEN 'consignment'
    ELSE 'owned' 
  END as kind,
  s.sold_at,
  p.name as product_name,
  p.internal_sku,
  si.quantity,
  si.unit_price,
  si.unit_cost,
  si.discount
FROM sale_items si
JOIN products p ON p.id = si.product_id
JOIN sales s ON s.id = si.sale_id;

-- Create view for unsettled consignment tracking
CREATE OR REPLACE VIEW public.v_consign_unsettled AS
SELECT
  cs.id as settlement_id,
  cs.product_id,
  cs.sale_id,
  cs.payout_amount,
  cs.paid_at,
  cs.agreed_price,
  cs.sale_price,
  cs.notes,
  p.name as product_name,
  p.internal_sku,
  s.sold_at,
  s.total as sale_total,
  sup.name as supplier_name
FROM consignment_settlements cs
JOIN products p ON p.id = cs.product_id
JOIN sales s ON s.id = cs.sale_id
LEFT JOIN suppliers sup ON sup.id = cs.supplier_id
WHERE cs.paid_at IS NULL;

-- Update the existing v_pnl_daily view to ensure consistency
CREATE OR REPLACE VIEW public.v_pnl_daily AS
SELECT
  DATE_TRUNC('day', s.sold_at) as day,
  SUM(sw.line_revenue) as revenue,
  SUM(sw.line_cogs) as cogs,
  SUM(sw.line_gross_profit) as gross_profit
FROM public.v_sales_with_profit sw
JOIN public.sales s ON s.id = sw.sale_id
GROUP BY 1
ORDER BY day;