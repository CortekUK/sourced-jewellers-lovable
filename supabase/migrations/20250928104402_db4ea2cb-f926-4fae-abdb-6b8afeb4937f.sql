-- Fix existing trade-in product unit_price and future trade-in creation
-- Update the existing Rolex Day-Date trade-in product to have proper unit_price
UPDATE products 
SET unit_price = unit_cost
WHERE id = 3 
  AND unit_price = 0 
  AND unit_cost > 0;