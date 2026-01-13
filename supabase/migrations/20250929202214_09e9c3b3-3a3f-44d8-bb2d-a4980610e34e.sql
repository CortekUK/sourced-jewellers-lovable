-- Add payment_method column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'other'));

-- Update existing records to have default payment method
UPDATE public.expenses SET payment_method = 'cash' WHERE payment_method IS NULL;