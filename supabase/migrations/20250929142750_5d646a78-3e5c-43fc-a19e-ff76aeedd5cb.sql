-- Clear all business data for fresh testing
-- Order matters due to foreign key constraints

-- 1. Clear dependent records first
DELETE FROM public.sale_items;
DELETE FROM public.sales;
DELETE FROM public.part_exchanges;
DELETE FROM public.stock_movements;
DELETE FROM public.consignment_settlements;

-- 2. Clear main business entities
DELETE FROM public.product_documents;
DELETE FROM public.products;
DELETE FROM public.suppliers;
DELETE FROM public.expenses;

-- 3. Clear audit trail for completely fresh logs
DELETE FROM public.audit_log;

-- Note: Preserving profiles and app_settings tables for user accounts and configuration