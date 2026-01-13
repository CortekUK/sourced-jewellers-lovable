-- Add signature_data column to sales table for storing customer signatures
ALTER TABLE public.sales 
ADD COLUMN signature_data TEXT NULL;

COMMENT ON COLUMN public.sales.signature_data IS 'Base64-encoded signature image data from customer signing at point of sale';