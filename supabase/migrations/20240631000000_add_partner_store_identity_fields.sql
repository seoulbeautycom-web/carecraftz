-- Partner store identity / contact fields for admin editor
ALTER TABLE public.partner_stores
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.partner_stores.logo_url IS 'Public URL for the partner store logo image.';
COMMENT ON COLUMN public.partner_stores.phone IS 'Primary contact phone for the partner store.';
COMMENT ON COLUMN public.partner_stores.country IS 'Country where the partner store operates.';
COMMENT ON COLUMN public.partner_stores.city IS 'City where the partner store is based.';
COMMENT ON COLUMN public.partner_stores.location IS 'Street / area location for the partner store.';
