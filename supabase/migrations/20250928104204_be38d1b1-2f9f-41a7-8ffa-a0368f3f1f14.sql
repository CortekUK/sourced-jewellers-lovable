-- Fix missing stock movement for existing trade-in product
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, supplier_id, note, occurred_at)
SELECT 
  3, 
  'purchase', 
  1, 
  0, 
  s.id, 
  'Trade-in stock correction - Rolex Daydate 40',
  p.created_at
FROM products p, suppliers s 
WHERE p.id = 3 
  AND s.name = 'Customer Trade-In'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements sm 
    WHERE sm.product_id = 3 AND sm.movement_type = 'purchase'
  );