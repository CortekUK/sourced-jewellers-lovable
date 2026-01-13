-- Remove the complex serial numbers tracking system
-- Drop the serial_numbers table completely
DROP TABLE IF EXISTS public.serial_numbers CASCADE;

-- Remove the track_serial column from products table since we're simplifying
ALTER TABLE public.products DROP COLUMN IF EXISTS track_serial;