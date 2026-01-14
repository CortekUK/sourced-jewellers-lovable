-- Add location_id to sales table to track which shop each sale was made at
ALTER TABLE public.sales ADD COLUMN location_id bigint REFERENCES public.locations(id);

-- Create cash drawer movements table for tracking all cash in/out
CREATE TABLE public.cash_drawer_movements (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  location_id bigint NOT NULL REFERENCES public.locations(id),
  movement_type text NOT NULL CHECK (movement_type IN ('sale_cash_in', 'withdrawal', 'deposit', 'float_set', 'adjustment', 'sale_void_refund')),
  amount numeric NOT NULL,
  reference_sale_id bigint REFERENCES public.sales(id),
  notes text,
  staff_id uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  demo_session_id text
);

-- Enable RLS
ALTER TABLE public.cash_drawer_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_drawer_movements
CREATE POLICY "Staff can view cash movements" 
ON public.cash_drawer_movements 
FOR SELECT 
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert cash movements" 
ON public.cash_drawer_movements 
FOR INSERT 
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Owners and managers can update cash movements" 
ON public.cash_drawer_movements 
FOR UPDATE 
USING (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners can delete cash movements" 
ON public.cash_drawer_movements 
FOR DELETE 
USING (public.is_owner(auth.uid()));

-- Create view for cash drawer balance per location
CREATE OR REPLACE VIEW public.v_cash_drawer_balance AS
SELECT 
  l.id as location_id,
  l.name as location_name,
  COALESCE(SUM(cdm.amount), 0) as current_balance,
  MAX(cdm.created_at) as last_movement_at,
  COUNT(cdm.id) as total_movements
FROM public.locations l
LEFT JOIN public.cash_drawer_movements cdm ON cdm.location_id = l.id
WHERE l.status = 'active'
GROUP BY l.id, l.name;

-- Create index for performance
CREATE INDEX idx_cash_drawer_movements_location ON public.cash_drawer_movements(location_id);
CREATE INDEX idx_cash_drawer_movements_created_at ON public.cash_drawer_movements(created_at DESC);
CREATE INDEX idx_sales_location ON public.sales(location_id);