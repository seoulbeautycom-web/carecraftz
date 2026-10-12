import type { ComponentType } from 'react'
import {
  BarChart3,
  Droplets,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  ShieldCheck,
  Star,
  Tag,
  Users,
} from 'lucide-react'

export type AdminNavSectionId = 'top' | 'my-store' | 'growth' | 'team' | 'system'

export interface AdminRouteDefinition {
  path: string
  label: string
  icon?: ComponentType<{ className?: string }>
  requiredAnyPermissions: string[]
  showInNavigation: boolean
  section?: AdminNavSectionId
}

export interface AdminNavItem extends Omit<AdminRouteDefinition, 'icon' | 'section'> {
  icon: ComponentType<{ className?: string }>
  section: AdminNavSectionId
}

export interface AdminNavSection {
  id: AdminNavSectionId
  label: string | null
}

const PRODUCT_PERMISSIONS = [
  'products.view',
  'products.create',
  'products.edit',
  'products.delete',
  'products.publish',
  'products.archive',
  'products.export',
]

const PRODUCT_CREATE_PERMISSIONS = ['products.create']
const PRODUCT_EDIT_PERMISSIONS = ['products.edit']

const ORDER_PERMISSIONS = [
  'orders.view',
  'orders.create',
  'orders.edit',
  'orders.cancel',
  'orders.refund',
  'orders.fulfill',
  'orders.export',
]

const CONTENT_PERMISSIONS = [
  'content.view',
  'content.create',
  'content.edit',
  'content.delete',
  'content.publish',
  'content.schedule',
]

const REVIEW_PERMISSIONS = ['reviews.view', 'reviews.moderate', 'reviews.delete']
const PARTNER_PERMISSIONS = ['partners.view', 'partners.review', 'partners.approve', 'partners.reject', 'partners.provision', 'partners.manage']
const STAFF_PERMISSIONS = ['staff.view', 'staff.invite', 'staff.edit', 'staff.disable', 'staff.delete']
const SETTINGS_PERMISSIONS = ['settings.view', 'settings.edit', 'billing.view']
const ANALYTICS_PERMISSIONS = ['analytics.view', 'analytics.export']
const DASHBOARD_PERMISSIONS = ['dashboard.view']
const ACCESS_CONTROL_PERMISSIONS = ['roles.manage']

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  { id: 'top', label: null },
  { id: 'my-store', label: 'My Store' },
  { id: 'growth', label: 'Growth' },
  { id: 'team', label: 'Team' },
  { id: 'system', label: 'System' },
]

export const ADMIN_ROUTE_DEFINITIONS: AdminRouteDefinition[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiredAnyPermissions: DASHBOARD_PERMISSIONS,
    showInNavigation: true,
    section: 'top',
  },
  {
    path: '/orders',
    label: 'Orders',
    icon: ShoppingCart,
    requiredAnyPermissions: ORDER_PERMISSIONS,
    showInNavigation: true,
    section: 'my-store',
  },
  {
    path: '/products',
    label: 'Products',
    icon: Package,
    requiredAnyPermissions: PRODUCT_PERMISSIONS,
    showInNavigation: true,
    section: 'my-store',
  },
  {
    path: '/partners',
    label: 'Partner Stores',
    icon: Users,
    requiredAnyPermissions: PARTNER_PERMISSIONS,
    showInNavigation: true,
    section: 'my-store',
  },
  {
    path: '/brands',
    label: 'Brands',
    icon: Tag,
    requiredAnyPermissions: PRODUCT_PERMISSIONS,
    showInNavigation: true,
    section: 'my-store',
  },
  {
    path: '/content',
    label: 'Content',
    icon: FileText,
    requiredAnyPermissions: CONTENT_PERMISSIONS,
    showInNavigation: true,
    section: 'growth',
  },
  {
    path: '/reviews',
    label: 'Reviews',
    icon: Star,
    requiredAnyPermissions: REVIEW_PERMISSIONS,
    showInNavigation: true,
    section: 'growth',
  },
  {
    path: '/skin-types',
    label: 'Skin Types',
    icon: Droplets,
    requiredAnyPermissions: PRODUCT_PERMISSIONS,
    showInNavigation: true,
    section: 'growth',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    requiredAnyPermissions: ANALYTICS_PERMISSIONS,
    showInNavigation: true,
    section: 'growth',
  },
  {
    path: '/staff',
    label: 'Staff',
    icon: Users,
    requiredAnyPermissions: STAFF_PERMISSIONS,
    showInNavigation: true,
    section: 'team',
  },
  {
    path: '/access-control',
    label: 'Access Control',
    icon: ShieldCheck,
    requiredAnyPermissions: ACCESS_CONTROL_PERMISSIONS,
    showInNavigation: true,
    section: 'team',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    requiredAnyPermissions: SETTINGS_PERMISSIONS,
    showInNavigation: true,
    section: 'system',
  },
  // Kept as route for redirects; no longer shown in sidebar
  {
    path: '/social',
    label: 'Social & Contact',
    requiredAnyPermissions: SETTINGS_PERMISSIONS,
    showInNavigation: false,
    section: 'system',
  },
  {
    path: '/products/new',
    label: 'Create Product',
    requiredAnyPermissions: PRODUCT_CREATE_PERMISSIONS,
    showInNavigation: false,
  },
  {
    path: '/products/:productId',
    label: 'Edit Product',
    requiredAnyPermissions: PRODUCT_EDIT_PERMISSIONS,
    showInNavigation: false,
  },
]

export const ADMIN_NAV_ITEMS = ADMIN_ROUTE_DEFINITIONS.filter(
  (item): item is AdminNavItem => item.showInNavigation && Boolean(item.icon),
).map((item) => ({
  ...item,
  section: item.section ?? 'top',
}))

export const hasAnyPermission = (permissionSet: Set<string>, requiredAnyPermissions: string[]) => {
  if (requiredAnyPermissions.length === 0) {
    return true
  }

  return requiredAnyPermissions.some((permission) => permissionSet.has(permission))
}

export const hasAllPermissions = (permissionSet: Set<string>, requiredPermissions: string[]) => {
  if (requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every((permission) => permissionSet.has(permission))
}

export const getFirstAccessibleAdminPath = (permissionSet: Set<string>) => {
  const accessibleItem = ADMIN_NAV_ITEMS.find((item) => hasAnyPermission(permissionSet, item.requiredAnyPermissions))
  return accessibleItem?.path ?? null
}

export const ADMIN_MODULE_PERMISSIONS = {
  dashboard: DASHBOARD_PERMISSIONS,
  content: CONTENT_PERMISSIONS,
  reviews: REVIEW_PERMISSIONS,
  partners: PARTNER_PERMISSIONS,
  orders: ORDER_PERMISSIONS,
  products: PRODUCT_PERMISSIONS,
  productsNew: PRODUCT_CREATE_PERMISSIONS,
  productsEdit: PRODUCT_EDIT_PERMISSIONS,
  brands: PRODUCT_PERMISSIONS,
  staff: STAFF_PERMISSIONS,
  settings: SETTINGS_PERMISSIONS,
  analytics: ANALYTICS_PERMISSIONS,
  accessControl: ACCESS_CONTROL_PERMISSIONS,
} as const
