CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS partner_store_id UUID REFERENCES public.partner_stores(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS partner_store_id UUID REFERENCES public.partner_stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_partner_store_id ON public.products(partner_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_store_id ON public.orders(partner_store_id);

CREATE TABLE IF NOT EXISTS public.partner_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'tenant' CHECK (scope = 'tenant'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  module TEXT NOT NULL DEFAULT 'tenant',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_role_id UUID NOT NULL REFERENCES public.partner_roles(id) ON DELETE CASCADE,
  partner_permission_id UUID NOT NULL REFERENCES public.partner_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_role_id, partner_permission_id)
);

CREATE TABLE IF NOT EXISTS public.partner_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id UUID NOT NULL REFERENCES public.partner_stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  invited_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  invited_by_member_id UUID REFERENCES public.partner_members(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_store_id, user_id),
  UNIQUE (partner_store_id, email)
);

CREATE TABLE IF NOT EXISTS public.partner_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_member_id UUID NOT NULL REFERENCES public.partner_members(id) ON DELETE CASCADE,
  partner_role_id UUID NOT NULL REFERENCES public.partner_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_member_id, partner_role_id)
);

CREATE TABLE IF NOT EXISTS public.partner_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id UUID NOT NULL REFERENCES public.partner_stores(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_code TEXT NOT NULL DEFAULT 'store_owner',
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  invited_by_member_id UUID REFERENCES public.partner_members(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_roles_code ON public.partner_roles(code);
CREATE INDEX IF NOT EXISTS idx_partner_permissions_code ON public.partner_permissions(code);
CREATE INDEX IF NOT EXISTS idx_partner_members_store_id ON public.partner_members(partner_store_id);
CREATE INDEX IF NOT EXISTS idx_partner_members_user_id ON public.partner_members(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_store_id ON public.partner_invites(partner_store_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_token_hash ON public.partner_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_partner_invites_email ON public.partner_invites(email);
CREATE INDEX IF NOT EXISTS idx_partner_member_roles_member_id ON public.partner_member_roles(partner_member_id);
CREATE INDEX IF NOT EXISTS idx_partner_member_roles_role_id ON public.partner_member_roles(partner_role_id);
CREATE INDEX IF NOT EXISTS idx_partner_role_permissions_role_id ON public.partner_role_permissions(partner_role_id);
CREATE INDEX IF NOT EXISTS idx_partner_role_permissions_permission_id ON public.partner_role_permissions(partner_permission_id);

ALTER TABLE public.partner_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.partner_accessible_store_rows()
RETURNS TABLE (
  store_id UUID,
  slug TEXT,
  display_name TEXT,
  legal_name TEXT,
  tenant_type TEXT,
  status TEXT,
  approval_status TEXT,
  role_codes TEXT[],
  permissions TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH accessible_memberships AS (
    SELECT
      pm.id AS member_id,
      pm.partner_store_id,
      ps.slug,
      ps.display_name,
      ps.legal_name,
      ps.tenant_type,
      ps.status,
      ps.approval_status
    FROM public.partner_members pm
    JOIN public.partner_stores ps ON ps.id = pm.partner_store_id
    WHERE pm.user_id = auth.uid()
      AND pm.status = 'active'
      AND ps.status = 'active'
      AND ps.approval_status = 'approved'
  ),
  role_rows AS (
    SELECT DISTINCT
      am.partner_store_id AS store_id,
      pr.code AS role_code,
      pr.sort_order AS role_sort_order
    FROM accessible_memberships am
    JOIN public.partner_members pm ON pm.id = am.member_id
    JOIN public.partner_member_roles pmr ON pmr.partner_member_id = pm.id
    JOIN public.partner_roles pr ON pr.id = pmr.partner_role_id
  ),
  permission_rows AS (
    SELECT DISTINCT
      am.partner_store_id AS store_id,
      pp.code AS permission_code,
      pp.sort_order AS permission_sort_order
    FROM accessible_memberships am
    JOIN public.partner_members pm ON pm.id = am.member_id
    JOIN public.partner_member_roles pmr ON pmr.partner_member_id = pm.id
    JOIN public.partner_role_permissions prp ON prp.partner_role_id = pmr.partner_role_id
    JOIN public.partner_permissions pp ON pp.id = prp.partner_permission_id
  )
  SELECT
    am.partner_store_id AS store_id,
    am.slug,
    am.display_name,
    am.legal_name,
    am.tenant_type,
    am.status,
    am.approval_status,
    COALESCE(
      (
        SELECT array_agg(rr.role_code ORDER BY rr.role_sort_order, rr.role_code)
        FROM role_rows rr
        WHERE rr.store_id = am.partner_store_id
      ),
      ARRAY[]::text[]
    ) AS role_codes,
    COALESCE(
      (
        SELECT array_agg(pr.permission_code ORDER BY pr.permission_sort_order, pr.permission_code)
        FROM permission_rows pr
        WHERE pr.store_id = am.partner_store_id
      ),
      ARRAY[]::text[]
    ) AS permissions
  FROM accessible_memberships am
  ORDER BY am.slug;
$$;

CREATE OR REPLACE FUNCTION public.current_partner_permission_codes(target_store_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT array_agg(permission_row.permission_code ORDER BY permission_row.permission_sort_order, permission_row.permission_code)
      FROM (
        SELECT DISTINCT
          pp.code AS permission_code,
          pp.sort_order AS permission_sort_order
        FROM public.partner_members pm
        JOIN public.partner_member_roles pmr ON pmr.partner_member_id = pm.id
        JOIN public.partner_role_permissions prp ON prp.partner_role_id = pmr.partner_role_id
        JOIN public.partner_permissions pp ON pp.id = prp.partner_permission_id
        WHERE pm.user_id = auth.uid()
          AND pm.partner_store_id = target_store_id
          AND pm.status = 'active'
      ) AS permission_row
    ),
    ARRAY[]::text[]
  );
$$;

CREATE OR REPLACE FUNCTION public.current_partner_has_any_permission(target_store_id UUID, required_permissions TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT CASE
    WHEN COALESCE(array_length(required_permissions, 1), 0) = 0 THEN true
    ELSE EXISTS (
      SELECT 1
      FROM unnest(public.current_partner_permission_codes(target_store_id)) AS permission_code
      WHERE permission_code = ANY (COALESCE(required_permissions, ARRAY[]::text[]))
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.current_partner_store_access_exists(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_members pm
    JOIN public.partner_stores ps ON ps.id = pm.partner_store_id
    WHERE pm.user_id = auth.uid()
      AND pm.partner_store_id = target_store_id
      AND pm.status = 'active'
      AND ps.status = 'active'
      AND ps.approval_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_partner_access_snapshot(target_slug TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalized_slug TEXT := CASE WHEN target_slug IS NULL OR btrim(target_slug) = '' THEN NULL ELSE public.normalize_partner_slug(target_slug) END;
  accessible_store_count INTEGER := 0;
  accessible_stores JSONB := '[]'::jsonb;
  selected_store_id UUID;
  selected_slug TEXT;
  selected_display_name TEXT;
  selected_legal_name TEXT;
  selected_tenant_type TEXT;
  selected_status TEXT;
  selected_approval_status TEXT;
  selected_role_codes TEXT[] := ARRAY[]::text[];
  selected_permissions TEXT[] := ARRAY[]::text[];
  selected_member_exists BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'is_authorized', false,
      'reason', 'not_authenticated',
      'accessible_stores', '[]'::jsonb,
      'role_codes', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  SELECT
    COUNT(*),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'store_id', store_id,
          'slug', slug,
          'display_name', display_name,
          'legal_name', legal_name,
          'tenant_type', tenant_type,
          'status', status,
          'approval_status', approval_status,
          'role_codes', to_jsonb(role_codes),
          'permissions', to_jsonb(permissions)
        )
        ORDER BY slug
      ),
      '[]'::jsonb
    )
  INTO accessible_store_count, accessible_stores
  FROM public.partner_accessible_store_rows();

  IF accessible_store_count = 0 THEN
    RETURN jsonb_build_object(
      'is_authorized', false,
      'reason', 'partner_membership_missing',
      'accessible_stores', accessible_stores,
      'role_codes', '[]'::jsonb,
      'permissions', '[]'::jsonb
    );
  END IF;

  IF normalized_slug IS NOT NULL THEN
    SELECT
      store_id,
      slug,
      display_name,
      legal_name,
      tenant_type,
      status,
      approval_status,
      role_codes,
      permissions
    INTO
      selected_store_id,
      selected_slug,
      selected_display_name,
      selected_legal_name,
      selected_tenant_type,
      selected_status,
      selected_approval_status,
      selected_role_codes,
      selected_permissions
    FROM public.partner_accessible_store_rows()
    WHERE slug = normalized_slug
    LIMIT 1;

    selected_member_exists := selected_store_id IS NOT NULL;

    IF NOT selected_member_exists THEN
      IF EXISTS (
        SELECT 1
        FROM public.partner_stores
        WHERE slug = normalized_slug
      ) THEN
        RETURN jsonb_build_object(
          'is_authorized', false,
          'reason', 'store_access_denied',
          'accessible_stores', accessible_stores,
          'role_codes', '[]'::jsonb,
          'permissions', '[]'::jsonb
        );
      END IF;

      RETURN jsonb_build_object(
        'is_authorized', false,
        'reason', 'store_not_found',
        'accessible_stores', accessible_stores,
        'role_codes', '[]'::jsonb,
        'permissions', '[]'::jsonb
      );
    END IF;
  ELSE
    SELECT
      store_id,
      slug,
      display_name,
      legal_name,
      tenant_type,
      status,
      approval_status,
      role_codes,
      permissions
    INTO
      selected_store_id,
      selected_slug,
      selected_display_name,
      selected_legal_name,
      selected_tenant_type,
      selected_status,
      selected_approval_status,
      selected_role_codes,
      selected_permissions
    FROM public.partner_accessible_store_rows()
    ORDER BY slug
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'is_authorized', true,
    'reason', NULL,
    'user_id', auth.uid(),
    'store_id', selected_store_id,
    'slug', selected_slug,
    'display_name', selected_display_name,
    'legal_name', selected_legal_name,
    'tenant_type', selected_tenant_type,
    'status', selected_status,
    'approval_status', selected_approval_status,
    'role_codes', to_jsonb(COALESCE(selected_role_codes, ARRAY[]::text[])),
    'permissions', to_jsonb(COALESCE(selected_permissions, ARRAY[]::text[])),
    'accessible_stores', accessible_stores,
    'landing_path', CASE
      WHEN normalized_slug IS NOT NULL THEN '/' || selected_slug || '/dashboard'
      WHEN accessible_store_count = 1 THEN '/' || selected_slug || '/dashboard'
      ELSE NULL
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_store_products(target_slug TEXT)
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalized_slug TEXT := public.normalize_partner_slug(target_slug);
  target_store_id UUID;
  permission_codes TEXT[] := ARRAY[]::text[];
BEGIN
  SELECT store_id
  INTO target_store_id
  FROM public.partner_accessible_store_rows()
  WHERE slug = normalized_slug
  LIMIT 1;

  IF target_store_id IS NULL THEN
    RAISE EXCEPTION 'Partner store not found or not accessible' USING ERRCODE = 'P0002';
  END IF;

  permission_codes := public.current_partner_permission_codes(target_store_id);

  IF NOT (
    'partner.products.view' = ANY(permission_codes)
    OR 'partner.products.create' = ANY(permission_codes)
    OR 'partner.products.edit' = ANY(permission_codes)
    OR 'partner.products.delete' = ANY(permission_codes)
    OR 'partner.dashboard.view' = ANY(permission_codes)
    OR 'partner.settings.view' = ANY(permission_codes)
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.products p
  WHERE p.partner_store_id = target_store_id
  ORDER BY p.created_at DESC;
END;
$$;

DROP POLICY IF EXISTS "Allow partner members to view products via tenant RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow partner members to create products via tenant RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow partner members to update products via tenant RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow partner members to delete products via tenant RBAC" ON public.products;

CREATE POLICY "Allow partner members to view products via tenant RBAC"
ON public.products
FOR SELECT
TO authenticated
USING (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(
    partner_store_id,
    ARRAY['partner.products.view', 'partner.products.create', 'partner.products.edit', 'partner.products.delete']
  )
);

CREATE POLICY "Allow partner members to create products via tenant RBAC"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.products.create'])
);

CREATE POLICY "Allow partner members to update products via tenant RBAC"
ON public.products
FOR UPDATE
TO authenticated
USING (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.products.edit'])
)
WITH CHECK (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.products.edit'])
);

CREATE POLICY "Allow partner members to delete products via tenant RBAC"
ON public.products
FOR DELETE
TO authenticated
USING (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.products.delete'])
);

DROP POLICY IF EXISTS "Allow partner members to view orders via tenant RBAC" ON public.orders;
DROP POLICY IF EXISTS "Allow partner members to update orders via tenant RBAC" ON public.orders;

CREATE POLICY "Allow partner members to view orders via tenant RBAC"
ON public.orders
FOR SELECT
TO authenticated
USING (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(
    partner_store_id,
    ARRAY['partner.orders.view', 'partner.orders.fulfill', 'partner.orders.export']
  )
);

CREATE POLICY "Allow partner members to update orders via tenant RBAC"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.orders.fulfill'])
)
WITH CHECK (
  partner_store_id IS NOT NULL
  AND public.current_partner_has_any_permission(partner_store_id, ARRAY['partner.orders.fulfill'])
);

CREATE OR REPLACE FUNCTION public.create_partner_invite(
  target_slug TEXT,
  invite_email TEXT,
  role_code TEXT DEFAULT 'store_owner'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  normalized_slug TEXT := public.normalize_partner_slug(target_slug);
  store_row RECORD;
  resolved_role RECORD;
  token TEXT;
  invite_token_hash TEXT;
  permission_codes TEXT[] := ARRAY[]::text[];
  invite_row public.partner_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT store_id, slug, display_name, legal_name, tenant_type, status, approval_status, role_codes, permissions
  INTO store_row
  FROM public.partner_accessible_store_rows()
  WHERE slug = normalized_slug
  LIMIT 1;

  IF store_row.store_id IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.partner_stores
      WHERE slug = normalized_slug
    ) THEN
      RAISE EXCEPTION 'Partner store not accessible' USING ERRCODE = '42501';
    END IF;

    RAISE EXCEPTION 'Partner store not found' USING ERRCODE = 'P0002';
  END IF;

  permission_codes := COALESCE(store_row.permissions, ARRAY[]::text[]);

  IF NOT (
    'partner.invites.manage' = ANY(permission_codes)
    OR 'partner.members.manage' = ANY(permission_codes)
    OR 'partner.settings.edit' = ANY(permission_codes)
    OR public.rbac_has_any_permission(ARRAY['roles.manage'])
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO resolved_role
  FROM public.partner_roles
  WHERE code = role_code
  LIMIT 1;

  IF resolved_role.id IS NULL THEN
    RAISE EXCEPTION 'Partner role not found' USING ERRCODE = 'P0002';
  END IF;

  token := encode(extensions.gen_random_bytes(24), 'hex');
  invite_token_hash := encode(extensions.digest(token, 'sha256'), 'hex');

  INSERT INTO public.partner_invites (
    partner_store_id,
    email,
    role_code,
    token_hash,
    invited_by_member_id,
    invited_at,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    store_row.store_id,
    lower(trim(invite_email)),
    resolved_role.code,
    invite_token_hash,
    NULL,
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  )
  RETURNING * INTO invite_row;

  RETURN jsonb_build_object(
    'invite_id', invite_row.id,
    'partner_store_id', invite_row.partner_store_id,
    'role_code', invite_row.role_code,
    'email', invite_row.email,
    'token', token,
    'invite_url', '/' || normalized_slug || '/claim?token=' || token,
    'expires_at', invite_row.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_partner_invite(
  invite_token TEXT,
  full_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  invite_token_hash TEXT := encode(extensions.digest(trim(invite_token), 'sha256'), 'hex');
  invite_row public.partner_invites%ROWTYPE;
  role_row public.partner_roles%ROWTYPE;
  member_row public.partner_members%ROWTYPE;
  current_email TEXT := lower(COALESCE(auth.jwt() ->> 'email', ''));
  resolved_full_name TEXT := COALESCE(NULLIF(trim(COALESCE(full_name, '')), ''), NULLIF(trim(COALESCE(auth.jwt() ->> 'full_name', '')), ''), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF trim(COALESCE(invite_token, '')) = '' THEN
    RAISE EXCEPTION 'Invite token is required' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO invite_row
  FROM public.partner_invites pi
  WHERE pi.token_hash = invite_token_hash
    AND revoked_at IS NULL
    AND accepted_at IS NULL
    AND expires_at > NOW()
  LIMIT 1
  FOR UPDATE;

  IF invite_row.id IS NULL THEN
    RAISE EXCEPTION 'Invite token is invalid or expired' USING ERRCODE = 'P0002';
  END IF;

  IF current_email = '' THEN
    RAISE EXCEPTION 'Signed in account does not expose an email address' USING ERRCODE = 'P0001';
  END IF;

  IF lower(invite_row.email) <> current_email THEN
    RAISE EXCEPTION 'Invite email does not match the signed in account' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO role_row
  FROM public.partner_roles
  WHERE code = invite_row.role_code
  LIMIT 1;

  IF role_row.id IS NULL THEN
    RAISE EXCEPTION 'Invite role is invalid' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.partner_members (
    partner_store_id,
    user_id,
    email,
    full_name,
    status,
    invited_at,
    joined_at,
    created_at,
    updated_at
  ) VALUES (
    invite_row.partner_store_id,
    auth.uid(),
    lower(trim(invite_row.email)),
    resolved_full_name,
    'active',
    invite_row.invited_at,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (partner_store_id, email)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = CASE
      WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
      ELSE public.partner_members.full_name
    END,
    status = 'active',
    joined_at = COALESCE(public.partner_members.joined_at, NOW()),
    updated_at = NOW()
  RETURNING * INTO member_row;

  INSERT INTO public.partner_member_roles (
    partner_member_id,
    partner_role_id,
    created_at,
    updated_at
  ) VALUES (
    member_row.id,
    role_row.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (partner_member_id, partner_role_id) DO UPDATE
  SET updated_at = NOW();

  UPDATE public.partner_invites
  SET
    accepted_at = NOW(),
    accepted_by_user_id = auth.uid(),
    updated_at = NOW()
  WHERE id = invite_row.id;

  RETURN jsonb_build_object(
    'member_id', member_row.id,
    'partner_store_id', member_row.partner_store_id,
    'store_slug', (
      SELECT ps.slug
      FROM public.partner_stores ps
      WHERE ps.id = member_row.partner_store_id
      LIMIT 1
    ),
    'role_code', role_row.code,
    'email', member_row.email,
    'full_name', member_row.full_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_store_members(target_slug TEXT)
RETURNS TABLE (
  member_id UUID,
  store_id UUID,
  slug TEXT,
  email TEXT,
  full_name TEXT,
  status TEXT,
  role_codes TEXT[],
  permissions TEXT[],
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH target_store AS (
    SELECT store_id, slug
    FROM public.partner_accessible_store_rows()
    WHERE slug = public.normalize_partner_slug(target_slug)
      AND public.current_partner_has_any_permission(store_id, ARRAY['partner.members.view', 'partner.members.manage'])
    LIMIT 1
  ),
  member_rows AS (
    SELECT
      pm.id,
      pm.partner_store_id,
      ps.slug,
      pm.email,
      pm.full_name,
      pm.status,
      pm.invited_at,
      pm.joined_at,
      pm.created_at,
      pm.updated_at
    FROM target_store ts
    JOIN public.partner_members pm ON pm.partner_store_id = ts.store_id
    JOIN public.partner_stores ps ON ps.id = pm.partner_store_id
  ),
  role_rows AS (
    SELECT DISTINCT
      mr.id AS member_id,
      pr.code AS role_code,
      pr.sort_order AS role_sort_order
    FROM member_rows mr
    JOIN public.partner_member_roles pmr ON pmr.partner_member_id = mr.id
    JOIN public.partner_roles pr ON pr.id = pmr.partner_role_id
  ),
  permission_rows AS (
    SELECT DISTINCT
      mr.id AS member_id,
      pp.code AS permission_code,
      pp.sort_order AS permission_sort_order
    FROM member_rows mr
    JOIN public.partner_member_roles pmr ON pmr.partner_member_id = mr.id
    JOIN public.partner_role_permissions prp ON prp.partner_role_id = pmr.partner_role_id
    JOIN public.partner_permissions pp ON pp.id = prp.partner_permission_id
  )
  SELECT
    mr.id AS member_id,
    mr.partner_store_id AS store_id,
    mr.slug,
    mr.email,
    mr.full_name,
    mr.status,
    COALESCE(
      (
        SELECT array_agg(rr.role_code ORDER BY rr.role_sort_order, rr.role_code)
        FROM role_rows rr
        WHERE rr.member_id = mr.id
      ),
      ARRAY[]::text[]
    ) AS role_codes,
    COALESCE(
      (
        SELECT array_agg(pr.permission_code ORDER BY pr.permission_sort_order, pr.permission_code)
        FROM permission_rows pr
        WHERE pr.member_id = mr.id
      ),
      ARRAY[]::text[]
    ) AS permissions,
    mr.invited_at,
    mr.joined_at,
    mr.created_at,
    mr.updated_at
  FROM member_rows mr
  ORDER BY mr.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_store_invites(target_slug TEXT)
RETURNS TABLE (
  invite_id UUID,
  store_id UUID,
  slug TEXT,
  email TEXT,
  role_code TEXT,
  invited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH target_store AS (
    SELECT store_id, slug
    FROM public.partner_accessible_store_rows()
    WHERE slug = public.normalize_partner_slug(target_slug)
      AND public.current_partner_has_any_permission(store_id, ARRAY['partner.invites.view', 'partner.invites.manage'])
    LIMIT 1
  )
  SELECT
    pi.id AS invite_id,
    pi.partner_store_id AS store_id,
    ps.slug,
    pi.email,
    pi.role_code,
    pi.invited_at,
    pi.expires_at,
    pi.accepted_at,
    pi.revoked_at,
    pi.created_at,
    pi.updated_at
  FROM target_store ts
  JOIN public.partner_invites pi ON pi.partner_store_id = ts.store_id
  JOIN public.partner_stores ps ON ps.id = pi.partner_store_id
  ORDER BY pi.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_partner_store_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  flagship_store_id UUID;
BEGIN
  IF NEW.partner_store_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
  INTO flagship_store_id
  FROM public.partner_stores
  WHERE slug = 'carecraftz'
  LIMIT 1;

  IF flagship_store_id IS NOT NULL THEN
    NEW.partner_store_id := flagship_store_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_products_partner_store_id ON public.products;
CREATE TRIGGER set_products_partner_store_id
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_partner_store_id();

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
  NULL,
  'carecraftz',
  'flagship',
  'CareCraftz',
  'CareCraftz',
  'admin@carecraftz.com',
  'active',
  'approved',
  0,
  '{}'::jsonb,
  '{}'::jsonb,
  NULL,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  tenant_type = EXCLUDED.tenant_type,
  display_name = EXCLUDED.display_name,
  legal_name = EXCLUDED.legal_name,
  primary_email = EXCLUDED.primary_email,
  status = 'active',
  approval_status = 'approved',
  approved_at = COALESCE(public.partner_stores.approved_at, NOW()),
  updated_at = NOW();

UPDATE public.products
SET partner_store_id = flagship_store.id
FROM (
  SELECT id
  FROM public.partner_stores
  WHERE slug = 'carecraftz'
  LIMIT 1
) AS flagship_store
WHERE public.products.partner_store_id IS NULL
  AND flagship_store.id IS NOT NULL;

UPDATE public.orders
SET partner_store_id = flagship_store.id
FROM (
  SELECT id
  FROM public.partner_stores
  WHERE slug = 'carecraftz'
  LIMIT 1
) AS flagship_store
WHERE public.orders.partner_store_id IS NULL
  AND flagship_store.id IS NOT NULL;

INSERT INTO public.partner_permissions (code, name, description, module, sort_order)
VALUES
  ('partner.dashboard.view', 'View tenant dashboard', 'Open the tenant portal dashboard.', 'partner', 10),
  ('partner.products.view', 'View tenant products', 'See products in the current store.', 'partner', 20),
  ('partner.products.create', 'Create tenant products', 'Create products for the current store.', 'partner', 21),
  ('partner.products.edit', 'Edit tenant products', 'Edit products for the current store.', 'partner', 22),
  ('partner.products.delete', 'Delete tenant products', 'Delete products from the current store.', 'partner', 23),
  ('partner.orders.view', 'View tenant orders', 'See orders for the current store.', 'partner', 30),
  ('partner.orders.fulfill', 'Fulfill tenant orders', 'Advance tenant orders through fulfillment.', 'partner', 31),
  ('partner.orders.export', 'Export tenant orders', 'Export tenant order data.', 'partner', 32),
  ('partner.members.view', 'View tenant members', 'See members who belong to the current store.', 'partner', 40),
  ('partner.members.manage', 'Manage tenant members', 'Manage membership records for the current store.', 'partner', 41),
  ('partner.invites.view', 'View tenant invites', 'See pending and accepted invite records.', 'partner', 50),
  ('partner.invites.manage', 'Manage tenant invites', 'Create and revoke invite tokens.', 'partner', 51),
  ('partner.settings.view', 'View tenant settings', 'Open tenant store settings.', 'partner', 60),
  ('partner.settings.edit', 'Edit tenant settings', 'Change tenant store settings.', 'partner', 61)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.partner_roles (code, name, description, scope, sort_order)
VALUES
  ('store_owner', 'Store owner', 'Full tenant access for the store owner.', 'tenant', 10),
  ('catalog_manager', 'Catalog manager', 'Manages products and store content.', 'tenant', 20),
  ('support_manager', 'Support manager', 'Handles orders, support, and member operations.', 'tenant', 30),
  ('viewer', 'Viewer', 'Read-only access to the tenant portal.', 'tenant', 40)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.partner_role_permissions (partner_role_id, partner_permission_id)
SELECT r.id, p.id
FROM (
  VALUES
    ('store_owner', 'partner.dashboard.view'),
    ('store_owner', 'partner.products.view'),
    ('store_owner', 'partner.products.create'),
    ('store_owner', 'partner.products.edit'),
    ('store_owner', 'partner.products.delete'),
    ('store_owner', 'partner.orders.view'),
    ('store_owner', 'partner.orders.fulfill'),
    ('store_owner', 'partner.orders.export'),
    ('store_owner', 'partner.members.view'),
    ('store_owner', 'partner.members.manage'),
    ('store_owner', 'partner.invites.view'),
    ('store_owner', 'partner.invites.manage'),
    ('store_owner', 'partner.settings.view'),
    ('store_owner', 'partner.settings.edit'),
    ('catalog_manager', 'partner.dashboard.view'),
    ('catalog_manager', 'partner.products.view'),
    ('catalog_manager', 'partner.products.create'),
    ('catalog_manager', 'partner.products.edit'),
    ('catalog_manager', 'partner.products.delete'),
    ('catalog_manager', 'partner.orders.view'),
    ('catalog_manager', 'partner.invites.view'),
    ('catalog_manager', 'partner.settings.view'),
    ('support_manager', 'partner.dashboard.view'),
    ('support_manager', 'partner.orders.view'),
    ('support_manager', 'partner.orders.fulfill'),
    ('support_manager', 'partner.orders.export'),
    ('support_manager', 'partner.members.view'),
    ('support_manager', 'partner.invites.view'),
    ('support_manager', 'partner.settings.view'),
    ('viewer', 'partner.dashboard.view'),
    ('viewer', 'partner.products.view'),
    ('viewer', 'partner.orders.view'),
    ('viewer', 'partner.invites.view'),
    ('viewer', 'partner.settings.view')
) AS mapping(role_code, permission_code)
JOIN public.partner_roles r ON r.code = mapping.role_code
JOIN public.partner_permissions p ON p.code = mapping.permission_code
ON CONFLICT (partner_role_id, partner_permission_id) DO NOTHING;

DROP TRIGGER IF EXISTS update_partner_roles_updated_at ON public.partner_roles;
CREATE TRIGGER update_partner_roles_updated_at
BEFORE UPDATE ON public.partner_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_permissions_updated_at ON public.partner_permissions;
CREATE TRIGGER update_partner_permissions_updated_at
BEFORE UPDATE ON public.partner_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_role_permissions_updated_at ON public.partner_role_permissions;
CREATE TRIGGER update_partner_role_permissions_updated_at
BEFORE UPDATE ON public.partner_role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_members_updated_at ON public.partner_members;
CREATE TRIGGER update_partner_members_updated_at
BEFORE UPDATE ON public.partner_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_member_roles_updated_at ON public.partner_member_roles;
CREATE TRIGGER update_partner_member_roles_updated_at
BEFORE UPDATE ON public.partner_member_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_invites_updated_at ON public.partner_invites;
CREATE TRIGGER update_partner_invites_updated_at
BEFORE UPDATE ON public.partner_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
