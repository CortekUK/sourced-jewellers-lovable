-- Add new columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS address text;

-- Create supplier_documents table
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id bigint NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title text,
  file_path text NOT NULL,
  file_size bigint,
  file_ext text,
  doc_type text NOT NULL DEFAULT 'other' CHECK (doc_type IN ('contract', 'invoice', 'agreement', 'other')),
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  note text
);

-- Enable RLS on supplier_documents
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_documents (staff can read, owner can write)
CREATE POLICY "supplier_documents_read_staff" ON public.supplier_documents
  FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "supplier_documents_insert_owner" ON public.supplier_documents
  FOR INSERT TO authenticated
  WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "supplier_documents_update_owner" ON public.supplier_documents
  FOR UPDATE TO authenticated
  USING (is_owner(auth.uid()));

CREATE POLICY "supplier_documents_delete_owner" ON public.supplier_documents
  FOR DELETE TO authenticated
  USING (is_owner(auth.uid()));

-- Create view for supplier metrics
CREATE OR REPLACE VIEW public.v_supplier_metrics AS
SELECT 
  s.id as supplier_id,
  s.name,
  s.status,
  s.tags,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('month', now()) 
    THEN sm.id 
  END) as orders_this_month,
  COALESCE(SUM(CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('year', now()) 
    THEN sm.quantity * sm.unit_cost 
  END), 0) as inventory_spend_this_year,
  COALESCE(SUM(CASE 
    WHEN e.incurred_at >= date_trunc('year', now()) 
    THEN e.amount 
  END), 0) as expense_spend_this_year,
  COALESCE(SUM(CASE 
    WHEN sm.movement_type = 'purchase' 
    AND sm.occurred_at >= date_trunc('year', now()) 
    THEN sm.quantity * sm.unit_cost 
  END), 0) + COALESCE(SUM(CASE 
    WHEN e.incurred_at >= date_trunc('year', now()) 
    THEN e.amount 
  END), 0) as total_spend_this_year
FROM public.suppliers s
LEFT JOIN public.products p ON (p.supplier_id = s.id OR p.consignment_supplier_id = s.id)
LEFT JOIN public.stock_movements sm ON sm.supplier_id = s.id
LEFT JOIN public.expenses e ON e.supplier_id = s.id
GROUP BY s.id, s.name, s.status, s.tags;

-- Create index for better performance on supplier queries
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_tags ON public.suppliers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_id ON public.supplier_documents(supplier_id);