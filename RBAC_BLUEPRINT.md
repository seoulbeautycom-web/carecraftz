# RBAC Blueprint for CareCraftz

**Status:** Draft
**Scope:** Single-store, enterprise-grade RBAC for the current CareCraftz business only.

This document is the starting point for tightening our authorization model before we expand operations.
It intentionally does **not** introduce partner-company tenancy or multi-org provisioning.

---

## 1. Goal

We want a model that is:

- **Simple enough to run now**
- **Strict enough for enterprise access control**
- **Easy to grow with the store**
- **Enforced in Supabase RLS, not just in the UI**
- **Auditable and safe to change over time**

The big shift is this:

- **`auth.users` identifies the person**
- **Our database tables decide what that person can do**

---

## 2. What is wrong with the current model

The current pattern is too loose for long-term growth:

- One `role` field carries too much meaning
- Permissions are not centralized
- Policies tend to become one-off checks
- UI controls can drift from actual DB permissions
- RLS can end up relying on broad checks like `USING (true)` or JWT claims alone

That works early on, but it becomes hard to trust as the store grows.

---

## 3. Design principles

### 3.1 Deny by default

If a user does not have explicit access, they do not get access.

### 3.2 Authorization lives in the database

The frontend can hide buttons, but only RLS should protect data.

### 3.3 Roles are bundles, permissions are atomic

- **Role** = a job/function bundle
- **Permission** = one specific action

### 3.4 Keep the source of truth normalized

Do not use JSON permission blobs as the real security model.
Use relational tables for roles, permissions, and assignments.

### 3.5 Scope access by data domain

If a table is sensitive, its RLS policy should say exactly who can:

- view it
- create it
- edit it
- delete it
- approve or publish it

### 3.6 Audit everything meaningful

Role changes, staff changes, permission changes, and security-sensitive actions should be logged.

---

## 4. Role model

I would keep the role set intentionally small and clear.

### Core roles

- **`super_admin`**
  - Full control over the store
  - Can manage roles, permissions, staff, settings, and security-critical actions
  - Should be rare

- **`admin`**
  - Broad operational control
  - Can manage most store areas
  - Cannot override `super_admin` constraints unless explicitly allowed

- **`editor`**
  - Manages content and catalog-related work
  - Products, pages, media, blog content, collections

- **`support`**
  - Handles orders, customer service, refunds/notes where allowed
  - Usually read-heavy with limited write permissions

- **`analyst`**
  - Read-only analytics and reporting
  - No content publishing or staff management

- **`staff`**
  - Minimal operational access
  - Used for general team members with narrow responsibilities

### Role categories for the UI

This is for display and management, not security by itself:

- **Governance**
  - `super_admin`
  - `admin`

- **Content**
  - `editor`

- **Operations**
  - `support`
  - `staff`

- **Reporting**
  - `analyst`

---

## 5. Permission model

Permissions should be small, consistent, and stable.

### Naming convention

Use dotted codes:

- `orders.view`
- `orders.edit`
- `orders.refund`
- `products.view`
- `products.edit`
- `content.publish`
- `staff.manage`
- `analytics.view`

### Permission groups

The admin UI should group permissions by module:

- **Dashboard**
- **Orders**
- **Products**
- **Content**
- **Customers**
- **Reviews**
- **Staff**
- **Analytics**
- **Settings**
- **Audit Logs**
- **Integrations**

### Suggested permission catalog

#### Dashboard

- `dashboard.view`

#### Orders

- `orders.view`
- `orders.create`
- `orders.edit`
- `orders.cancel`
- `orders.refund`
- `orders.fulfill`
- `orders.export`

#### Products

- `products.view`
- `products.create`
- `products.edit`
- `products.delete`
- `products.publish`
- `products.archive`
- `products.export`

#### Content

- `content.view`
- `content.create`
- `content.edit`
- `content.delete`
- `content.publish`
- `content.schedule`

#### Customers

- `customers.view`
- `customers.edit`
- `customers.export`

#### Reviews

- `reviews.view`
- `reviews.moderate`
- `reviews.delete`

#### Staff

- `staff.view`
- `staff.invite`
- `staff.edit`
- `staff.disable`
- `staff.delete`
- `roles.manage`

#### Analytics

- `analytics.view`
- `analytics.export`

#### Settings

- `settings.view`
- `settings.edit`
- `integrations.manage`
- `billing.view`

#### Audit

- `audit.view`

---

## 6. Recommended database structure

### 6.1 `staff`

Keep `staff` as the human-facing profile table.

Suggested fields:

- `id`
- `user_id` referencing `auth.users.id`
- `email`
- `full_name`
- `is_active`
- `last_signed_in`
- `created_at`
- `updated_at`

If we keep a `role` field temporarily, treat it as legacy or display-only, not as the primary authorization source.

### 6.2 `roles`

Stores role definitions.

Suggested fields:

- `id`
- `code`
- `name`
- `description`
- `category`
- `is_system`
- `created_at`

### 6.3 `permissions`

Stores atomic permissions.

Suggested fields:

- `id`
- `code`
- `name`
- `description`
- `module`
- `created_at`

### 6.4 `role_permissions`

Maps roles to permissions.

Suggested fields:

- `role_id`
- `permission_id`

### 6.5 `staff_roles`

Maps a staff user to one or more roles.

Suggested fields:

- `id`
- `staff_id`
- `role_id`
- `created_by`
- `created_at`

This allows:

- multiple roles per user if needed
- future separation of primary role vs extra capabilities

### 6.6 `permission_groups` or `module_groups` (optional)

If the admin UI needs cleaner grouping, add a small table for presentation.
This is optional and should not affect authorization.

### 6.7 `access_audit_logs`

A snapshot-safe audit table for security changes.

Suggested fields:

- `id`
- `action`
- `entity_type`
- `entity_id`
- `old_data`
- `new_data`
- `performed_by`
- `performed_by_name`
- `performed_by_email`
- `performed_at`

This table should never block deletes or break cleanup.

---

## 7. RLS strategy

### 7.1 Never trust the frontend alone

The UI can mirror access, but the database must enforce it.

### 7.2 Every business table gets RLS

Tables like these should have explicit policies:

- products
- orders
- customers
- reviews
- content/pages/posts
- staff
- settings
- audit logs

### 7.3 Use helper functions

Instead of repeating huge policy logic everywhere, create helper functions like:

- `authz.current_staff_id()`
- `authz.is_staff_user()`
- `authz.has_role(role_code)`
- `authz.has_permission(permission_code)`
- `authz.has_any_permission(permission_codes)`
- `authz.can_manage_staff()`
- `authz.can_view_audit_logs()`

These should be:

- `SECURITY DEFINER`
- carefully written with a fixed `search_path`
- indexed for the join paths they read

### 7.4 Policy pattern

A clean policy should read like this:

- **SELECT** only if user has `*.view`
- **INSERT** only if user has `*.create`
- **UPDATE** only if user has `*.edit`
- **DELETE** only if user has `*.delete`

For special actions:

- `publish`
- `refund`
- `approve`
- `export`
- `disable`

use dedicated permissions, not generic edit access.

### 7.5 Avoid broad claims-based authorization

Do not rely on JWT `role` alone as the source of truth.
It can be used as a performance hint, but the DB relationship tables should decide the real answer.

---

## 8. Row-level ownership rules

RBAC alone is not always enough.
Some tables should also consider record ownership or assignment.

Examples:

- An order can be visible to all support staff, but only editable by assigned staff or staff with `orders.edit`
- A customer note may only be editable by the assigned agent or an admin
- A draft content page may be editable by its author and editors

So the final policy often becomes:

- **permission check**
- plus **ownership or assignment check** where appropriate

That gives us finer control without turning the system into a maze.

---

## 9. Recommended default role matrix

### `super_admin`

- All permissions
- Can manage roles
- Can manage staff
- Can change settings
- Can view audit logs
- Can approve sensitive actions

### `admin`

- Most operational permissions
- Can manage staff within normal limits
- Can manage products, orders, content, settings
- Should not be able to silently override core security rules

### `editor`

- Products
- Content/pages/blog
- Media
- Maybe collections
- No staff management
- No settings management

### `support`

- Orders view
- Order notes
- Customer support actions
- Refunds only if explicitly granted
- Limited edit scope

### `analyst`

- Analytics view
- Reporting export if allowed
- No write access to core business data

### `staff`

- Narrow operational access
- Usually read-only or limited updates
- No role management
- No settings management

---

## 10. Admin UI we should build

The admin portal should have a dedicated access-control page.

### Suggested page sections

- **Role list**
  - Create/edit role templates
  - See role category and usage

- **Permission matrix**
  - Checkbox grid grouped by module
  - Show what each role can do

- **Staff assignment panel**
  - Assign one or more roles to a staff member
  - Show active/inactive status

- **Effective access preview**
  - Explain why a user can or cannot do something

- **Audit history**
  - Show who changed roles, when, and what changed

### UX rules for the page

- Prevent accidental bulk permission changes
- Require confirmation for destructive actions
- Highlight security-sensitive permissions like staff management and settings
- Make the current role inheritance obvious

---

## 11. Migration path from the current model

This is the safest way to move without breaking the app.

### Phase 1

Create the new authz tables:

- `roles`
- `permissions`
- `role_permissions`
- `staff_roles`

### Phase 2

Seed the default roles and permission catalog.

### Phase 3

Backfill existing staff into the new model.

Example mapping:

- existing `admin` -> `super_admin` or `admin`
- existing `editor` -> `editor`
- existing `support` -> `support`
- existing `analyst` -> `analyst`
- existing `staff` -> `staff`

### Phase 4

Update RLS policies table by table to use helper functions.

### Phase 5

Update the admin UI so permissions are managed from the new RBAC page.

### Phase 6

Treat old role fields as deprecated or display-only.

---

## 12. Security hardening checklist

- [ ] Enable RLS on every internal table
- [ ] Make policies deny by default
- [ ] Replace direct JWT role checks with DB helper functions
- [ ] Add indexes for staff and role join tables
- [ ] Make role changes auditable
- [ ] Make staff deactivate immediately revoke access
- [ ] Prevent inactive users from passing helper checks
- [ ] Keep audit logs snapshot-safe
- [ ] Add a break-glass `super_admin` path only if truly needed
- [ ] Review every `USING (true)` policy and remove it unless the data is intentionally public

---

## 13. What not to do

- Do **not** build a partner tenant system right now
- Do **not** use the UI as the security layer
- Do **not** keep permissions only in JSON blobs
- Do **not** let role text fields be the only authorization source
- Do **not** scatter permission logic across components
- Do **not** grant broad write access just to save time

---

## 14. Recommended implementation order

1. Freeze the role names we will support
2. Define the permission catalog
3. Create normalized RBAC tables
4. Seed role-to-permission mappings
5. Add helper functions for RLS
6. Replace the critical policies first
7. Build the admin RBAC page
8. Migrate staff assignments
9. Remove legacy shortcuts after validation

---

## 15. My recommendation

For the current store, the best balance is:

- **One store tenant only**
- **Normalized RBAC tables**
- **Single source of truth in the database**
- **Permission-driven RLS helpers**
- **Simple admin UI for role editing**
- **Snapshot-safe audit logs**

That gives us a robust foundation to expand the store without introducing unnecessary complexity.

---

## 16. Next step

If this blueprint looks right, the next move is to implement:

- the RBAC schema
- the Supabase helper functions
- the first round of RLS policies
- the admin access-control page

