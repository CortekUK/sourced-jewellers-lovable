-- Create view for customer supplier payouts
CREATE OR REPLACE VIEW v_customer_supplier_payouts AS
SELECT 
  s.id as supplier_id,
  s.name as supplier_name,
  COUNT(DISTINCT p.id) as part_exchange_count,
  COALESCE(SUM(sm.quantity * sm.unit_cost), 0) as total_part_exchange_value,
  COALESCE(SUM(e.amount), 0) as other_expenses,
  COALESCE(SUM(sm.quantity * sm.unit_cost), 0) + COALESCE(SUM(e.amount), 0) as total_payouts
FROM suppliers s
LEFT JOIN stock_movements sm ON sm.supplier_id = s.id AND sm.movement_type = 'purchase'
LEFT JOIN products p ON p.id = sm.product_id AND p.is_trade_in = true
LEFT JOIN expenses e ON e.supplier_id = s.id
WHERE s.supplier_type = 'customer'
GROUP BY s.id, s.name;