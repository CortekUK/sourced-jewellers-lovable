-- Create part_exchanges table
CREATE TABLE IF NOT EXISTS public.part_exchanges (
  id bigserial PRIMARY KEY,
  sale_id bigint NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  allowance numeric(12,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS part_exchanges_sale_idx ON public.part_exchanges(sale_id);
CREATE INDEX IF NOT EXISTS part_exchanges_product_idx ON public.part_exchanges(product_id);

-- Add part_exchange_total to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS part_exchange_total numeric(12,2) DEFAULT 0;

-- Enable RLS on part_exchanges
ALTER TABLE public.part_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS policies for part_exchanges
CREATE POLICY "part_exchanges_read_staff" ON public.part_exchanges
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "part_exchanges_insert_staff" ON public.part_exchanges
FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "part_exchanges_update_owner" ON public.part_exchanges
FOR UPDATE USING (is_owner(auth.uid()));

CREATE POLICY "part_exchanges_delete_owner" ON public.part_exchanges
FOR DELETE USING (is_owner(auth.uid()));

-- Create "Customer Trade-In" supplier if it doesn't exist (without ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'Customer Trade-In') THEN
    INSERT INTO public.suppliers (name, contact_name, notes) 
    VALUES ('Customer Trade-In', 'Trade-In Department', 'Special supplier for customer trade-in items');
  END IF;
END $$;