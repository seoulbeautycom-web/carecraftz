-- Align product access with the RBAC permission model so catalog editing works for editor/admin roles.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow staff to view products via RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow staff to create products via RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow staff to update products via RBAC" ON public.products;
DROP POLICY IF EXISTS "Allow staff to delete products via RBAC" ON public.products;

CREATE POLICY "Allow staff to view products via RBAC"
ON public.products
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.view', 'products.create', 'products.edit', 'products.delete', 'products.publish', 'products.archive', 'roles.manage'])
);

CREATE POLICY "Allow staff to create products via RBAC"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.create', 'roles.manage'])
);

CREATE POLICY "Allow staff to update products via RBAC"
ON public.products
FOR UPDATE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.edit', 'products.publish', 'products.archive', 'roles.manage'])
)
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['products.edit', 'products.publish', 'products.archive', 'roles.manage'])
);

CREATE POLICY "Allow staff to delete products via RBAC"
ON public.products
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY['products.delete', 'roles.manage'])
);
