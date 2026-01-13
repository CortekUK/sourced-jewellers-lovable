-- ========== SAMPLE DATA ==========

-- Insert sample supplier
INSERT INTO public.suppliers (name, contact_name, phone, email, notes) VALUES
('Auric Traders Ltd.', 'Sarah Johnson', '+1-555-1234', 'sarah@aurictraders.com', 'Primary gold supplier - excellent quality'),
('Silver Moon Co.', 'Michael Chen', '+1-555-5678', 'orders@silvermoon.com', 'Silver jewelry specialist')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (sku, name, description, category, metal, karat, gemstone, supplier_id, unit_cost, unit_price, tax_rate) VALUES
('RNG-001', 'Classic Gold Band', 'Simple elegant gold wedding band', 'Rings', 'Gold', '18k', NULL, 1, 250.00, 450.00, 15.00),
('RNG-002', 'Diamond Solitaire Ring', 'Classic solitaire with 1ct diamond', 'Rings', 'Gold', '18k', 'Diamond', 1, 1200.00, 2500.00, 15.00),
('NCK-001', 'Pearl Necklace', 'Freshwater pearl strand necklace', 'Necklaces', 'Silver', '925', 'Pearl', 2, 180.00, 320.00, 15.00),
('EAR-001', 'Silver Hoops', 'Classic silver hoop earrings', 'Earrings', 'Silver', '925', NULL, 2, 45.00, 95.00, 15.00),
('BRC-001', 'Tennis Bracelet', 'Diamond tennis bracelet', 'Bracelets', 'Gold', '14k', 'Diamond', 1, 800.00, 1650.00, 15.00)
ON CONFLICT (sku) DO NOTHING;

-- Insert initial stock movements (purchases)
INSERT INTO public.stock_movements (product_id, movement_type, quantity, unit_cost, supplier_id, note, created_by) 
SELECT p.id, 'purchase', qty, p.unit_cost, p.supplier_id, 'Initial inventory', (SELECT user_id FROM public.profiles WHERE role = 'owner' LIMIT 1)
FROM (VALUES 
  ('RNG-001', 12),
  ('RNG-002', 5),
  ('NCK-001', 8),
  ('EAR-001', 15),
  ('BRC-001', 3)
) AS initial_stock(sku, qty)
JOIN public.products p ON p.sku = initial_stock.sku;

-- Insert sample expenses
INSERT INTO public.expenses (incurred_at, category, description, amount, staff_id) VALUES
(now() - interval '5 days', 'rent', 'Monthly store rent', 2500.00, (SELECT user_id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
(now() - interval '3 days', 'utilities', 'Electricity bill', 180.50, (SELECT user_id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
(now() - interval '2 days', 'marketing', 'Social media advertising', 300.00, (SELECT user_id FROM public.profiles WHERE role = 'owner' LIMIT 1))
ON CONFLICT DO NOTHING;