import type { ComponentType } from 'react'
import { LayoutDashboard, Mail, Package, Settings, ShoppingCart, Users } from 'lucide-react'

export interface TenantRouteDefinition {
  segment: string
  label: string
  icon: ComponentType<{ className?: string }>
  requiredAnyPermissions: string[]
  showInNavigation: boolean
}

export interface TenantNavItem extends Omit<TenantRouteDefinition, 'icon'> {
  icon: ComponentType<{ className?: string }>
}

const TENANT_DASHBOARD_PERMISSIONS = ['partner.dashboard.view']
const TENANT_PRODUCT_PERMISSIONS = ['partner.products.view', 'partner.products.create', 'partner.products.edit', 'partner.products.delete']
const TENANT_ORDER_PERMISSIONS = ['partner.orders.view', 'partner.orders.fulfill', 'partner.orders.export']
const TENANT_MEMBER_PERMISSIONS = ['partner.members.view', 'partner.members.manage']
const TENANT_INVITE_PERMISSIONS = ['partner.invites.view', 'partner.invites.manage']
const TENANT_SETTINGS_PERMISSIONS = ['partner.settings.view', 'partner.settings.edit']

export const TENANT_ROUTE_DEFINITIONS: TenantRouteDefinition[] = [
  {
    segment: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    requiredAnyPermissions: TENANT_DASHBOARD_PERMISSIONS,
    showInNavigation: true,
  },
  {
    segment: 'products',
    label: 'Products',
    icon: Package,
    requiredAnyPermissions: TENANT_PRODUCT_PERMISSIONS,
    showInNavigation: true,
  },
  {
    segment: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    requiredAnyPermissions: TENANT_ORDER_PERMISSIONS,
    showInNavigation: true,
  },
  {
    segment: 'members',
    label: 'Members',
    icon: Users,
    requiredAnyPermissions: TENANT_MEMBER_PERMISSIONS,
    showInNavigation: true,
  },
  {
    segment: 'invites',
    label: 'Invites',
    icon: Mail,
    requiredAnyPermissions: TENANT_INVITE_PERMISSIONS,
    showInNavigation: true,
  },
  {
    segment: 'settings',
    label: 'Settings',
    icon: Settings,
    requiredAnyPermissions: TENANT_SETTINGS_PERMISSIONS,
    showInNavigation: true,
  },
]

export const TENANT_NAV_ITEMS = TENANT_ROUTE_DEFINITIONS.filter((item): item is TenantNavItem => item.showInNavigation && Boolean(item.icon))

export const TENANT_MODULE_PERMISSIONS = {
  dashboard: TENANT_DASHBOARD_PERMISSIONS,
  products: TENANT_PRODUCT_PERMISSIONS,
  orders: TENANT_ORDER_PERMISSIONS,
  members: TENANT_MEMBER_PERMISSIONS,
  invites: TENANT_INVITE_PERMISSIONS,
  settings: TENANT_SETTINGS_PERMISSIONS,
} as const

export const getTenantRootPath = (slug: string) => `/org/${slug}`

export const getTenantPath = (slug: string, segment = 'dashboard') => `/org/${slug}/${segment}`

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

export const getFirstAccessibleTenantPath = (permissionSet: Set<string>, slug: string | null) => {
  if (!slug) {
    return null
  }

  const accessibleItem = TENANT_NAV_ITEMS.find((item) => hasAnyPermission(permissionSet, item.requiredAnyPermissions))
  return accessibleItem ? getTenantPath(slug, accessibleItem.segment) : null
}
