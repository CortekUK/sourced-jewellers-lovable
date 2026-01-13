-- Fix trigger functions with proper search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.on_sale_item_insert()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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

CREATE OR REPLACE FUNCTION public.recalc_sale_totals()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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