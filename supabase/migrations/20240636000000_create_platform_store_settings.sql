-- Singleton platform store identity (CareCraftz My Store setup)
CREATE TABLE IF NOT EXISTS public.platform_store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'primary' CHECK (singleton_key = 'primary'),
  name TEXT NOT NULL DEFAULT 'CareCraftz',
  website_url TEXT NOT NULL DEFAULT 'carecraftz.com',
  email TEXT NOT NULL DEFAULT 'hello@carecraftz.com',
  phone TEXT NOT NULL DEFAULT '',
  location_code TEXT NOT NULL DEFAULT 'UAE' CHECK (location_code IN ('UAE', 'Pakistan')),
  street TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  postal TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'AED',
  timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
  tagline TEXT NOT NULL DEFAULT 'A trusted skincare marketplace. We verify every seller so you can shop authentic products with confidence.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

COMMENT ON TABLE public.platform_store_settings IS 'Singleton CareCraftz storefront identity edited via My Store setup.';

INSERT INTO public.platform_store_settings (
  singleton_key,
  name,
  website_url,
  email,
  phone,
  location_code,
  currency,
  timezone,
  tagline
) VALUES (
  'primary',
  'CareCraftz',
  'carecraftz.com',
  'hello@carecraftz.com',
  '+971 50 000 0000',
  'UAE',
  'AED',
  'Asia/Dubai',
  'A trusted skincare marketplace. We verify every seller so you can shop authentic products with confidence.'
)
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE public.platform_store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view platform store settings" ON public.platform_store_settings;
CREATE POLICY "Public can view platform store settings"
  ON public.platform_store_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can update platform store settings" ON public.platform_store_settings;
CREATE POLICY "Staff can update platform store settings"
  ON public.platform_store_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  );

DROP POLICY IF EXISTS "Staff can insert platform store settings" ON public.platform_store_settings;
CREATE POLICY "Staff can insert platform store settings"
  ON public.platform_store_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  );
