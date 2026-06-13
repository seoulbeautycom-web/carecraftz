-- Create company product gallery bucket structure
-- Note: Create bucket manually in Supabase Dashboard -> Storage -> New Bucket
-- Name: company-product-gallery
-- Public: true

-- Migration to document the gallery structure and policies

-- Policies for company-product-gallery bucket:

-- Policy: Allow public to view gallery images
-- CREATE POLICY "Allow public to view gallery images"
-- ON storage.objects FOR SELECT
-- TO anon, authenticated
-- USING (bucket_id = 'company-product-gallery');

-- Policy: Allow admins to upload to gallery
-- CREATE POLICY "Allow admins to upload gallery images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'company-product-gallery' AND
--   EXISTS (
--     SELECT 1 FROM staff 
--     WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
--   )
-- );

-- Policy: Allow admins to delete from gallery
-- CREATE POLICY "Allow admins to delete gallery images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'company-product-gallery' AND
--   EXISTS (
--     SELECT 1 FROM staff 
--     WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
--   )
-- );

-- Create table to track gallery image metadata (optional, for organization)
CREATE TABLE IF NOT EXISTS company_gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  used_in_products INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE company_gallery_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view gallery metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_gallery_images' AND policyname = 'Allow public to view gallery'
  ) THEN
    CREATE POLICY "Allow public to view gallery"
    ON company_gallery_images FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- Policy: Allow admins to manage gallery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_gallery_images' AND policyname = 'Allow admins to manage gallery'
  ) THEN
    CREATE POLICY "Allow admins to manage gallery"
    ON company_gallery_images FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM staff 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM staff 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_gallery_tags ON company_gallery_images USING GIN(tags);
