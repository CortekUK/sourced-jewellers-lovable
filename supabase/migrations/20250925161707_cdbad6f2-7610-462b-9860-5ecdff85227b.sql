-- Clear all CRM data for fresh testing
-- Properly handle audit triggers and constraints

-- Step 1: Disable audit triggers by dropping them (using correct names)
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
DROP TRIGGER IF EXISTS trg_audit_suppliers ON public.suppliers;
DROP TRIGGER IF EXISTS trg_audit_sales ON public.sales;
DROP TRIGGER IF EXISTS trg_audit_sale_items ON public.sale_items;
DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trg_audit_stock_movements ON public.stock_movements;

-- Step 2: Clear all data in dependency order
-- Clear transaction data first
DELETE FROM public.sale_items;
DELETE FROM public.sales;
DELETE FROM public.stock_movements;
DELETE FROM public.expenses;

-- Clear master data
DELETE FROM public.products;
DELETE FROM public.suppliers;

-- Clear audit log
DELETE FROM public.audit_log;

-- Step 3: Reset sequences to start from 1
ALTER SEQUENCE public.products_id_seq RESTART WITH 1;
ALTER SEQUENCE public.suppliers_id_seq RESTART WITH 1;
ALTER SEQUENCE public.sales_id_seq RESTART WITH 1;
ALTER SEQUENCE public.sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE public.expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE public.stock_movements_id_seq RESTART WITH 1;
ALTER SEQUENCE public.audit_log_id_seq RESTART WITH 1;

-- Step 4: Recreate audit triggers
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
CREATE TRIGGER trg_audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
CREATE TRIGGER trg_audit_sale_items AFTER INSERT OR UPDATE OR DELETE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
CREATE TRIGGER trg_audit_stock_movements AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();