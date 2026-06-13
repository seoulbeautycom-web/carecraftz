-- Add additional product fields

-- Add discount percentage
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- Add low stock threshold
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Add location (UAE, Pakistan, etc)
ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'UAE';

-- Add delivery charges
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0;

-- Add compare at price (original price before discount)
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);

-- Add featured flag
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add tags array
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create product_images table for gallery
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_images' AND policyname = 'Allow public to view product images'
  ) THEN
    CREATE POLICY "Allow public to view product images"
    ON product_images FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- Policy: Allow admins to manage product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_images' AND policyname = 'Allow admins to manage product images'
  ) THEN
    CREATE POLICY "Allow admins to manage product images"
    ON product_images FOR ALL
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

-- Create index for product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Create storage bucket for product images (if using Supabase Storage)
-- Note: This needs to be done via Supabase Dashboard or Storage API

-- Create index for location
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);

-- Create index for featured products
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
