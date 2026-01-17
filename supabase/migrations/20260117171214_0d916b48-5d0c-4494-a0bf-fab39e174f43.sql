-- Update is_staff function to include manager role
-- This fixes the RLS policy violation when managers try to complete cash sales
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = uid AND p.role IN ('owner', 'manager', 'staff')
  );
$$;