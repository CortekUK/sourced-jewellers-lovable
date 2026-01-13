-- Add reorder threshold column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_threshold integer NOT NULL DEFAULT 0;

-- Create stock status view with computed flags
CREATE OR REPLACE VIEW public.v_stock_status AS
SELECT
  p.id as product_id,
  p.name,
  p.internal_sku,
  p.sku,
  COALESCE(s.qty_on_hand, 0) as qty_on_hand,
  p.reorder_threshold,
  CASE WHEN COALESCE(s.qty_on_hand, 0) = 0 THEN true ELSE false END as is_out_of_stock,
  CASE WHEN COALESCE(s.qty_on_hand, 0) > 0 AND COALESCE(s.qty_on_hand, 0) <= p.reorder_threshold AND p.reorder_threshold > 0 THEN true ELSE false END as is_at_risk
FROM public.products p
LEFT JOIN public.v_stock_on_hand s ON s.product_id = p.id;