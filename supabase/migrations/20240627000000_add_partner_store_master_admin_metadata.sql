ALTER TABLE public.partner_stores
  ADD COLUMN IF NOT EXISTS master_admin_email TEXT,
  ADD COLUMN IF NOT EXISTS master_admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_stores_master_admin_user_id ON public.partner_stores(master_admin_user_id);

WITH store_owner_member_rows AS (
  SELECT DISTINCT ON (pm.partner_store_id)
    pm.partner_store_id,
    pm.user_id,
    lower(trim(pm.email)) AS email
  FROM public.partner_members pm
  JOIN public.partner_member_roles pmr ON pmr.partner_member_id = pm.id
  JOIN public.partner_roles pr ON pr.id = pmr.partner_role_id
  WHERE pr.code = 'store_owner'
    AND pm.status = 'active'
    AND pm.user_id IS NOT NULL
  ORDER BY pm.partner_store_id, pm.joined_at DESC NULLS LAST, pm.created_at DESC, pm.id DESC
),
store_owner_invite_rows AS (
  SELECT DISTINCT ON (pi.partner_store_id)
    pi.partner_store_id,
    NULL::UUID AS user_id,
    lower(trim(pi.email)) AS email
  FROM public.partner_invites pi
  WHERE pi.role_code = 'store_owner'
    AND pi.revoked_at IS NULL
    AND pi.accepted_at IS NULL
  ORDER BY pi.partner_store_id, pi.invited_at DESC, pi.created_at DESC, pi.id DESC
),
store_owner_source_rows AS (
  SELECT partner_store_id, user_id, email
  FROM store_owner_member_rows
  UNION ALL
  SELECT invite_rows.partner_store_id, invite_rows.user_id, invite_rows.email
  FROM store_owner_invite_rows invite_rows
  WHERE NOT EXISTS (
    SELECT 1
    FROM store_owner_member_rows member_rows
    WHERE member_rows.partner_store_id = invite_rows.partner_store_id
  )
)
UPDATE public.partner_stores ps
SET
  master_admin_user_id = source_rows.user_id,
  master_admin_email = source_rows.email
FROM store_owner_source_rows source_rows
WHERE ps.id = source_rows.partner_store_id
  AND ps.master_admin_user_id IS NULL
  AND ps.master_admin_email IS NULL;

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
    master_admin_email,
    master_admin_user_id,
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
    CASE
      WHEN resolved_owner_email <> '' AND invite_role_code = 'store_owner' THEN resolved_owner_email
      ELSE NULL
    END,
    NULL,
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

  UPDATE public.partner_stores
  SET
    master_admin_email = CASE
      WHEN invite_row.role_code = 'store_owner' THEN lower(trim(invite_row.email))
      ELSE master_admin_email
    END,
    master_admin_user_id = CASE
      WHEN invite_row.role_code = 'store_owner' THEN auth.uid()
      ELSE master_admin_user_id
    END,
    updated_at = NOW()
  WHERE id = invite_row.partner_store_id;

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
