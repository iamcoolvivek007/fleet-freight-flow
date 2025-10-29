-- Create storage bucket for truck images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('truck-images', 'truck-images', true);

-- Add image columns to trucks table
ALTER TABLE public.trucks 
ADD COLUMN truck_image_url TEXT,
ADD COLUMN driver_image_url TEXT;

-- Create storage policies for truck images
CREATE POLICY "Anyone can view truck images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'truck-images');

CREATE POLICY "Authenticated users can upload truck images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'truck-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own truck images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'truck-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own truck images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'truck-images' 
  AND auth.role() = 'authenticated'
);