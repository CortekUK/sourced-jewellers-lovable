-- Set default value for tax_rate column and update existing NULL values
UPDATE public.products SET tax_rate = 0 WHERE tax_rate IS NULL;
ALTER TABLE public.products ALTER COLUMN tax_rate SET DEFAULT 0;