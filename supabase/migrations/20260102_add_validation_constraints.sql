-- Migration: Add validation constraints for data integrity
-- This migration adds CHECK constraints to prevent invalid data
-- Made idempotent with DO blocks to allow re-running

-- ============================================
-- 1. Product price/cost constraints
-- ============================================

DO $$
BEGIN
  -- unit_price >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_unit_price_non_negative') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_unit_price_non_negative CHECK (unit_price >= 0);
  END IF;

  -- unit_cost >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_unit_cost_non_negative') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_unit_cost_non_negative CHECK (unit_cost >= 0);
  END IF;

  -- reorder_threshold >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_reorder_threshold_non_negative') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_reorder_threshold_non_negative CHECK (reorder_threshold >= 0);
  END IF;

  -- tax_rate between 0 and 100
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_tax_rate_valid') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100);
  END IF;
END $$;

-- ============================================
-- 2. Sale items constraints
-- ============================================

DO $$
BEGIN
  -- quantity > 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sale_items_quantity_positive') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT chk_sale_items_quantity_positive CHECK (quantity > 0);
  END IF;

  -- unit_price >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sale_items_unit_price_non_negative') THEN
    ALTER TABLE public.sale_items ADD CONSTRAINT chk_sale_items_unit_price_non_negative CHECK (unit_price >= 0);
  END IF;
END $$;

-- ============================================
-- 3. Expenses constraints
-- ============================================

DO $$
BEGIN
  -- amount > 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_expenses_amount_positive') THEN
    ALTER TABLE public.expenses ADD CONSTRAINT chk_expenses_amount_positive CHECK (amount > 0);
  END IF;
END $$;

-- ============================================
-- 4. Stock availability check function and trigger
-- ============================================

-- Create a function to check stock availability before a sale
CREATE OR REPLACE FUNCTION public.check_stock_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_stock INTEGER;
  product_tracks_stock BOOLEAN;
BEGIN
  -- Check if the product tracks stock
  SELECT track_stock INTO product_tracks_stock
  FROM public.products
  WHERE id = NEW.product_id;

  -- If the product doesn't track stock, allow the sale
  IF NOT COALESCE(product_tracks_stock, FALSE) THEN
    RETURN NEW;
  END IF;

  -- Get the current available stock from the view
  SELECT COALESCE(qty_on_hand, 0) INTO available_stock
  FROM public.v_stock_on_hand
  WHERE product_id = NEW.product_id;

  -- Check if there's enough stock
  IF available_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product ID %. Available: %, Requested: %',
      NEW.product_id, available_stock, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

-- Create a trigger to check stock before inserting sale items
DROP TRIGGER IF EXISTS trg_check_stock_before_sale ON public.sale_items;
CREATE TRIGGER trg_check_stock_before_sale
BEFORE INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.check_stock_availability();

-- ============================================
-- 5. Consignment settlement constraints
-- ============================================

DO $$
BEGIN
  -- payout_amount >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_consignment_settlements_payout_non_negative') THEN
    ALTER TABLE public.consignment_settlements ADD CONSTRAINT chk_consignment_settlements_payout_non_negative CHECK (payout_amount >= 0);
  END IF;

  -- sale_price >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_consignment_settlements_sale_price_non_negative') THEN
    ALTER TABLE public.consignment_settlements ADD CONSTRAINT chk_consignment_settlements_sale_price_non_negative CHECK (sale_price >= 0);
  END IF;
END $$;
