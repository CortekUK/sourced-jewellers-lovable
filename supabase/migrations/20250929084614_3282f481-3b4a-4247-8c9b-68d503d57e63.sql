-- Add customer information fields to part_exchanges table
ALTER TABLE public.part_exchanges 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_contact TEXT;

-- Add comment to explain the new fields
COMMENT ON COLUMN public.part_exchanges.customer_name IS 'Name of the customer who traded in the item';
COMMENT ON COLUMN public.part_exchanges.customer_contact IS 'Contact information for the customer who traded in the item';