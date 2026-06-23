export type RbacRoleCategory = 'governance' | 'content' | 'operations' | 'reporting' | 'general'

export interface RoleDefinition {
  code: string
  name: string
  description: string
  category: RbacRoleCategory
  isSystem: boolean
  badgeClass: string
  ringClass: string
  summary: string
}

export interface PermissionDefinition {
  code: string
  name: string
  description: string
  module: string
}

export interface PermissionGroup {
  module: string
  label: string
  permissions: PermissionDefinition[]
}

export const ROLE_CATEGORY_OPTIONS: Array<{ value: RbacRoleCategory; label: string; description: string }> = [
  { value: 'governance', label: 'Governance', description: 'Platform and security oversight' },
  { value: 'content', label: 'Content', description: 'Catalog and editorial access' },
  { value: 'operations', label: 'Operations', description: 'Orders and day-to-day support work' },
  { value: 'reporting', label: 'Reporting', description: 'Analytics and read-only analysis' },
  { value: 'general', label: 'General', description: 'Broad internal access' },
]

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    code: 'super_admin',
    name: 'Super Admin',
    description: 'Full control over the store, RBAC, settings, and security-sensitive actions.',
    category: 'governance',
    isSystem: true,
    badgeClass: 'bg-red-100 text-red-700',
    ringClass: 'ring-red-200',
    summary: 'Full access',
  },
  {
    code: 'admin',
    name: 'Admin',
    description: 'Broad operational control across the store.',
    category: 'governance',
    isSystem: true,
    badgeClass: 'bg-blue-100 text-blue-700',
    ringClass: 'ring-blue-200',
    summary: 'Operations, staff, settings',
  },
  {
    code: 'editor',
    name: 'Editor',
    description: 'Catalog, content, and media editing access.',
    category: 'content',
    isSystem: true,
    badgeClass: 'bg-purple-100 text-purple-700',
    ringClass: 'ring-purple-200',
    summary: 'Products, content',
  },
  {
    code: 'support',
    name: 'Support',
    description: 'Orders, customer service, and internal support workflows.',
    category: 'operations',
    isSystem: true,
    badgeClass: 'bg-emerald-100 text-emerald-700',
    ringClass: 'ring-emerald-200',
    summary: 'Orders, customers',
  },
  {
    code: 'analyst',
    name: 'Analyst',
    description: 'Read-only analytics and reporting access.',
    category: 'reporting',
    isSystem: true,
    badgeClass: 'bg-pink-100 text-pink-700',
    ringClass: 'ring-pink-200',
    summary: 'Analytics only',
  },
  {
    code: 'staff',
    name: 'Staff',
    description: 'General internal access with limited writes.',
    category: 'general',
    isSystem: true,
    badgeClass: 'bg-gray-100 text-gray-700',
    ringClass: 'ring-gray-200',
    summary: 'Limited access',
  },
]

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  { code: 'dashboard.view', name: 'View dashboard', description: 'Open the admin dashboard overview.', module: 'dashboard' },
  { code: 'orders.view', name: 'View orders', description: 'See order lists and order detail records.', module: 'orders' },
  { code: 'orders.create', name: 'Create orders', description: 'Create manual or internal orders.', module: 'orders' },
  { code: 'orders.edit', name: 'Edit orders', description: 'Modify editable order fields.', module: 'orders' },
  { code: 'orders.cancel', name: 'Cancel orders', description: 'Cancel orders when needed.', module: 'orders' },
  { code: 'orders.refund', name: 'Refund orders', description: 'Issue refunds or mark orders for refund.', module: 'orders' },
  { code: 'orders.fulfill', name: 'Fulfill orders', description: 'Mark orders fulfilled or dispatched.', module: 'orders' },
  { code: 'orders.export', name: 'Export orders', description: 'Export order records for reporting.', module: 'orders' },
  { code: 'products.view', name: 'View products', description: 'See product listings and catalog data.', module: 'products' },
  { code: 'products.create', name: 'Create products', description: 'Add new products to the catalog.', module: 'products' },
  { code: 'products.edit', name: 'Edit products', description: 'Modify existing product records.', module: 'products' },
  { code: 'products.delete', name: 'Delete products', description: 'Remove products from the catalog.', module: 'products' },
  { code: 'products.publish', name: 'Publish products', description: 'Make products visible in the storefront.', module: 'products' },
  { code: 'products.archive', name: 'Archive products', description: 'Archive products without deleting them.', module: 'products' },
  { code: 'products.export', name: 'Export products', description: 'Export catalog data.', module: 'products' },
  { code: 'content.view', name: 'View content', description: 'Open pages and blog content.', module: 'content' },
  { code: 'content.create', name: 'Create content', description: 'Create pages, posts, or media entries.', module: 'content' },
  { code: 'content.edit', name: 'Edit content', description: 'Modify pages, posts, and content assets.', module: 'content' },
  { code: 'content.delete', name: 'Delete content', description: 'Delete content records.', module: 'content' },
  { code: 'content.publish', name: 'Publish content', description: 'Publish drafts and schedule content.', module: 'content' },
  { code: 'content.schedule', name: 'Schedule content', description: 'Schedule content for future release.', module: 'content' },
  { code: 'customers.view', name: 'View customers', description: 'See customer profiles and history.', module: 'customers' },
  { code: 'customers.edit', name: 'Edit customers', description: 'Change customer notes or profile fields.', module: 'customers' },
  { code: 'customers.export', name: 'Export customers', description: 'Export customer records.', module: 'customers' },
  { code: 'reviews.view', name: 'View reviews', description: 'Open product reviews and moderation queues.', module: 'reviews' },
  { code: 'reviews.moderate', name: 'Moderate reviews', description: 'Approve, hide, or flag reviews.', module: 'reviews' },
  { code: 'reviews.delete', name: 'Delete reviews', description: 'Remove a review from the system.', module: 'reviews' },
  { code: 'partners.view', name: 'View partner applications', description: 'Review partner applications and approved stores.', module: 'partners' },
  { code: 'partners.review', name: 'Review partner applications', description: 'Move partner applications through the review workflow.', module: 'partners' },
  { code: 'partners.approve', name: 'Approve partner applications', description: 'Approve applications and provision partner stores.', module: 'partners' },
  { code: 'partners.reject', name: 'Reject partner applications', description: 'Reject partner applications after review.', module: 'partners' },
  { code: 'partners.provision', name: 'Provision partner stores', description: 'Create partner store records and slug assignments.', module: 'partners' },
  { code: 'partners.manage', name: 'Manage partner marketplace', description: 'Manage partner onboarding, stores, and marketplace settings.', module: 'partners' },
  { code: 'staff.view', name: 'View staff', description: 'See internal staff members and access levels.', module: 'staff' },
  { code: 'staff.invite', name: 'Invite staff', description: 'Create new internal staff accounts.', module: 'staff' },
  { code: 'staff.edit', name: 'Edit staff', description: 'Update staff role or profile details.', module: 'staff' },
  { code: 'staff.disable', name: 'Disable staff', description: 'Temporarily suspend staff accounts.', module: 'staff' },
  { code: 'staff.delete', name: 'Delete staff', description: 'Remove staff accounts.', module: 'staff' },
  { code: 'roles.manage', name: 'Manage roles', description: 'Edit role templates and permission matrices.', module: 'governance' },
  { code: 'analytics.view', name: 'View analytics', description: 'Open analytics dashboards and metrics.', module: 'analytics' },
  { code: 'analytics.export', name: 'Export analytics', description: 'Download analytics reports.', module: 'analytics' },
  { code: 'settings.view', name: 'View settings', description: 'Open store settings screens.', module: 'settings' },
  { code: 'settings.edit', name: 'Edit settings', description: 'Modify store and system configuration.', module: 'settings' },
  { code: 'integrations.manage', name: 'Manage integrations', description: 'Configure third-party integrations.', module: 'integrations' },
  { code: 'billing.view', name: 'View billing', description: 'Open billing and subscription details.', module: 'settings' },
  { code: 'audit.view', name: 'View audit log', description: 'Read security and access audit entries.', module: 'audit' },
]

export const DEFAULT_ROLE_PERMISSION_CODES: Record<string, string[]> = {
  super_admin: DEFAULT_PERMISSIONS.map((permission) => permission.code),
  admin: [
    'dashboard.view',
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.cancel',
    'orders.refund',
    'orders.fulfill',
    'orders.export',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'products.publish',
    'products.archive',
    'products.export',
    'content.view',
    'content.create',
    'content.edit',
    'content.delete',
    'content.publish',
    'content.schedule',
    'customers.view',
    'customers.edit',
    'customers.export',
    'reviews.view',
    'reviews.moderate',
    'reviews.delete',
    'partners.view',
    'partners.review',
    'partners.approve',
    'partners.reject',
    'partners.provision',
    'partners.manage',
    'staff.view',
    'staff.invite',
    'staff.edit',
    'staff.disable',
    'staff.delete',
    'analytics.view',
    'analytics.export',
    'settings.view',
    'settings.edit',
    'integrations.manage',
    'billing.view',
    'audit.view',
  ],
  editor: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'products.publish',
    'products.archive',
    'content.view',
    'content.create',
    'content.edit',
    'content.delete',
    'content.publish',
    'content.schedule',
    'reviews.view',
  ],
  support: [
    'dashboard.view',
    'orders.view',
    'orders.edit',
    'orders.cancel',
    'orders.fulfill',
    'customers.view',
    'customers.edit',
    'reviews.view',
    'reviews.moderate',
  ],
  analyst: [
    'dashboard.view',
    'analytics.view',
    'analytics.export',
    'orders.view',
    'customers.view',
    'reviews.view',
  ],
  staff: [
    'dashboard.view',
    'orders.view',
    'customers.view',
  ],
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  'dashboard',
  'orders',
  'products',
  'content',
  'customers',
  'reviews',
  'partners',
  'staff',
  'governance',
  'analytics',
  'settings',
  'audit',
  'integrations',
].map((module) => ({
  module,
  label: module === 'governance'
    ? 'Governance'
    : module.charAt(0).toUpperCase() + module.slice(1),
  permissions: DEFAULT_PERMISSIONS.filter((permission) => permission.module === module),
}))

export const ROLE_OPTIONS = DEFAULT_ROLES.map((role) => ({
  value: role.code,
  label: role.name,
  color: role.badgeClass,
  ringClass: role.ringClass,
  permissions: role.summary,
}))

export const getRoleDefinition = (code: string) => DEFAULT_ROLES.find((role) => role.code === code) ?? DEFAULT_ROLES[DEFAULT_ROLES.length - 1]

export const getPermissionDefinition = (code: string) => DEFAULT_PERMISSIONS.find((permission) => permission.code === code)

export const getPermissionCodesForRole = (code: string) => DEFAULT_ROLE_PERMISSION_CODES[code] ?? []

export const buildPermissionMap = (source: Record<string, string[]>) => {
  const map: Record<string, Set<string>> = {}

  for (const [roleCode, codes] of Object.entries(source)) {
    map[roleCode] = new Set(codes)
  }

  return map
}

export const permissionMapToObject = (map: Record<string, Set<string>>) => {
  return Object.fromEntries(
    Object.entries(map).map(([roleCode, codes]) => [roleCode, Array.from(codes).sort()]),
  ) as Record<string, string[]>
}
