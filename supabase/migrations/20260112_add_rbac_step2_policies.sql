-- ============================================================
-- RBAC Migration Step 2: Helper Functions and RLS Policies
-- Run this AFTER step 1 has been committed
-- ============================================================

-- Create/Update helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_manager(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = uid AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner_or_manager(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = uid AND role IN ('owner', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = uid LIMIT 1;
$$;

-- Update profiles RLS to allow owners to manage all users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_owner(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_owner(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_owner(auth.uid())
);

-- Products RLS - All can view, owner/manager can write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Products: All authenticated users can view" ON public.products;
CREATE POLICY "Products: All authenticated users can view"
ON public.products FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products: Owner and manager can insert" ON public.products;
CREATE POLICY "Products: Owner and manager can insert"
ON public.products FOR INSERT
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products: Owner and manager can update" ON public.products;
CREATE POLICY "Products: Owner and manager can update"
ON public.products FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products: Owner and manager can delete" ON public.products;
CREATE POLICY "Products: Owner and manager can delete"
ON public.products FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Suppliers RLS - All can view, owner/manager can write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers: All authenticated users can view" ON public.suppliers;
CREATE POLICY "Suppliers: All authenticated users can view"
ON public.suppliers FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers: Owner and manager can insert" ON public.suppliers;
CREATE POLICY "Suppliers: Owner and manager can insert"
ON public.suppliers FOR INSERT
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers: Owner and manager can update" ON public.suppliers;
CREATE POLICY "Suppliers: Owner and manager can update"
ON public.suppliers FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers: Owner and manager can delete" ON public.suppliers;
CREATE POLICY "Suppliers: Owner and manager can delete"
ON public.suppliers FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Sales RLS - All can view/create, owner/manager can update/delete
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales;
DROP POLICY IF EXISTS "Sales: All authenticated users can view" ON public.sales;
CREATE POLICY "Sales: All authenticated users can view"
ON public.sales FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Sales: All authenticated users can create" ON public.sales;
CREATE POLICY "Sales: All authenticated users can create"
ON public.sales FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sales: Owner and manager can update" ON public.sales;
CREATE POLICY "Sales: Owner and manager can update"
ON public.sales FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Sales: Owner and manager can delete" ON public.sales;
CREATE POLICY "Sales: Owner and manager can delete"
ON public.sales FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Sale Items RLS - All can view/create, owner/manager can update/delete
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sale_items;
DROP POLICY IF EXISTS "Sale Items: All authenticated users can view" ON public.sale_items;
CREATE POLICY "Sale Items: All authenticated users can view"
ON public.sale_items FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sale_items;
DROP POLICY IF EXISTS "Sale Items: All authenticated users can create" ON public.sale_items;
CREATE POLICY "Sale Items: All authenticated users can create"
ON public.sale_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sale Items: Owner and manager can update" ON public.sale_items;
CREATE POLICY "Sale Items: Owner and manager can update"
ON public.sale_items FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Sale Items: Owner and manager can delete" ON public.sale_items;
CREATE POLICY "Sale Items: Owner and manager can delete"
ON public.sale_items FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Expenses RLS - All can view, owner/manager can write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: All authenticated users can view" ON public.expenses;
CREATE POLICY "Expenses: All authenticated users can view"
ON public.expenses FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: Owner and manager can insert" ON public.expenses;
CREATE POLICY "Expenses: Owner and manager can insert"
ON public.expenses FOR INSERT
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: Owner and manager can update" ON public.expenses;
CREATE POLICY "Expenses: Owner and manager can update"
ON public.expenses FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: Owner and manager can delete" ON public.expenses;
CREATE POLICY "Expenses: Owner and manager can delete"
ON public.expenses FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Stock Movements RLS - All can view, owner/manager can write
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock Movements: All authenticated users can view" ON public.stock_movements;
CREATE POLICY "Stock Movements: All authenticated users can view"
ON public.stock_movements FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock Movements: Owner and manager can insert" ON public.stock_movements;
CREATE POLICY "Stock Movements: Owner and manager can insert"
ON public.stock_movements FOR INSERT
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Stock Movements: Owner and manager can update" ON public.stock_movements;
CREATE POLICY "Stock Movements: Owner and manager can update"
ON public.stock_movements FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Stock Movements: Owner and manager can delete" ON public.stock_movements;
CREATE POLICY "Stock Movements: Owner and manager can delete"
ON public.stock_movements FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Consignment Settlements RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.consignment_settlements;
DROP POLICY IF EXISTS "Consignment Settlements: All authenticated users can view" ON public.consignment_settlements;
CREATE POLICY "Consignment Settlements: All authenticated users can view"
ON public.consignment_settlements FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.consignment_settlements;
DROP POLICY IF EXISTS "Consignment Settlements: Owner and manager can insert" ON public.consignment_settlements;
CREATE POLICY "Consignment Settlements: Owner and manager can insert"
ON public.consignment_settlements FOR INSERT
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Consignment Settlements: Owner and manager can update" ON public.consignment_settlements;
CREATE POLICY "Consignment Settlements: Owner and manager can update"
ON public.consignment_settlements FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Consignment Settlements: Owner and manager can delete" ON public.consignment_settlements;
CREATE POLICY "Consignment Settlements: Owner and manager can delete"
ON public.consignment_settlements FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- Part Exchanges RLS - All can view/create, owner/manager can update/delete
DROP POLICY IF EXISTS "Enable read access for all users" ON public.part_exchanges;
DROP POLICY IF EXISTS "Part Exchanges: All authenticated users can view" ON public.part_exchanges;
CREATE POLICY "Part Exchanges: All authenticated users can view"
ON public.part_exchanges FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.part_exchanges;
DROP POLICY IF EXISTS "Part Exchanges: All authenticated users can create" ON public.part_exchanges;
CREATE POLICY "Part Exchanges: All authenticated users can create"
ON public.part_exchanges FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Part Exchanges: Owner and manager can update" ON public.part_exchanges;
CREATE POLICY "Part Exchanges: Owner and manager can update"
ON public.part_exchanges FOR UPDATE
USING (public.is_owner_or_manager(auth.uid()))
WITH CHECK (public.is_owner_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Part Exchanges: Owner and manager can delete" ON public.part_exchanges;
CREATE POLICY "Part Exchanges: Owner and manager can delete"
ON public.part_exchanges FOR DELETE
USING (public.is_owner_or_manager(auth.uid()));

-- App Settings RLS - All can view, only owner can modify
DROP POLICY IF EXISTS "Enable read for all" ON public.app_settings;
DROP POLICY IF EXISTS "App Settings: All authenticated users can view" ON public.app_settings;
CREATE POLICY "App Settings: All authenticated users can view"
ON public.app_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "App Settings: Only owner can insert" ON public.app_settings;
CREATE POLICY "App Settings: Only owner can insert"
ON public.app_settings FOR INSERT
WITH CHECK (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "App Settings: Only owner can update" ON public.app_settings;
CREATE POLICY "App Settings: Only owner can update"
ON public.app_settings FOR UPDATE
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "App Settings: Only owner can delete" ON public.app_settings;
CREATE POLICY "App Settings: Only owner can delete"
ON public.app_settings FOR DELETE
USING (public.is_owner(auth.uid()));
