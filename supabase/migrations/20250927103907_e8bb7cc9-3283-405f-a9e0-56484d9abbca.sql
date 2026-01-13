-- Create document type enum (PostgreSQL 9.6+ compatible)
DO $$ BEGIN
  CREATE TYPE public.product_document_type AS ENUM 
  ('registration','warranty','appraisal','service','photo','other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create product_documents table
CREATE TABLE IF NOT EXISTS public.product_documents (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  doc_type public.product_document_type NOT NULL DEFAULT 'other',
  title text,
  note text,
  path text NOT NULL,
  file_ext text,
  file_size bigint,
  uploaded_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS product_documents_product_idx ON public.product_documents (product_id);
CREATE INDEX IF NOT EXISTS product_documents_type_idx ON public.product_documents (doc_type);
CREATE INDEX IF NOT EXISTS product_documents_uploaded_at_idx ON public.product_documents (uploaded_at DESC);

-- Enable RLS
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Staff can read, Owner can manage
CREATE POLICY "product_documents read (staff+owner)" ON public.product_documents
FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "product_documents insert (owner)" ON public.product_documents
FOR INSERT WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "product_documents update (owner)" ON public.product_documents
FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "product_documents delete (owner)" ON public.product_documents
FOR DELETE USING (public.is_owner(auth.uid()));