-- Operational settings (payments, shipping, notifications, etc.) + launch waitlist

CREATE TABLE IF NOT EXISTS public.platform_ops_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'primary' CHECK (singleton_key = 'primary'),
  payments JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  security JSONB NOT NULL DEFAULT '{}'::jsonb,
  themes JSONB NOT NULL DEFAULT '{}'::jsonb,
  domain JSONB NOT NULL DEFAULT '{}'::jsonb,
  announcements JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

COMMENT ON TABLE public.platform_ops_settings IS 'Singleton CareCraftz operational settings edited in Admin → Settings.';

INSERT INTO public.platform_ops_settings (
  singleton_key,
  payments,
  shipping,
  notifications,
  security,
  themes,
  domain,
  announcements
) VALUES (
  'primary',
  jsonb_build_object(
    'cod_enabled', true,
    'card_enabled', false,
    'default_currency', 'AED',
    'accepted_currencies', jsonb_build_array('AED', 'PKR'),
    'notes', ''
  ),
  jsonb_build_object(
    'uae_flat_rate', 15,
    'pakistan_flat_rate', 200,
    'free_shipping_threshold_aed', 0,
    'free_shipping_threshold_pkr', 0,
    'estimated_days_uae', '1-3 business days',
    'estimated_days_pakistan', '3-7 business days'
  ),
  jsonb_build_object(
    'email_new_order', true,
    'email_low_stock', true,
    'email_partner_application', true,
    'email_review_submitted', false
  ),
  jsonb_build_object(
    'require_staff_2fa', false,
    'session_timeout_hours', 72,
    'password_min_length', 8
  ),
  jsonb_build_object(
    'primary_color', '#4F46E5',
    'accent_color', '#7B68EE',
    'announcement_bg', '#7B68EE'
  ),
  jsonb_build_object(
    'primary_domain', 'carecraftz.com',
    'www_redirect', true,
    'force_https', true
  ),
  jsonb_build_array(
    'Every seller is verified before products go live',
    'Authentic skincare — curated for UAE and Pakistan',
    'Business docs, certs, and testing reviewed by our team',
    'CareCraftz Official is one verified seller among many'
  )
)
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE public.platform_ops_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view platform ops settings" ON public.platform_ops_settings;
CREATE POLICY "Public can view platform ops settings"
  ON public.platform_ops_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can update platform ops settings" ON public.platform_ops_settings;
CREATE POLICY "Staff can update platform ops settings"
  ON public.platform_ops_settings
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

DROP POLICY IF EXISTS "Staff can insert platform ops settings" ON public.platform_ops_settings;
CREATE POLICY "Staff can insert platform ops settings"
  ON public.platform_ops_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  );

CREATE TABLE IF NOT EXISTS public.launch_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'future-launches',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT launch_waitlist_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS launch_waitlist_created_at_idx ON public.launch_waitlist (created_at DESC);

ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can join launch waitlist" ON public.launch_waitlist;
CREATE POLICY "Public can join launch waitlist"
  ON public.launch_waitlist
  FOR INSERT
  WITH CHECK (email ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');

DROP POLICY IF EXISTS "Staff can view launch waitlist" ON public.launch_waitlist;
CREATE POLICY "Staff can view launch waitlist"
  ON public.launch_waitlist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE lower(s.email) = lower(auth.jwt() ->> 'email')
        AND coalesce(s.is_active, true) = true
    )
  );
