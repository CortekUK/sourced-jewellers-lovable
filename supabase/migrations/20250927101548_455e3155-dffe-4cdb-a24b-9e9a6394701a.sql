-- Add registration fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_registered boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_doc text,
ADD COLUMN IF NOT EXISTS registration_doc_uploaded_at timestamptz;

-- Create product-docs storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-docs', 'product-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for product documents
CREATE POLICY "product-docs read (staff+owner)" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-docs' AND public.is_staff(auth.uid())
);

CREATE POLICY "product-docs insert (owner)" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-docs' AND public.is_owner(auth.uid())
);

CREATE POLICY "product-docs update (owner)" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-docs' AND public.is_owner(auth.uid())
);

CREATE POLICY "product-docs delete (owner)" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-docs' AND public.is_owner(auth.uid())
);