-- Migrate existing registration documents to product_documents table
INSERT INTO public.product_documents (
  product_id,
  doc_type,
  title,
  path,
  file_ext,
  file_size,
  uploaded_at
)
SELECT 
  p.id as product_id,
  'registration'::public.product_document_type as doc_type,
  'Registration Certificate' as title,
  p.registration_doc as path,
  CASE 
    WHEN p.registration_doc IS NOT NULL THEN
      LOWER(SUBSTRING(p.registration_doc FROM '\.([^\.]+)$'))
    ELSE NULL
  END as file_ext,
  NULL as file_size, -- We don't have this data for existing files
  COALESCE(p.registration_doc_uploaded_at, p.created_at) as uploaded_at
FROM public.products p
WHERE p.registration_doc IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.product_documents pd 
    WHERE pd.product_id = p.id 
    AND pd.doc_type = 'registration'
    AND pd.path = p.registration_doc
  );