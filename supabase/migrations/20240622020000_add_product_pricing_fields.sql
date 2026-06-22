-- Add pricing fields to products so admin saves can persist localized prices without schema cache errors.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_pkr DECIMAL(10,2);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_aed DECIMAL(10,2);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);

COMMENT ON COLUMN products.price_pkr IS 'Localized product price shown for Pakistan storefront/admin workflows.';
COMMENT ON COLUMN products.price_aed IS 'Localized product price shown for UAE storefront/admin workflows.';
COMMENT ON COLUMN products.compare_at_price IS 'Original product price before discount.';
