import { createContext, useContext } from 'react'

export interface TenantAccessibleStore {
  store_id?: string
  slug?: string
  display_name?: string
  legal_name?: string
  tenant_type?: string
  status?: string
  approval_status?: string
  role_codes?: string[]
  permissions?: string[]
}

export interface TenantAccessSnapshot {
  is_authorized?: boolean
  reason?: string | null
  user_id?: string | null
  store_id?: string | null
  slug?: string | null
  display_name?: string | null
  legal_name?: string | null
  tenant_type?: string | null
  status?: string | null
  approval_status?: string | null
  role_codes?: string[] | null
  permissions?: string[] | null
  accessible_stores?: TenantAccessibleStore[] | null
  landing_path?: string | null
}

export interface TenantAccessState {
  loading: boolean
  error: string | null
  isAuthorized: boolean
  reason: string | null
  userId: string | null
  storeId: string | null
  slug: string | null
  displayName: string | null
  legalName: string | null
  tenantType: string | null
  status: string | null
  approvalStatus: string | null
  roleCodes: string[]
  permissions: string[]
  permissionsSet: Set<string>
  accessibleStores: TenantAccessibleStore[]
  landingPath: string | null
  refresh: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

export const TenantAccessContext = createContext<TenantAccessState | undefined>(undefined)

export function useTenantAccess() {
  const context = useContext(TenantAccessContext)
  if (!context) {
    throw new Error('useTenantAccess must be used within a TenantAccessProvider')
  }

  return context
}
