-- Harden admin RBAC so the CMS only exposes data and mutations that match atomic permissions.

CREATE OR REPLACE FUNCTION public.current_staff_permission_codes()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  role_code text;
  role_permissions text[] := ARRAY[]::text[];
  override_permissions text[] := ARRAY[]::text[];
BEGIN
  role_code := public.current_staff_role_code();

  IF public.rbac_is_super_admin() THEN
    SELECT COALESCE(array_agg(permission_row.permission_code ORDER BY permission_row.sort_order, permission_row.permission_code), ARRAY[]::text[])
    INTO role_permissions
    FROM (
      SELECT p.code AS permission_code, MIN(p.sort_order) AS sort_order
      FROM public.permissions p
      GROUP BY p.code
    ) AS permission_row;
  ELSIF role_code IS NOT NULL THEN
    SELECT COALESCE(array_agg(permission_row.permission_code ORDER BY permission_row.sort_order, permission_row.permission_code), ARRAY[]::text[])
    INTO role_permissions
    FROM (
      SELECT p.code AS permission_code, MIN(p.sort_order) AS sort_order
      FROM public.roles r
      JOIN public.role_permissions rp ON rp.role_id = r.id
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE r.code = role_code
      GROUP BY p.code
    ) AS permission_row;
  END IF;

  SELECT COALESCE(array_agg(permission_row.permission_code ORDER BY permission_row.permission_code), ARRAY[]::text[])
  INTO override_permissions
  FROM (
    SELECT DISTINCT permission_entry.key AS permission_code
    FROM public.staff s
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(s.permissions, '{}'::jsonb)) AS permission_entry(key, value)
    WHERE s.user_id = auth.uid()
      AND s.is_active = true
      AND lower(COALESCE(permission_entry.value, '')) IN ('true', '1', 'yes')
  ) AS permission_row;

  RETURN (
    SELECT COALESCE(array_agg(permission_row.permission_code ORDER BY permission_row.permission_code), ARRAY[]::text[])
    FROM (
      SELECT DISTINCT permission_code
      FROM unnest(COALESCE(role_permissions, ARRAY[]::text[]) || COALESCE(override_permissions, ARRAY[]::text[])) AS permission_code
    ) AS permission_row
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rbac_has_permission(permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.rbac_is_super_admin()
  OR permission_code = ANY(public.current_staff_permission_codes());
$$;

CREATE OR REPLACE FUNCTION public.current_admin_access_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  staff_record public.staff%ROWTYPE;
  permission_codes text[] := ARRAY[]::text[];
BEGIN
  SELECT *
  INTO staff_record
  FROM public.staff
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF staff_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'is_authorized', false,
      'reason', 'staff_record_missing',
      'permissions', '[]'::jsonb
    );
  END IF;

  IF staff_record.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'is_authorized', false,
      'reason', 'staff_inactive',
      'staff_id', staff_record.id,
      'user_id', staff_record.user_id,
      'full_name', staff_record.full_name,
      'email', staff_record.email,
      'role_code', COALESCE(public.current_staff_role_code(), 'staff'),
      'permissions', '[]'::jsonb
    );
  END IF;

  permission_codes := public.current_staff_permission_codes();

  RETURN jsonb_build_object(
    'is_authorized', true,
    'reason', NULL,
    'staff_id', staff_record.id,
    'user_id', staff_record.user_id,
    'full_name', staff_record.full_name,
    'email', staff_record.email,
    'role_code', COALESCE(public.current_staff_role_code(), 'staff'),
    'permissions', to_jsonb(COALESCE(permission_codes, ARRAY[]::text[]))
  );
END;
$$;

-- Blog posts: content team can view and manage editorial content.
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow staff to manage all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow staff to view posts via RBAC" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow staff to write posts via RBAC" ON public.blog_posts;

CREATE POLICY "Allow staff to view posts via RBAC"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish', 'content.schedule', 'roles.manage'])
);

CREATE POLICY "Allow staff to write posts via RBAC"
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['content.create', 'content.edit', 'content.delete', 'content.publish', 'content.schedule', 'roles.manage'])
);

CREATE POLICY "Allow staff to update posts via RBAC"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['content.edit', 'content.publish', 'content.schedule', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['content.edit', 'content.publish', 'content.schedule', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete posts via RBAC"
ON public.blog_posts
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['content.delete', 'roles.manage'])
);

-- Reviews: review moderators can view, approve, and delete reviews.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow staff to manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow staff to view reviews via RBAC" ON public.reviews;
DROP POLICY IF EXISTS "Allow staff to moderate reviews via RBAC" ON public.reviews;
DROP POLICY IF EXISTS "Allow staff to delete reviews via RBAC" ON public.reviews;

CREATE POLICY "Allow staff to view reviews via RBAC"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['reviews.view', 'reviews.moderate', 'reviews.delete', 'roles.manage'])
);

CREATE POLICY "Allow staff to moderate reviews via RBAC"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['reviews.moderate', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['reviews.moderate', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete reviews via RBAC"
ON public.reviews
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['reviews.delete', 'roles.manage'])
);

-- Social media and contact info belong to settings/editing permissions.
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow staff to manage social links" ON public.social_media_settings;
DROP POLICY IF EXISTS "Allow staff to view social links via RBAC" ON public.social_media_settings;
DROP POLICY IF EXISTS "Allow staff to write social links via RBAC" ON public.social_media_settings;

CREATE POLICY "Allow staff to view social links via RBAC"
ON public.social_media_settings
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.view', 'settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to write social links via RBAC"
ON public.social_media_settings
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to update social links via RBAC"
ON public.social_media_settings
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete social links via RBAC"
ON public.social_media_settings
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow staff to manage contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Allow staff to view contact info via RBAC" ON public.contact_info;
DROP POLICY IF EXISTS "Allow staff to write contact info via RBAC" ON public.contact_info;

CREATE POLICY "Allow staff to view contact info via RBAC"
ON public.contact_info
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.view', 'settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to write contact info via RBAC"
ON public.contact_info
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to update contact info via RBAC"
ON public.contact_info
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete contact info via RBAC"
ON public.contact_info
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['settings.edit', 'roles.manage'])
);

-- Product detail page support tables must follow product permissions.
ALTER TABLE public.product_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage product sections" ON public.product_sections;
DROP POLICY IF EXISTS "Allow staff to view product sections via RBAC" ON public.product_sections;
DROP POLICY IF EXISTS "Allow staff to write product sections via RBAC" ON public.product_sections;

CREATE POLICY "Allow staff to view product sections via RBAC"
ON public.product_sections
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.view', 'products.create', 'products.edit', 'products.delete', 'products.publish', 'products.archive', 'roles.manage'])
);

CREATE POLICY "Allow staff to write product sections via RBAC"
ON public.product_sections
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to update product sections via RBAC"
ON public.product_sections
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete product sections via RBAC"
ON public.product_sections
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

ALTER TABLE public.product_blog_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage product blog assignments" ON public.product_blog_assignments;
DROP POLICY IF EXISTS "Allow staff to view product blog assignments via RBAC" ON public.product_blog_assignments;
DROP POLICY IF EXISTS "Allow staff to write product blog assignments via RBAC" ON public.product_blog_assignments;

CREATE POLICY "Allow staff to view product blog assignments via RBAC"
ON public.product_blog_assignments
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.view', 'products.create', 'products.edit', 'products.delete', 'products.publish', 'products.archive', 'roles.manage'])
);

CREATE POLICY "Allow staff to write product blog assignments via RBAC"
ON public.product_blog_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to update product blog assignments via RBAC"
ON public.product_blog_assignments
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete product blog assignments via RBAC"
ON public.product_blog_assignments
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.create', 'products.edit', 'roles.manage'])
);

-- Order management now follows order permissions instead of legacy role checks.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow staff to view orders via RBAC" ON public.orders;
DROP POLICY IF EXISTS "Allow staff to update orders via RBAC" ON public.orders;

CREATE POLICY "Allow staff to view orders via RBAC"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.fulfill', 'orders.export', 'roles.manage'])
);

CREATE POLICY "Allow staff to update orders via RBAC"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['orders.edit', 'orders.cancel', 'orders.refund', 'orders.fulfill', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['orders.edit', 'orders.cancel', 'orders.refund', 'orders.fulfill', 'roles.manage'])
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can create order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Allow staff to view order history via RBAC" ON public.order_status_history;
DROP POLICY IF EXISTS "Allow staff to create order history via RBAC" ON public.order_status_history;

CREATE POLICY "Allow staff to view order history via RBAC"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.fulfill', 'orders.export', 'roles.manage'])
);

CREATE POLICY "Allow staff to create order history via RBAC"
ON public.order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['orders.edit', 'orders.cancel', 'orders.refund', 'orders.fulfill', 'roles.manage'])
);

-- Audit logs stay restricted to audit/role managers.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow staff to view audit logs via RBAC" ON public.audit_logs;

CREATE POLICY "Allow staff to view audit logs via RBAC"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['audit.view', 'roles.manage'])
);
