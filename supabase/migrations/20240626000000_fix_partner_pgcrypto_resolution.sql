-- Live patch for partner provisioning RPCs.
-- Recreate the partner invite and store provisioning functions so existing databases
-- pick up the pgcrypto resolution fix without needing to replay prior migrations.

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

CREATE OR REPLACE FUNCTION public.provision_partner_store(
  target_slug TEXT,
  display_name TEXT,
  legal_name TEXT,
  primary_email TEXT,
  owner_email TEXT DEFAULT NULL,
  invite_role_code TEXT DEFAULT 'store_owner',
  tenant_type TEXT DEFAULT 'partner',
  status TEXT DEFAULT 'active',
  approval_status TEXT DEFAULT 'approved',
  commission_rate NUMERIC DEFAULT 0,
  branding_json JSONB DEFAULT '{}'::jsonb,
  settings_json JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  resolving_staff_id UUID;
  resolved_slug TEXT;
  created_store_id UUID;
  resolved_owner_email TEXT := lower(trim(COALESCE(owner_email, '')));
  resolved_primary_email TEXT := lower(trim(COALESCE(primary_email, '')));
  resolved_display_name TEXT := trim(COALESCE(display_name, ''));
  resolved_legal_name TEXT := trim(COALESCE(legal_name, ''));
  token TEXT;
  invite_token_hash TEXT;
  invite_row public.partner_invites%ROWTYPE;
  role_row public.partner_roles%ROWTYPE;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.approve', 'partners.provision', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  IF resolved_display_name = '' THEN
    RAISE EXCEPTION 'Display name is required' USING ERRCODE = 'P0001';
  END IF;

  IF resolved_legal_name = '' THEN
    RAISE EXCEPTION 'Legal name is required' USING ERRCODE = 'P0001';
  END IF;

  IF resolved_primary_email = '' THEN
    RAISE EXCEPTION 'Primary email is required' USING ERRCODE = 'P0001';
  END IF;

  resolved_slug := public.generate_unique_partner_slug(
    COALESCE(
      NULLIF(trim(COALESCE(target_slug, '')), ''),
      resolved_display_name,
      'partner-store'
    )
  );
  resolving_staff_id := public.current_staff_id();

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
    resolved_slug,
    tenant_type,
    resolved_display_name,
    resolved_legal_name,
    resolved_primary_email,
    status,
    approval_status,
    COALESCE(commission_rate, 0),
    COALESCE(branding_json, '{}'::jsonb),
    COALESCE(settings_json, '{}'::jsonb),
    CASE WHEN approval_status = 'approved' THEN resolving_staff_id ELSE NULL END,
    CASE WHEN approval_status = 'approved' THEN NOW() ELSE NULL END,
    NOW(),
    NOW()
  )
  RETURNING id INTO created_store_id;

  IF resolved_owner_email <> '' THEN
    SELECT *
    INTO role_row
    FROM public.partner_roles
    WHERE code = invite_role_code
    LIMIT 1;

    IF role_row.id IS NULL THEN
      RAISE EXCEPTION 'Partner role not found' USING ERRCODE = 'P0002';
    END IF;

    token := encode(extensions.gen_random_bytes(24), 'hex');
    invite_token_hash := encode(extensions.digest(token, 'sha256'), 'hex');

    INSERT INTO public.partner_invites (
      partner_store_id,
      email,
      role_code,
      token_hash,
      invited_by_staff_id,
      invited_by_member_id,
      invited_at,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      created_store_id,
      resolved_owner_email,
      role_row.code,
      invite_token_hash,
      resolving_staff_id,
      NULL,
      NOW(),
      NOW() + INTERVAL '7 days',
      NOW(),
      NOW()
    )
    RETURNING * INTO invite_row;
  END IF;

  RETURN jsonb_build_object(
    'partner_store_id', created_store_id,
    'slug', resolved_slug,
    'display_name', resolved_display_name,
    'legal_name', resolved_legal_name,
    'primary_email', resolved_primary_email,
    'tenant_type', tenant_type,
    'status', status,
    'approval_status', approval_status,
    'invite_id', invite_row.id,
    'invite_url', CASE
      WHEN resolved_owner_email <> '' THEN '/' || resolved_slug || '/claim?token=' || token
      ELSE NULL
    END
  );
END;
$$;
