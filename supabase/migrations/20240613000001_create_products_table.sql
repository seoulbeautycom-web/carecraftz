-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sku TEXT UNIQUE,
  weight DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read active products (for storefront)
CREATE POLICY "Allow public to view active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policy: Allow admins to manage all products
CREATE POLICY "Allow admins full access to products"
ON products FOR ALL
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

-- Create trigger for products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
