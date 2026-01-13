-- Fix foreign key constraints to allow supplier deletion
-- Strategy:
--   - Products with consignment supplier: SET NULL (keep product, remove supplier reference)
--   - Consignment settlements: CASCADE (delete settlement records)
--   - Sale items with deleted products: SET NULL (preserve sales history)

-- 1. First, drop the check constraint that requires consignment products to have a supplier
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS check_consignment_complete;

-- 2. Fix products.consignment_supplier_id - SET NULL to keep products
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_consignment_supplier_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_consignment_supplier_id_fkey
  FOREIGN KEY (consignment_supplier_id)
  REFERENCES public.suppliers(id)
  ON DELETE SET NULL;

-- 3. Create a trigger to automatically set is_consignment=false when supplier is removed
CREATE OR REPLACE FUNCTION handle_consignment_supplier_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consignment_supplier_id IS NULL AND OLD.consignment_supplier_id IS NOT NULL THEN
    NEW.is_consignment := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consignment_supplier_removal ON public.products;
CREATE TRIGGER trg_consignment_supplier_removal
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION handle_consignment_supplier_removal();

-- 2. Fix consignment_settlements.supplier_id - CASCADE delete settlements
ALTER TABLE public.consignment_settlements
  DROP CONSTRAINT IF EXISTS consignment_settlements_supplier_id_fkey;

ALTER TABLE public.consignment_settlements
  ADD CONSTRAINT consignment_settlements_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES public.suppliers(id)
  ON DELETE CASCADE;

-- 3. Fix sale_items.product_id - SET NULL to preserve sales history
ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

-- First, we need to allow product_id to be nullable
ALTER TABLE public.sale_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;
