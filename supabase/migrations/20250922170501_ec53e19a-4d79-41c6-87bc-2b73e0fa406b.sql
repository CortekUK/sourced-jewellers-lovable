-- ========== VIEWS FOR BUSINESS LOGIC ==========

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

-- Weighted average cost per product
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

-- Sales with profit calculation
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

-- ========== TRIGGERS FOR AUTO-CALCULATIONS ==========

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

-- Auto-create stock movement on sale item insert
CREATE OR REPLACE FUNCTION public.on_sale_item_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  track boolean;
  sale_date timestamptz;
BEGIN
  SELECT track_stock INTO track FROM public.products WHERE id = NEW.product_id;
  SELECT sold_at INTO sale_date FROM public.sales WHERE id = NEW.sale_id;
  
  IF track THEN
    INSERT INTO public.stock_movements (product_id, movement_type, quantity, unit_cost, related_sale_id, occurred_at, created_by)
    VALUES (NEW.product_id, 'sale', NEW.quantity, NEW.unit_cost, NEW.sale_id, sale_date, auth.uid());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sale_items_after_insert ON public.sale_items;
CREATE TRIGGER trg_sale_items_after_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.on_sale_item_insert();

-- Recalculate sale totals when items change
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