-- Add consignment_agreement document type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'product_document_type' AND e.enumlabel = 'consignment_agreement'
  ) THEN
    ALTER TYPE public.product_document_type ADD VALUE 'consignment_agreement';
  END IF;
END$$;