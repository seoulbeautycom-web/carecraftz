-- Create storage bucket for product images
-- Note: Storage buckets need to be created via Supabase Dashboard or CLI
-- This migration documents the required setup

-- Policies for product-images bucket (when created via dashboard):
-- 1. Allow public to view images
-- 2. Allow authenticated admins to upload/delete images

-- The bucket should be created with:
-- Name: product-images
-- Public: true (so images can be viewed without auth)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- RLS policies for the bucket (run in Supabase SQL editor after creating bucket):

-- Policy: Allow public to view product images
-- CREATE POLICY "Allow public to view product images"
-- ON storage.objects FOR SELECT
-- TO anon, authenticated
-- USING (bucket_id = 'product-images');

-- Policy: Allow admins to upload product images
-- CREATE POLICY "Allow admins to upload product images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'product-images' AND
--   EXISTS (
--     SELECT 1 FROM staff 
--     WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
--   )
-- );

-- Policy: Allow admins to delete product images
-- CREATE POLICY "Allow admins to delete product images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'product-images' AND
--   EXISTS (
--     SELECT 1 FROM staff 
--     WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
--   )
-- );

-- Note: Create the bucket manually in Supabase Dashboard -> Storage -> New Bucket
-- Then run the policies above in the SQL Editor
