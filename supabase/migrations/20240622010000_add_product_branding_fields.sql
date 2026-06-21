-- Add branding fields to products so admin can manage product-level brand identity.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS brand_logo TEXT,
  ADD COLUMN IF NOT EXISTS seller_name TEXT;

COMMENT ON COLUMN products.brand_name IS 'Brand name shown in admin and storefront product detail views.';
COMMENT ON COLUMN products.brand_logo IS 'Public URL for the product brand logo image.';
COMMENT ON COLUMN products.seller_name IS 'Seller or merchant name associated with the product.';
