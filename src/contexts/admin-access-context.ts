import { createContext, useContext } from 'react'

export interface AdminAccessSnapshot {
  is_authorized?: boolean
  reason?: string | null
  staff_id?: string | null
  user_id?: string | null
  full_name?: string | null
  email?: string | null
  role_code?: string | null
  permissions?: string[] | null
}

export interface AdminAccessState {
  loading: boolean
  error: string | null
  isAuthorized: boolean
  reason: string | null
  staffId: string | null
  userId: string | null
  fullName: string | null
  email: string | null
  roleCode: string | null
  permissions: string[]
  permissionsSet: Set<string>
  landingPath: string | null
  refresh: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

export const AdminAccessContext = createContext<AdminAccessState | undefined>(undefined)

export function useAdminAccess() {
  const context = useContext(AdminAccessContext)
  if (!context) {
    throw new Error('useAdminAccess must be used within an AdminAccessProvider')
  }

  return context
}
