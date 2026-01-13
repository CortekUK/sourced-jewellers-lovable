-- Add supplier_type column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN supplier_type TEXT NOT NULL DEFAULT 'registered' 
CHECK (supplier_type IN ('registered', 'customer'));

-- Create index for filtering
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);

-- Add comment for clarity
COMMENT ON COLUMN suppliers.supplier_type IS 
'Type of supplier: registered (business/vendor) or customer (walk-in/part-exchange)';

-- Update existing suppliers to be registered type
UPDATE suppliers 
SET supplier_type = 'registered';

-- Drop and recreate v_supplier_metrics view to include supplier_type
DROP VIEW IF EXISTS v_supplier_metrics;

CREATE VIEW v_supplier_metrics AS
SELECT 
  s.id as supplier_id,
  s.name,
  s.status,
  s.tags,
  s.supplier_type,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('month', now()) 
    THEN sm.id 
  END) as orders_this_month,
  COALESCE(SUM(CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('year', now()) 
    THEN sm.quantity * sm.unit_cost 
    ELSE 0 
  END), 0) as inventory_spend_this_year,
  COALESCE(SUM(CASE 
    WHEN e.incurred_at >= date_trunc('year', now()) 
    THEN e.amount 
    ELSE 0 
  END), 0) as expense_spend_this_year,
  COALESCE(SUM(CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('year', now()) 
    THEN sm.quantity * sm.unit_cost 
    ELSE 0 
  END), 0) + COALESCE(SUM(CASE 
    WHEN e.incurred_at >= date_trunc('year', now()) 
    THEN e.amount 
    ELSE 0 
  END), 0) as total_spend_this_year
FROM suppliers s
LEFT JOIN products p ON p.supplier_id = s.id OR p.consignment_supplier_id = s.id
LEFT JOIN stock_movements sm ON sm.supplier_id = s.id
LEFT JOIN expenses e ON e.supplier_id = s.id
GROUP BY s.id, s.name, s.status, s.tags, s.supplier_type;