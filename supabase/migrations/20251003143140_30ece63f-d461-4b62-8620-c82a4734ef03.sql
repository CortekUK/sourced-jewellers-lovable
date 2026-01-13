-- Add purchase_date column to products table
ALTER TABLE public.products
ADD COLUMN purchase_date date;