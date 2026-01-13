-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  address text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  demo_session_id uuid
);

-- Add location_id to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location_id bigint REFERENCES locations(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for locations (same pattern as other tables)
CREATE POLICY "Users can view all locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Users can insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update locations" ON locations FOR UPDATE USING (true);
CREATE POLICY "Users can delete locations" ON locations FOR DELETE USING (true);
