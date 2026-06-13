-- Add tag1 and tag2 fields for product display tags
ALTER TABLE products ADD COLUMN tag1 TEXT;
ALTER TABLE products ADD COLUMN tag2 TEXT;

-- Add comments to explain usage
COMMENT ON COLUMN products.tag1 IS 'Primary tag line (e.g., ILLUMINATE, UNIFY)';
COMMENT ON COLUMN products.tag2 IS 'Secondary tag line (e.g., TIGHTEN PORES, NOURISH)';
