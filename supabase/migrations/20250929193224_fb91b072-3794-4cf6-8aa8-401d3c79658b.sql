-- Add customer_email column to sales table
ALTER TABLE public.sales 
ADD COLUMN customer_email TEXT;

COMMENT ON COLUMN public.sales.customer_email IS 'Optional customer email for receipt delivery';