-- Phase 1: Database Performance & Indexes
-- Foreign key + lookup indexes (safety if not created yet)
CREATE INDEX IF NOT EXISTS products_supplier_idx ON public.products (supplier_id);
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items (product_id);
CREATE INDEX IF NOT EXISTS expenses_supplier_idx ON public.expenses (supplier_id);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses (category);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx2 ON public.stock_movements (product_id, occurred_at DESC);

-- Text search helpers (if not already present)
CREATE INDEX IF NOT EXISTS products_search_tsv_idx ON public.products USING gin (
  to_tsvector('simple', COALESCE(name,'') || ' ' || COALESCE(sku,'') || ' ' || COALESCE(barcode,''))
);

-- Date range heavy paths
CREATE INDEX IF NOT EXISTS sales_sold_at_desc_idx ON public.sales (sold_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS expenses_incurred_desc_idx ON public.expenses (incurred_at DESC, id DESC);

-- Inventory views often hit stock_movements; ensure occurred_at + product id
CREATE INDEX IF NOT EXISTS stock_movements_occurred_desc_idx ON public.stock_movements (occurred_at DESC, id DESC);

-- Phase 2: Audit Logging System
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_pk TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  old_data JSONB,
  new_data JSONB,
  actor UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can read all; staff can read own actions; no writes direct
CREATE POLICY "audit_read_owner" ON public.audit_log FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "audit_read_own" ON public.audit_log FOR SELECT USING (auth.uid() = actor);

-- Generic trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pk TEXT;
BEGIN
  -- try id bigserial; fallback to primary key guess
  BEGIN
    pk := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  EXCEPTION WHEN others THEN
    pk := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id', 'unknown');
  END;

  INSERT INTO public.audit_log(table_name, row_pk, action, old_data, new_data, actor, occurred_at)
  VALUES (TG_TABLE_NAME, pk, TG_OP::TEXT,
          CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
          CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
          auth.uid(), now());
  RETURN NULL;
END $$;

-- Attach to key tables
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_suppliers ON public.suppliers;
CREATE TRIGGER trg_audit_suppliers
AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_sales ON public.sales;
CREATE TRIGGER trg_audit_sales
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_sale_items ON public.sale_items;
CREATE TRIGGER trg_audit_sale_items
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
CREATE TRIGGER trg_audit_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_stock_movements ON public.stock_movements;
CREATE TRIGGER trg_audit_stock_movements
AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Phase 4: Advanced Reports v2 SQL Views
-- Product performance within a date range
CREATE OR REPLACE VIEW public.v_product_mix AS
SELECT
  si.product_id,
  p.sku, p.name, p.category, p.metal, p.karat,
  SUM(si.quantity) as units_sold,
  SUM(si.quantity * si.unit_price - si.discount) as revenue,
  SUM(si.quantity * si.unit_cost) as cogs,
  SUM((si.quantity * si.unit_price - si.discount) - (si.quantity * si.unit_cost)) as gross_profit
FROM public.sale_items si
JOIN public.products p ON p.id = si.product_id
JOIN public.sales s ON s.id = si.sale_id
GROUP BY si.product_id, p.sku, p.name, p.category, p.metal, p.karat;

-- Supplier spend = inventory purchases + expenses to supplier
CREATE OR REPLACE VIEW public.v_supplier_spend AS
WITH inv_purchases AS (
  SELECT
    COALESCE(sm.supplier_id, p.supplier_id) as supplier_id,
    SUM(CASE WHEN sm.movement_type IN ('purchase','return_in') THEN sm.quantity * COALESCE(sm.unit_cost,0) ELSE 0 END) as inventory_spend
  FROM public.stock_movements sm
  JOIN public.products p ON p.id = sm.product_id
  GROUP BY 1
),
expense_spend AS (
  SELECT supplier_id, SUM(amount) as expense_spend
  FROM public.expenses
  GROUP BY 1
)
SELECT
  s.id as supplier_id,
  s.name,
  COALESCE(ip.inventory_spend,0) as inventory_spend,
  COALESCE(es.expense_spend,0) as expense_spend,
  COALESCE(ip.inventory_spend,0) + COALESCE(es.expense_spend,0) as total_spend
FROM public.suppliers s
LEFT JOIN inv_purchases ip ON ip.supplier_id = s.id
LEFT JOIN expense_spend es ON es.supplier_id = s.id;

-- Audit log index for performance
CREATE INDEX IF NOT EXISTS audit_log_occurred_desc_idx ON public.audit_log (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_log_table_name_idx ON public.audit_log (table_name);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log (actor);

-- Optional retention helper
CREATE OR REPLACE FUNCTION public.audit_prune_older_than(days INT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.audit_log WHERE occurred_at < now() - (days || ' days')::INTERVAL;
$$;