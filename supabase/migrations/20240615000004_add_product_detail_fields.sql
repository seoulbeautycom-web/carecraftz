-- Add how_to_use and ingredients fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT;

COMMENT ON COLUMN products.how_to_use IS 'Step-by-step usage instructions shown on product detail page';
COMMENT ON COLUMN products.ingredients IS 'Full ingredients list shown on product detail page';
COMMENT ON COLUMN products.subtitle IS 'Short subtitle/variant name shown below product title';
