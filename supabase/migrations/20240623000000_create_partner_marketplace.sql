-- Partner marketplace foundation: public applications, approved partner stores, and admin provisioning RPCs.

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  website TEXT NOT NULL,
  founded_year INTEGER,
  company_size TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  product_categories TEXT[] NOT NULL DEFAULT '{}'::text[],
  product_description TEXT NOT NULL,
  certifications TEXT[] NOT NULL DEFAULT '{}'::text[],
  testing_methods TEXT[] NOT NULL DEFAULT '{}'::text[],
  ingredients_policy TEXT NOT NULL,
  packaging_sustainability TEXT NOT NULL,
  wholesale_margin TEXT NOT NULL,
  minimum_order TEXT NOT NULL,
  lead_time TEXT NOT NULL,
  shipping_locations TEXT[] NOT NULL DEFAULT '{}'::text[],
  why_partner TEXT NOT NULL,
  other_info TEXT NOT NULL DEFAULT '',
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'needs_info', 'approved', 'rejected')),
  review_notes TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE,
  reviewed_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  tenant_type TEXT NOT NULL DEFAULT 'partner' CHECK (tenant_type IN ('flagship', 'partner')),
  display_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  commission_rate NUMERIC(6,2) NOT NULL DEFAULT 0,
  branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_stores ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created_at ON public.partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_applications_slug ON public.partner_applications(slug);
CREATE INDEX IF NOT EXISTS idx_partner_stores_slug ON public.partner_stores(slug);
CREATE INDEX IF NOT EXISTS idx_partner_stores_status ON public.partner_stores(status);
CREATE INDEX IF NOT EXISTS idx_partner_stores_tenant_type ON public.partner_stores(tenant_type);

CREATE OR REPLACE FUNCTION public.normalize_partner_slug(input_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(trim(COALESCE(input_value, '')));
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := regexp_replace(normalized, '-{2,}', '-', 'g');
  normalized := trim(both '-' from normalized);

  IF normalized = '' THEN
    normalized := 'partner-store';
  END IF;

  IF normalized = ANY (ARRAY['admin', 'api', 'login', 'master', 'org', 'partner', 'partners', 'shop', 'store', 'stores']) THEN
    normalized := 'store-' || normalized;
  END IF;

  RETURN left(normalized, 63);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_partner_slug(base_value text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  base_slug text := public.normalize_partner_slug(base_value);
  candidate text := base_slug;
  suffix integer := 0;
BEGIN
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.partner_stores ps
      WHERE ps.slug = candidate
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.partner_applications pa
      WHERE pa.slug = candidate
    );

    suffix := suffix + 1;
    candidate := left(base_slug, GREATEST(1, 63 - length(suffix::text) - 1)) || '-' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_partner_application(
  application_id uuid,
  slug_override text DEFAULT NULL,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  resolved_slug text;
  created_store_id uuid;
  notes text;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.approve', 'partners.provision', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  IF application_row.status = 'approved' THEN
    RAISE EXCEPTION 'Partner application is already approved' USING ERRCODE = 'P0001';
  END IF;

  notes := COALESCE(NULLIF(trim(COALESCE(p_review_notes, '')), ''), application_row.review_notes, '');
  resolved_slug := public.generate_unique_partner_slug(COALESCE(NULLIF(trim(COALESCE(slug_override, '')), ''), application_row.company_name));

  INSERT INTO public.partner_stores (
    application_id,
    slug,
    tenant_type,
    display_name,
    legal_name,
    primary_email,
    status,
    approval_status,
    commission_rate,
    branding_json,
    settings_json,
    approved_by_staff_id,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    application_row.id,
    resolved_slug,
    'partner',
    application_row.company_name,
    application_row.company_name,
    application_row.contact_email,
    'active',
    'approved',
    0,
    '{}'::jsonb,
    '{}'::jsonb,
    resolving_staff_id,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO created_store_id;

  UPDATE public.partner_applications
  SET
    slug = resolved_slug,
    status = 'approved',
    review_notes = notes,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'partner_store_id', created_store_id,
    'slug', resolved_slug,
    'status', 'approved'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_partner_application(
  application_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  notes text;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.reject', 'partners.review', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  notes := COALESCE(NULLIF(trim(COALESCE(p_review_notes, '')), ''), application_row.review_notes, '');

  UPDATE public.partner_applications
  SET
    status = 'rejected',
    review_notes = notes,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    rejected_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'status', 'rejected'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_partner_application_in_review(
  application_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  notes text;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.review', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  notes := COALESCE(NULLIF(trim(COALESCE(p_review_notes, '')), ''), application_row.review_notes, '');

  UPDATE public.partner_applications
  SET
    status = 'in_review',
    review_notes = notes,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'status', 'in_review'
  );
END;
$$;

DROP POLICY IF EXISTS "Allow public to submit partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Allow staff to view partner applications via RBAC" ON public.partner_applications;
DROP POLICY IF EXISTS "Allow staff to update partner applications via RBAC" ON public.partner_applications;
DROP POLICY IF EXISTS "Allow staff to view partner stores via RBAC" ON public.partner_stores;
DROP POLICY IF EXISTS "Allow staff to create partner stores via RBAC" ON public.partner_stores;
DROP POLICY IF EXISTS "Allow staff to update partner stores via RBAC" ON public.partner_stores;
DROP POLICY IF EXISTS "Allow staff to delete partner stores via RBAC" ON public.partner_stores;

CREATE POLICY "Allow public to submit partner applications"
ON public.partner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  terms_accepted = true
  AND terms_accepted_at IS NOT NULL
  AND status = 'submitted'
  AND review_notes = ''
  AND reviewed_by_staff_id IS NULL
  AND reviewed_at IS NULL
  AND approved_at IS NULL
  AND rejected_at IS NULL
  AND slug IS NULL
);

CREATE POLICY "Allow staff to view partner applications via RBAC"
ON public.partner_applications
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['partners.view', 'partners.review', 'partners.approve', 'partners.reject', 'partners.provision', 'partners.manage', 'roles.manage'])
);

CREATE POLICY "Allow staff to update partner applications via RBAC"
ON public.partner_applications
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['partners.review', 'partners.approve', 'partners.reject', 'partners.provision', 'partners.manage', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['partners.review', 'partners.approve', 'partners.reject', 'partners.provision', 'partners.manage', 'roles.manage'])
  AND terms_accepted = true
  AND terms_accepted_at IS NOT NULL
);

CREATE POLICY "Allow staff to view partner stores via RBAC"
ON public.partner_stores
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['partners.view', 'partners.provision', 'partners.manage', 'roles.manage'])
);

CREATE POLICY "Allow staff to create partner stores via RBAC"
ON public.partner_stores
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['partners.approve', 'partners.provision', 'partners.manage', 'roles.manage'])
);

CREATE POLICY "Allow staff to update partner stores via RBAC"
ON public.partner_stores
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['partners.provision', 'partners.manage', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['partners.provision', 'partners.manage', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete partner stores via RBAC"
ON public.partner_stores
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['partners.manage', 'roles.manage'])
);

DROP TRIGGER IF EXISTS update_partner_applications_updated_at ON public.partner_applications;
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_stores_updated_at ON public.partner_stores;
CREATE TRIGGER update_partner_stores_updated_at
BEFORE UPDATE ON public.partner_stores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS partner_applications_rbac_audit_trigger ON public.partner_applications;
CREATE TRIGGER partner_applications_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

DROP TRIGGER IF EXISTS partner_stores_rbac_audit_trigger ON public.partner_stores;
CREATE TRIGGER partner_stores_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.partner_stores
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

INSERT INTO public.permissions (code, name, description, module, sort_order)
VALUES
  ('partners.view', 'View partner applications', 'Review partner applications and approved stores.', 'partners', 40),
  ('partners.review', 'Review partner applications', 'Move partner applications through the review workflow.', 'partners', 41),
  ('partners.approve', 'Approve partner applications', 'Approve applications and provision partner stores.', 'partners', 42),
  ('partners.reject', 'Reject partner applications', 'Reject partner applications after review.', 'partners', 43),
  ('partners.provision', 'Provision partner stores', 'Create partner store records and slug assignments.', 'partners', 44),
  ('partners.manage', 'Manage partner marketplace', 'Manage partner onboarding, stores, and marketplace settings.', 'partners', 45)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (
  VALUES
    ('super_admin', 'partners.view'),
    ('super_admin', 'partners.review'),
    ('super_admin', 'partners.approve'),
    ('super_admin', 'partners.reject'),
    ('super_admin', 'partners.provision'),
    ('super_admin', 'partners.manage'),
    ('admin', 'partners.view'),
    ('admin', 'partners.review'),
    ('admin', 'partners.approve'),
    ('admin', 'partners.reject'),
    ('admin', 'partners.provision'),
    ('admin', 'partners.manage')
) AS mapping(role_code, permission_code)
JOIN public.roles r ON r.code = mapping.role_code
JOIN public.permissions p ON p.code = mapping.permission_code
ON CONFLICT DO NOTHING;
