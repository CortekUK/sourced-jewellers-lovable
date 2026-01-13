-- ========== VIEWS AND FUNCTIONS ==========

-- Current stock on hand per product
CREATE OR REPLACE VIEW public.v_stock_on_hand AS
SELECT
  p.id as product_id,
  p.sku,
  p.name,
  COALESCE(SUM(CASE
    WHEN sm.movement_type IN ('purchase','return_in') THEN sm.quantity
    WHEN sm.movement_type IN ('sale','return_out') THEN -sm.quantity
    WHEN sm.movement_type = 'adjustment' THEN sm.quantity
    ELSE 0 END), 0) as qty_on_hand
FROM public.products p
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.sku, p.name;

-- Weighted average cost per product based on purchases
CREATE OR REPLACE VIEW public.v_weighted_cost AS
WITH purchases AS (
  SELECT product_id,
         SUM(CASE WHEN movement_type IN ('purchase','return_in') THEN quantity ELSE 0 END) as qty_in,
         SUM(CASE WHEN movement_type IN ('purchase','return_in') THEN quantity * COALESCE(unit_cost,0) ELSE 0 END) as cost_total
  FROM public.stock_movements
  GROUP BY product_id
)
SELECT
  p.id as product_id,
  CASE WHEN qty_in > 0 THEN ROUND(cost_total / qty_in, 2) ELSE p.unit_cost END as avg_cost
FROM public.products p
LEFT JOIN purchases pu ON pu.product_id = p.id;

-- Inventory value view
CREATE OR REPLACE VIEW public.v_inventory_value AS
SELECT
  s.product_id,
  s.qty_on_hand,
  w.avg_cost,
  ROUND(COALESCE(s.qty_on_hand,0) * COALESCE(w.avg_cost,0), 2) as inventory_value
FROM public.v_stock_on_hand s
LEFT JOIN public.v_weighted_cost w ON w.product_id = s.product_id;

-- Sales with profit (line level)
CREATE OR REPLACE VIEW public.v_sales_with_profit AS
SELECT
  si.id as sale_item_id,
  si.sale_id,
  si.product_id,
  si.quantity,
  si.unit_price,
  si.unit_cost,
  (si.quantity * si.unit_price) - COALESCE(si.discount,0) as line_revenue,
  (si.quantity * si.unit_cost) as line_cogs,
  ((si.quantity * si.unit_price) - COALESCE(si.discount,0)) - (si.quantity * si.unit_cost) as line_gross_profit,
  s.sold_at
FROM public.sale_items si
JOIN public.sales s ON s.id = si.sale_id;

-- P&L by date range
CREATE OR REPLACE VIEW public.v_pnl_daily AS
SELECT
  DATE_TRUNC('day', s.sold_at) as day,
  SUM(sw.line_revenue) as revenue,
  SUM(sw.line_cogs) as cogs,
  SUM(sw.line_gross_profit) as gross_profit
FROM public.v_sales_with_profit sw
JOIN public.sales s ON s.id = sw.sale_id
GROUP BY 1
ORDER BY 1 DESC;

-- ========== TRIGGERS ==========

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- When SALE ITEMS are inserted, auto-create stock movement if tracking is on
CREATE OR REPLACE FUNCTION public.on_sale_item_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  track boolean;
BEGIN
  SELECT track_stock INTO track FROM public.products WHERE id = NEW.product_id;
  IF track THEN
    INSERT INTO public.stock_movements (product_id, movement_type, quantity, unit_cost, related_sale_id, occurred_at)
    VALUES (NEW.product_id, 'sale', NEW.quantity, NEW.unit_cost, NEW.sale_id, 
           (SELECT sold_at FROM public.sales WHERE id = NEW.sale_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sale_items_after_insert ON public.sale_items;
CREATE TRIGGER trg_sale_items_after_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.on_sale_item_insert();

-- Recompute sale header totals when items change
CREATE OR REPLACE FUNCTION public.recalc_sale_totals()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.sales s
  SET subtotal = x.subtotal,
      tax_total = x.tax_total,
      discount_total = x.discount_total,
      total = x.subtotal + x.tax_total - x.discount_total
  FROM (
    SELECT
      si.sale_id,
      COALESCE(SUM(si.quantity * si.unit_price),0) as subtotal,
      COALESCE(SUM( (si.quantity * si.unit_price - si.discount) * (si.tax_rate/100.0) ),0) as tax_total,
      COALESCE(SUM(si.discount),0) as discount_total
    FROM public.sale_items si
    WHERE si.sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
    GROUP BY si.sale_id
  ) x
  WHERE s.id = x.sale_id;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sale_items_after_change ON public.sale_items;
CREATE TRIGGER trg_sale_items_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_sale_totals();