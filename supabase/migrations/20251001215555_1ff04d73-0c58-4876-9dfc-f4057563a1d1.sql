-- Add customer_name column to sales table
ALTER TABLE public.sales 
ADD COLUMN customer_name TEXT;