-- Catalog brands: name + logo only
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name_lower ON public.brands (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON public.brands (created_at DESC);

COMMENT ON TABLE public.brands IS 'Product brands managed in admin (name + logo).';
COMMENT ON COLUMN public.brands.name IS 'Brand display name.';
COMMENT ON COLUMN public.brands.logo_url IS 'Public URL for the brand logo image.';

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to view brands" ON public.brands;
CREATE POLICY "Allow public to view brands"
ON public.brands
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow staff to create brands via RBAC" ON public.brands;
CREATE POLICY "Allow staff to create brands via RBAC"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

DROP POLICY IF EXISTS "Allow staff to update brands via RBAC" ON public.brands;
CREATE POLICY "Allow staff to update brands via RBAC"
ON public.brands
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.edit', 'roles.manage'])
);

DROP POLICY IF EXISTS "Allow staff to delete brands via RBAC" ON public.brands;
CREATE POLICY "Allow staff to delete brands via RBAC"
ON public.brands
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.delete', 'roles.manage'])
);
