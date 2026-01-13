-- Add image_url column to products table
ALTER TABLE public.products 
ADD COLUMN image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Create RLS policies for product images storage
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Staff can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND is_staff(auth.uid()));

CREATE POLICY "Owners can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND is_owner(auth.uid()));

CREATE POLICY "Owners can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND is_owner(auth.uid()));