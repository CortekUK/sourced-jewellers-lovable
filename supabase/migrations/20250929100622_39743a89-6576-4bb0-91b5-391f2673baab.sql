-- Fix incomplete consignment setup for Rolex Submariner
UPDATE products 
SET 
  consignment_supplier_id = 3,  -- Premium Watches London
  consignment_start_date = '2024-01-01',
  consignment_end_date = '2024-12-31'
WHERE id = 4 AND is_consignment = true;

-- Add constraint to ensure consignment products have required fields
ALTER TABLE products 
ADD CONSTRAINT check_consignment_complete 
CHECK (
  (is_consignment = false) OR 
  (is_consignment = true AND consignment_supplier_id IS NOT NULL)
);