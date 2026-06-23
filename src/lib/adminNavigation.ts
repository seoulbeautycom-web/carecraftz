import type { ComponentType } from 'react'
import {
  BarChart3,
  Droplets,
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'

export interface AdminRouteDefinition {
  path: string
  label: string
  icon?: ComponentType<{ className?: string }>
  requiredAnyPermissions: string[]
  showInNavigation: boolean
}

export interface AdminNavItem extends Omit<AdminRouteDefinition, 'icon'> {
  icon: ComponentType<{ className?: string }>
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

export const ADMIN_ROUTE_DEFINITIONS: AdminRouteDefinition[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiredAnyPermissions: DASHBOARD_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/content',
    label: 'Content',
    icon: FileText,
    requiredAnyPermissions: CONTENT_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/reviews',
    label: 'Reviews',
    icon: Star,
    requiredAnyPermissions: REVIEW_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/master/partners',
    label: 'Partners',
    icon: Users,
    requiredAnyPermissions: PARTNER_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/orders',
    label: 'Orders',
    icon: ShoppingCart,
    requiredAnyPermissions: ORDER_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/products',
    label: 'Products',
    icon: Package,
    requiredAnyPermissions: PRODUCT_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/skin-types',
    label: 'Skin Types',
    icon: Droplets,
    requiredAnyPermissions: PRODUCT_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/social',
    label: 'Social & Contact',
    icon: Globe,
    requiredAnyPermissions: SETTINGS_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/staff',
    label: 'Staff',
    icon: Users,
    requiredAnyPermissions: STAFF_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    requiredAnyPermissions: ANALYTICS_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    requiredAnyPermissions: SETTINGS_PERMISSIONS,
    showInNavigation: true,
  },
  {
    path: '/access-control',
    label: 'Access Control',
    icon: ShieldCheck,
    requiredAnyPermissions: ACCESS_CONTROL_PERMISSIONS,
    showInNavigation: true,
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

export const ADMIN_NAV_ITEMS = ADMIN_ROUTE_DEFINITIONS.filter((item): item is AdminNavItem => item.showInNavigation && Boolean(item.icon))

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
  staff: STAFF_PERMISSIONS,
  settings: SETTINGS_PERMISSIONS,
  analytics: ANALYTICS_PERMISSIONS,
  accessControl: ACCESS_CONTROL_PERMISSIONS,
} as const
