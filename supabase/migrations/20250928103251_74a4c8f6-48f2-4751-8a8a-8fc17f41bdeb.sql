-- Add foreign key constraint using the correct column reference
-- The sales.staff_id should reference profiles.user_id (not profiles.id)
ALTER TABLE public.sales 
ADD CONSTRAINT fk_sales_staff_id 
FOREIGN KEY (staff_id) REFERENCES public.profiles(user_id);