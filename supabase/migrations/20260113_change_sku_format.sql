-- Remove LIT- prefix from SKU generation
-- New format: just numbers like 00001, 00002, etc.

-- Update the trigger function to generate numeric-only SKUs
CREATE OR REPLACE FUNCTION public.gen_internal_sku()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Always generate internal_sku if it's null or empty
  if new.internal_sku is null or trim(new.internal_sku) = '' then
    new.internal_sku := lpad(nextval('product_sku_seq')::text, 5, '0');
  end if;
  return new;
end $function$;

-- Update existing SKUs to remove the LIT- prefix
UPDATE products
SET internal_sku = replace(internal_sku, 'LIT-', '')
WHERE internal_sku LIKE 'LIT-%';
