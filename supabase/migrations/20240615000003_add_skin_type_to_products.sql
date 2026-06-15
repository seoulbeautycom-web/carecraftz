-- Add skin_type field to products for "Shop by Skin Type" homepage section
ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_type TEXT;

-- Add a check constraint to enforce valid skin type values
ALTER TABLE products ADD CONSTRAINT products_skin_type_check
  CHECK (skin_type IS NULL OR skin_type IN ('Oily', 'Dry', 'Combo', 'Sensitive'));

-- Index for fast filtering on homepage
CREATE INDEX IF NOT EXISTS idx_products_skin_type ON products(skin_type);

-- Document the column
COMMENT ON COLUMN products.skin_type IS 'Skin type category: Oily, Dry, Combo, or Sensitive. Used for Shop by Skin Type section on homepage.';
