-- Fix the Rolex Submariner to have proper internal SKU and clear the incorrect sku field
UPDATE products 
SET 
  internal_sku = 'LIT-' || lpad(nextval('product_sku_seq')::text, 5, '0'),
  sku = NULL,  -- Clear the incorrect serial number from SKU field
  barcode = '65432'  -- Move the serial number to the proper barcode field
WHERE id = 4 AND name LIKE '%Submariner%';

-- Ensure the trigger is working by updating the trigger function
CREATE OR REPLACE FUNCTION public.gen_internal_sku()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Always generate internal_sku if it's null or empty
  if new.internal_sku is null or trim(new.internal_sku) = '' then
    new.internal_sku := 'LIT-' || lpad(nextval('product_sku_seq')::text, 5, '0');
  end if;
  return new;
end $function$;