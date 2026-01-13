-- Add staff_member_name column to sales table
ALTER TABLE public.sales 
ADD COLUMN staff_member_name TEXT;

COMMENT ON COLUMN public.sales.staff_member_name IS 'Name of the physical staff member who processed the sale (for single-account scenarios)';