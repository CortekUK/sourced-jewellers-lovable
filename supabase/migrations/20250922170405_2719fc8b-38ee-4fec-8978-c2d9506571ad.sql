-- ========== ENABLE RLS ON ALL TABLES ==========
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========

-- SUPPLIERS: staff can read, owner can write
CREATE POLICY "suppliers_read_staff" ON public.suppliers
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "suppliers_insert_owner" ON public.suppliers
FOR INSERT WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "suppliers_update_owner" ON public.suppliers
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "suppliers_delete_owner" ON public.suppliers
FOR DELETE USING (public.is_owner(auth.uid()));

-- PRODUCTS: staff can read, owner can write
CREATE POLICY "products_read_staff" ON public.products
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "products_insert_owner" ON public.products
FOR INSERT WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "products_update_owner" ON public.products
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "products_delete_owner" ON public.products
FOR DELETE USING (public.is_owner(auth.uid()));

-- SALES: staff can create and read, owner can update/delete
CREATE POLICY "sales_read_staff" ON public.sales
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "sales_insert_staff" ON public.sales
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "sales_update_owner" ON public.sales
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "sales_delete_owner" ON public.sales
FOR DELETE USING (public.is_owner(auth.uid()));

-- SALE ITEMS: staff can create and read, owner can update/delete
CREATE POLICY "sale_items_read_staff" ON public.sale_items
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "sale_items_insert_staff" ON public.sale_items
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "sale_items_update_owner" ON public.sale_items
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "sale_items_delete_owner" ON public.sale_items
FOR DELETE USING (public.is_owner(auth.uid()));

-- EXPENSES: staff can create and read, owner can update/delete
CREATE POLICY "expenses_read_staff" ON public.expenses
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "expenses_insert_staff" ON public.expenses
FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "expenses_update_owner" ON public.expenses
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "expenses_delete_owner" ON public.expenses
FOR DELETE USING (public.is_owner(auth.uid()));

-- STOCK MOVEMENTS: staff can read, owner can write (sales triggers will handle sale movements)
CREATE POLICY "stock_movements_read_staff" ON public.stock_movements
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "stock_movements_insert_owner" ON public.stock_movements
FOR INSERT WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "stock_movements_update_owner" ON public.stock_movements
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "stock_movements_delete_owner" ON public.stock_movements
FOR DELETE USING (public.is_owner(auth.uid()));