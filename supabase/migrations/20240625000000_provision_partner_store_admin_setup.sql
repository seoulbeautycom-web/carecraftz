-- Admin provisioning helper for master partners: create a partner store, reserve its slug, and optionally issue the first owner invite.

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

    token := encode(gen_random_bytes(24), 'hex');
    invite_token_hash := encode(digest(token, 'sha256'), 'hex');

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
