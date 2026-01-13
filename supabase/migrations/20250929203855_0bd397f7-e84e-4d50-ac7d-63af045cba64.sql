-- Phase 1: Database Schema Enhancements

-- 1.1 Add VAT/Tax columns to expenses table
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS amount_ex_vat numeric,
ADD COLUMN IF NOT EXISTS vat_amount numeric,
ADD COLUMN IF NOT EXISTS vat_rate numeric,
ADD COLUMN IF NOT EXISTS amount_inc_vat numeric,
ADD COLUMN IF NOT EXISTS notes text;

-- Add check constraint for vat_rate (must be 0, 5, or 20 if provided)
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_vat_rate_check 
CHECK (vat_rate IS NULL OR vat_rate IN (0, 5, 20));

-- 1.2 Create expense_receipts table
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id bigserial PRIMARY KEY,
  expense_id bigint NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png')),
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on expense_receipts
ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_receipts
CREATE POLICY "expense_receipts_read_staff"
ON public.expense_receipts FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "expense_receipts_insert_staff"
ON public.expense_receipts FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "expense_receipts_delete_owner"
ON public.expense_receipts FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- 1.3 Create expense_templates table (for recurring expenses)
CREATE TABLE IF NOT EXISTS public.expense_templates (
  id bigserial PRIMARY KEY,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  supplier_id bigint REFERENCES public.suppliers(id) ON DELETE SET NULL,
  payment_method text NOT NULL,
  vat_rate numeric,
  notes text,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annually')),
  next_due_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_generated_at timestamptz
);

-- Enable RLS on expense_templates
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_templates
CREATE POLICY "expense_templates_read_staff"
ON public.expense_templates FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "expense_templates_insert_owner"
ON public.expense_templates FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "expense_templates_update_owner"
ON public.expense_templates FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "expense_templates_delete_owner"
ON public.expense_templates FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- 1.4 Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for expense-receipts bucket
CREATE POLICY "expense_receipts_storage_read_staff"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts' AND is_staff(auth.uid()));

CREATE POLICY "expense_receipts_storage_insert_staff"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts' AND is_staff(auth.uid()));

CREATE POLICY "expense_receipts_storage_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts' AND is_owner(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_receipts_expense_id ON public.expense_receipts(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_templates_next_due_date ON public.expense_templates(next_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_expenses_incurred_at ON public.expenses(incurred_at);