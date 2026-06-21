CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('governance', 'content', 'operations', 'reporting', 'general')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  module TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS staff_roles (
  staff_id UUID PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_category ON roles(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_staff_roles_role_code ON staff_roles(role_code);

CREATE OR REPLACE FUNCTION public.normalize_legacy_role_code(input_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(COALESCE(input_role, '')) IN ('superadmin', 'super_admin') THEN 'super_admin'
    WHEN lower(COALESCE(input_role, '')) = 'manager' THEN 'admin'
    ELSE NULLIF(lower(COALESCE(input_role, '')), '')
  END;
$$;

CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT s.id
  FROM public.staff s
  WHERE s.user_id = auth.uid()
    AND s.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_staff_role_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT r.code
      FROM public.staff s
      JOIN public.staff_roles sr ON sr.staff_id = s.id
      JOIN public.roles r ON r.code = sr.role_code
      WHERE s.user_id = auth.uid()
        AND s.is_active = true
      LIMIT 1
    ),
    (
      SELECT public.normalize_legacy_role_code(s.role)
      FROM public.staff s
      WHERE s.user_id = auth.uid()
        AND s.is_active = true
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.rbac_has_role(expected_role_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.current_staff_role_code() = expected_role_code;
$$;

CREATE OR REPLACE FUNCTION public.rbac_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.rbac_has_role('super_admin');
$$;

CREATE OR REPLACE FUNCTION public.rbac_has_permission(permission_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  role_code text;
BEGIN
  role_code := public.current_staff_role_code();

  IF role_code = 'super_admin' THEN
    RETURN true;
  END IF;

  IF role_code IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.roles r
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE r.code = role_code
      AND p.code = permission_code
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rbac_has_any_permission(permission_codes text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  permission_code text;
BEGIN
  IF permission_codes IS NULL OR array_length(permission_codes, 1) IS NULL THEN
    RETURN false;
  END IF;

  FOREACH permission_code IN ARRAY permission_codes LOOP
    IF public.rbac_has_permission(permission_code) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.rbac_can_view_audit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.rbac_has_any_permission(ARRAY['audit.view', 'roles.manage']);
$$;

CREATE OR REPLACE FUNCTION public.bump_my_last_signed_in()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE public.staff
  SET last_signed_in = NOW(),
      updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_role_permissions(target_role_code text, target_permission_codes text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_role_id uuid;
BEGIN
  IF NOT public.rbac_has_permission('roles.manage') THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  SELECT id
  INTO target_role_id
  FROM public.roles
  WHERE code = target_role_code
  LIMIT 1;

  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Role not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.role_permissions
  WHERE role_id = target_role_id;

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT DISTINCT target_role_id, p.id
  FROM public.permissions p
  WHERE p.code = ANY(COALESCE(target_permission_codes, ARRAY[]::text[]));
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_staff_role_assignment(target_staff_id uuid, target_role_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['staff.edit', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  UPDATE public.staff
  SET role = target_role_code,
      updated_at = NOW()
  WHERE id = target_staff_id;

  INSERT INTO public.staff_roles (staff_id, role_code, updated_at)
  VALUES (target_staff_id, target_role_code, NOW())
  ON CONFLICT (staff_id) DO UPDATE
  SET
    role_code = EXCLUDED.role_code,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.log_rbac_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_user_id uuid := auth.uid();
  actor_name text;
  actor_email text;
  old_snapshot jsonb;
  new_snapshot jsonb;
  record_uuid uuid;
BEGIN
  IF actor_user_id IS NOT NULL THEN
    SELECT s.full_name, s.email
    INTO actor_name, actor_email
    FROM public.staff s
    WHERE s.user_id = actor_user_id
    LIMIT 1;
  END IF;

  IF TG_OP = 'DELETE' THEN
    old_snapshot := to_jsonb(OLD);
    new_snapshot := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_snapshot := to_jsonb(OLD);
    new_snapshot := to_jsonb(NEW);
  ELSE
    old_snapshot := NULL;
    new_snapshot := to_jsonb(NEW);
  END IF;

  record_uuid := NULL;
  IF TG_OP = 'DELETE' THEN
    IF old_snapshot ? 'id' THEN
      record_uuid := (old_snapshot ->> 'id')::uuid;
    ELSIF old_snapshot ? 'staff_id' THEN
      record_uuid := (old_snapshot ->> 'staff_id')::uuid;
    ELSIF old_snapshot ? 'role_id' THEN
      record_uuid := (old_snapshot ->> 'role_id')::uuid;
    ELSIF old_snapshot ? 'permission_id' THEN
      record_uuid := (old_snapshot ->> 'permission_id')::uuid;
    END IF;
  ELSE
    IF new_snapshot ? 'id' THEN
      record_uuid := (new_snapshot ->> 'id')::uuid;
    ELSIF new_snapshot ? 'staff_id' THEN
      record_uuid := (new_snapshot ->> 'staff_id')::uuid;
    ELSIF new_snapshot ? 'role_id' THEN
      record_uuid := (new_snapshot ->> 'role_id')::uuid;
    ELSIF new_snapshot ? 'permission_id' THEN
      record_uuid := (new_snapshot ->> 'permission_id')::uuid;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      performed_by,
      performed_by_name,
      performed_by_email
    ) VALUES (
      TG_TABLE_NAME,
      record_uuid,
      'DELETE',
      old_snapshot,
      actor_user_id,
      actor_name,
      actor_email
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      performed_by,
      performed_by_name,
      performed_by_email
    ) VALUES (
      TG_TABLE_NAME,
      record_uuid,
      'UPDATE',
      old_snapshot,
      new_snapshot,
      actor_user_id,
      actor_name,
      actor_email
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      new_data,
      performed_by,
      performed_by_name,
      performed_by_email
    ) VALUES (
      TG_TABLE_NAME,
      record_uuid,
      'CREATE',
      new_snapshot,
      actor_user_id,
      actor_name,
      actor_email
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

INSERT INTO roles (code, name, description, category, is_system, sort_order)
VALUES
  ('super_admin', 'Super Admin', 'Full control over the store, RBAC, settings, and security-sensitive actions.', 'governance', true, 0),
  ('admin', 'Admin', 'Broad operational control across the store.', 'governance', true, 1),
  ('editor', 'Editor', 'Catalog, content, and media editing access.', 'content', true, 2),
  ('support', 'Support', 'Orders, customer service, and internal support workflows.', 'operations', true, 3),
  ('analyst', 'Analyst', 'Read-only analytics and reporting access.', 'reporting', true, 4),
  ('staff', 'Staff', 'General internal access with limited writes.', 'general', true, 5)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO permissions (code, name, description, module, sort_order)
VALUES
  ('dashboard.view', 'View dashboard', 'Open the admin dashboard overview.', 'dashboard', 0),
  ('orders.view', 'View orders', 'See order lists and order detail records.', 'orders', 1),
  ('orders.create', 'Create orders', 'Create manual or internal orders.', 'orders', 2),
  ('orders.edit', 'Edit orders', 'Modify editable order fields.', 'orders', 3),
  ('orders.cancel', 'Cancel orders', 'Cancel orders when needed.', 'orders', 4),
  ('orders.refund', 'Refund orders', 'Issue refunds or mark orders for refund.', 'orders', 5),
  ('orders.fulfill', 'Fulfill orders', 'Mark orders fulfilled or dispatched.', 'orders', 6),
  ('orders.export', 'Export orders', 'Export order records for reporting.', 'orders', 7),
  ('products.view', 'View products', 'See product listings and catalog data.', 'products', 8),
  ('products.create', 'Create products', 'Add new products to the catalog.', 'products', 9),
  ('products.edit', 'Edit products', 'Modify existing product records.', 'products', 10),
  ('products.delete', 'Delete products', 'Remove products from the catalog.', 'products', 11),
  ('products.publish', 'Publish products', 'Make products visible in the storefront.', 'products', 12),
  ('products.archive', 'Archive products', 'Archive products without deleting them.', 'products', 13),
  ('products.export', 'Export products', 'Export catalog data.', 'products', 14),
  ('content.view', 'View content', 'Open pages and blog content.', 'content', 15),
  ('content.create', 'Create content', 'Create pages, posts, or media entries.', 'content', 16),
  ('content.edit', 'Edit content', 'Modify pages, posts, and content assets.', 'content', 17),
  ('content.delete', 'Delete content', 'Delete content records.', 'content', 18),
  ('content.publish', 'Publish content', 'Publish drafts and schedule content.', 'content', 19),
  ('content.schedule', 'Schedule content', 'Schedule content for future release.', 'content', 20),
  ('customers.view', 'View customers', 'See customer profiles and history.', 'customers', 21),
  ('customers.edit', 'Edit customers', 'Change customer notes or profile fields.', 'customers', 22),
  ('customers.export', 'Export customers', 'Export customer records.', 'customers', 23),
  ('reviews.view', 'View reviews', 'Open product reviews and moderation queues.', 'reviews', 24),
  ('reviews.moderate', 'Moderate reviews', 'Approve, hide, or flag reviews.', 'reviews', 25),
  ('reviews.delete', 'Delete reviews', 'Remove a review from the system.', 'reviews', 26),
  ('staff.view', 'View staff', 'See internal staff members and access levels.', 'staff', 27),
  ('staff.invite', 'Invite staff', 'Create new internal staff accounts.', 'staff', 28),
  ('staff.edit', 'Edit staff', 'Update staff role or profile details.', 'staff', 29),
  ('staff.disable', 'Disable staff', 'Temporarily suspend staff accounts.', 'staff', 30),
  ('staff.delete', 'Delete staff', 'Remove staff accounts.', 'staff', 31),
  ('roles.manage', 'Manage roles', 'Edit role templates and permission matrices.', 'governance', 32),
  ('analytics.view', 'View analytics', 'Open analytics dashboards and metrics.', 'analytics', 33),
  ('analytics.export', 'Export analytics', 'Download analytics reports.', 'analytics', 34),
  ('settings.view', 'View settings', 'Open store settings screens.', 'settings', 35),
  ('settings.edit', 'Edit settings', 'Modify store and system configuration.', 'settings', 36),
  ('integrations.manage', 'Manage integrations', 'Configure third-party integrations.', 'integrations', 37),
  ('billing.view', 'View billing', 'Open billing and subscription details.', 'settings', 38),
  ('audit.view', 'View audit log', 'Read security and access audit entries.', 'audit', 39)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (
  VALUES
    ('super_admin', 'dashboard.view'),
    ('super_admin', 'orders.view'),
    ('super_admin', 'orders.create'),
    ('super_admin', 'orders.edit'),
    ('super_admin', 'orders.cancel'),
    ('super_admin', 'orders.refund'),
    ('super_admin', 'orders.fulfill'),
    ('super_admin', 'orders.export'),
    ('super_admin', 'products.view'),
    ('super_admin', 'products.create'),
    ('super_admin', 'products.edit'),
    ('super_admin', 'products.delete'),
    ('super_admin', 'products.publish'),
    ('super_admin', 'products.archive'),
    ('super_admin', 'products.export'),
    ('super_admin', 'content.view'),
    ('super_admin', 'content.create'),
    ('super_admin', 'content.edit'),
    ('super_admin', 'content.delete'),
    ('super_admin', 'content.publish'),
    ('super_admin', 'content.schedule'),
    ('super_admin', 'customers.view'),
    ('super_admin', 'customers.edit'),
    ('super_admin', 'customers.export'),
    ('super_admin', 'reviews.view'),
    ('super_admin', 'reviews.moderate'),
    ('super_admin', 'reviews.delete'),
    ('super_admin', 'staff.view'),
    ('super_admin', 'staff.invite'),
    ('super_admin', 'staff.edit'),
    ('super_admin', 'staff.disable'),
    ('super_admin', 'staff.delete'),
    ('super_admin', 'roles.manage'),
    ('super_admin', 'analytics.view'),
    ('super_admin', 'analytics.export'),
    ('super_admin', 'settings.view'),
    ('super_admin', 'settings.edit'),
    ('super_admin', 'integrations.manage'),
    ('super_admin', 'billing.view'),
    ('super_admin', 'audit.view'),
    ('admin', 'dashboard.view'),
    ('admin', 'orders.view'),
    ('admin', 'orders.create'),
    ('admin', 'orders.edit'),
    ('admin', 'orders.cancel'),
    ('admin', 'orders.refund'),
    ('admin', 'orders.fulfill'),
    ('admin', 'orders.export'),
    ('admin', 'products.view'),
    ('admin', 'products.create'),
    ('admin', 'products.edit'),
    ('admin', 'products.delete'),
    ('admin', 'products.publish'),
    ('admin', 'products.archive'),
    ('admin', 'products.export'),
    ('admin', 'content.view'),
    ('admin', 'content.create'),
    ('admin', 'content.edit'),
    ('admin', 'content.delete'),
    ('admin', 'content.publish'),
    ('admin', 'content.schedule'),
    ('admin', 'customers.view'),
    ('admin', 'customers.edit'),
    ('admin', 'customers.export'),
    ('admin', 'reviews.view'),
    ('admin', 'reviews.moderate'),
    ('admin', 'reviews.delete'),
    ('admin', 'staff.view'),
    ('admin', 'staff.invite'),
    ('admin', 'staff.edit'),
    ('admin', 'staff.disable'),
    ('admin', 'staff.delete'),
    ('admin', 'roles.manage'),
    ('admin', 'analytics.view'),
    ('admin', 'analytics.export'),
    ('admin', 'settings.view'),
    ('admin', 'settings.edit'),
    ('admin', 'integrations.manage'),
    ('admin', 'billing.view'),
    ('admin', 'audit.view'),
    ('editor', 'dashboard.view'),
    ('editor', 'products.view'),
    ('editor', 'products.create'),
    ('editor', 'products.edit'),
    ('editor', 'products.publish'),
    ('editor', 'products.archive'),
    ('editor', 'content.view'),
    ('editor', 'content.create'),
    ('editor', 'content.edit'),
    ('editor', 'content.delete'),
    ('editor', 'content.publish'),
    ('editor', 'content.schedule'),
    ('editor', 'reviews.view'),
    ('support', 'dashboard.view'),
    ('support', 'orders.view'),
    ('support', 'orders.edit'),
    ('support', 'orders.cancel'),
    ('support', 'orders.fulfill'),
    ('support', 'customers.view'),
    ('support', 'customers.edit'),
    ('support', 'reviews.view'),
    ('support', 'reviews.moderate'),
    ('analyst', 'dashboard.view'),
    ('analyst', 'analytics.view'),
    ('analyst', 'analytics.export'),
    ('analyst', 'orders.view'),
    ('analyst', 'customers.view'),
    ('analyst', 'reviews.view'),
    ('staff', 'dashboard.view'),
    ('staff', 'orders.view'),
    ('staff', 'customers.view')
) AS mapping(role_code, permission_code)
JOIN roles r ON r.code = mapping.role_code
JOIN permissions p ON p.code = mapping.permission_code
ON CONFLICT DO NOTHING;

UPDATE public.staff
SET role = public.normalize_legacy_role_code(role)
WHERE role IS NOT NULL;

UPDATE public.staff
SET role = 'super_admin'
WHERE lower(email) = 'admin@carecraftz.com';

INSERT INTO staff_roles (staff_id, role_code)
SELECT s.id, r.code
FROM public.staff s
JOIN public.roles r ON r.code = public.normalize_legacy_role_code(s.role)
ON CONFLICT (staff_id) DO UPDATE
SET
  role_code = EXCLUDED.role_code,
  updated_at = NOW();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_roles_updated_at ON staff_roles;
CREATE TRIGGER update_staff_roles_updated_at
BEFORE UPDATE ON staff_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS roles_rbac_audit_trigger ON roles;
CREATE TRIGGER roles_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

DROP TRIGGER IF EXISTS permissions_rbac_audit_trigger ON permissions;
CREATE TRIGGER permissions_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

DROP TRIGGER IF EXISTS role_permissions_rbac_audit_trigger ON role_permissions;
CREATE TRIGGER role_permissions_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

DROP TRIGGER IF EXISTS staff_roles_rbac_audit_trigger ON staff_roles;
CREATE TRIGGER staff_roles_rbac_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON staff_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_rbac_audit();

DROP POLICY IF EXISTS "Allow authenticated users to read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated users to insert staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated users to update staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated users to delete staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admins to read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admins to insert staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admins to update staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admins to delete staff" ON public.staff;
DROP POLICY IF EXISTS "Allow admins to view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow system to insert audit logs" ON public.audit_logs;

CREATE POLICY "Allow staff to view staff records"
ON public.staff
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['staff.view', 'roles.manage'])
  OR auth.uid() = user_id
);

CREATE POLICY "Allow staff to invite staff"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['staff.invite', 'roles.manage'])
  OR NOT EXISTS (SELECT 1 FROM public.staff LIMIT 1)
);

CREATE POLICY "Allow staff to edit staff records"
ON public.staff
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['staff.edit', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['staff.edit', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete staff records"
ON public.staff
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['staff.delete', 'roles.manage'])
);

CREATE POLICY "Allow role managers to view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to create roles"
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to edit roles"
ON public.roles
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
)
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to delete roles"
ON public.roles
FOR DELETE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
  AND NOT is_system
);

CREATE POLICY "Allow role managers to view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to edit role permissions"
ON public.role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to update role permissions"
ON public.role_permissions
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
)
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to delete role permissions"
ON public.role_permissions
FOR DELETE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to view staff roles"
ON public.staff_roles
FOR SELECT
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to assign staff roles"
ON public.staff_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to change staff roles"
ON public.staff_roles
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
)
WITH CHECK (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow role managers to remove staff roles"
ON public.staff_roles
FOR DELETE
TO authenticated
USING (
  public.rbac_has_permission('roles.manage')
);

CREATE POLICY "Allow authorized staff to view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.rbac_can_view_audit()
);

CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
