-- Allow all staff (including regular staff) to insert suppliers
-- This is needed for creating customer suppliers during part exchanges
CREATE POLICY "Suppliers: All staff can insert"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (
  is_any_staff(auth.uid())
);