-- Add barcode support to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;

-- Create app settings table for persistent configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "settings_read_staff" ON public.app_settings 
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "settings_write_owner" ON public.app_settings 
FOR ALL USING (is_owner(auth.uid()));

-- Add demo session tracking columns for demo mode
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS demo_session_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS demo_session_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS demo_session_id TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS demo_session_id TEXT;

-- Insert default settings
INSERT INTO public.app_settings (values) VALUES (
  '{
    "currency": "£",
    "taxInclusive": false,
    "lowStockThreshold": 1,
    "requireStock": true,
    "enableBarcode": true,
    "defaultPayment": "cash",
    "printAfterCheckout": false,
    "demoMode": false
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;