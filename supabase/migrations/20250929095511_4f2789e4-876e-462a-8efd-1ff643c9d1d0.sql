-- Update Rolex Submariner to be marked as consignment product
UPDATE products 
SET is_consignment = true
WHERE id = 4;