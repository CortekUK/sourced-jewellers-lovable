-- Add consignment fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_consignment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consignment_supplier_id bigint REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS consignment_terms text,
  ADD COLUMN IF NOT EXISTS consignment_start_date date,
  ADD COLUMN IF NOT EXISTS consignment_end_date date;

-- Create consignment settlements table
CREATE TABLE IF NOT EXISTS public.consignment_settlements (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sale_id bigint REFERENCES public.sales(id) ON DELETE SET NULL,
  supplier_id bigint NOT NULL REFERENCES public.suppliers(id),
  agreed_price numeric(12,2),
  sale_price numeric(12,2),
  payout_amount numeric(12,2),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS consignment_settlements_supplier_idx ON public.consignment_settlements (supplier_id);
CREATE INDEX IF NOT EXISTS consignment_settlements_product_idx ON public.consignment_settlements (product_id);

-- Enable RLS on consignment settlements table
ALTER TABLE public.consignment_settlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for consignment settlements (staff can read, owner can manage)
CREATE POLICY "consignment_settlements_read_staff" 
ON public.consignment_settlements 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "consignment_settlements_insert_owner" 
ON public.consignment_settlements 
FOR INSERT 
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "consignment_settlements_update_owner" 
ON public.consignment_settlements 
FOR UPDATE 
USING (is_owner(auth.uid()));

CREATE POLICY "consignment_settlements_delete_owner" 
ON public.consignment_settlements 
FOR DELETE 
USING (is_owner(auth.uid()));