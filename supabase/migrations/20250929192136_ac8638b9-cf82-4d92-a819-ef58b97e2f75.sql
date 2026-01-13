-- Add new columns to part_exchanges table
ALTER TABLE public.part_exchanges
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS serial TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'linked')),
ADD COLUMN IF NOT EXISTS customer_supplier_id BIGINT REFERENCES public.suppliers(id);

-- Make product_id nullable (allow pending part exchanges)
ALTER TABLE public.part_exchanges
ALTER COLUMN product_id DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_part_exchanges_status ON public.part_exchanges(status);
CREATE INDEX IF NOT EXISTS idx_part_exchanges_customer_supplier ON public.part_exchanges(customer_supplier_id);

-- Create storage bucket for part exchange documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-exchange-docs', 'part-exchange-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for part-exchange-docs bucket
CREATE POLICY "Staff can view part exchange docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'part-exchange-docs' AND is_staff(auth.uid()));

CREATE POLICY "Staff can upload part exchange docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'part-exchange-docs' AND is_staff(auth.uid()));

CREATE POLICY "Owner can delete part exchange docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'part-exchange-docs' AND is_owner(auth.uid()));