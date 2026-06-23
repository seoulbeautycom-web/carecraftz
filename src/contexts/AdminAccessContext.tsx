import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFirstAccessibleAdminPath, hasAllPermissions, hasAnyPermission } from '../lib/adminNavigation'
import { useAuth } from './auth-context'
import { AdminAccessContext } from './admin-access-context'
import type { AdminAccessSnapshot, AdminAccessState } from './admin-access-context'

const EMPTY_PERMISSIONS: string[] = []

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

const normalizeSnapshot = (value: unknown): AdminAccessSnapshot => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const record = value as Record<string, unknown>

  return {
    is_authorized: typeof record.is_authorized === 'boolean' ? record.is_authorized : undefined,
    reason: typeof record.reason === 'string' ? record.reason : null,
    staff_id: typeof record.staff_id === 'string' ? record.staff_id : null,
    user_id: typeof record.user_id === 'string' ? record.user_id : null,
    full_name: typeof record.full_name === 'string' ? record.full_name : null,
    email: typeof record.email === 'string' ? record.email : null,
    role_code: typeof record.role_code === 'string' ? record.role_code : null,
    permissions: toStringArray(record.permissions),
  }
}

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<AdminAccessSnapshot | null>(null)

  const refresh = useCallback(async () => {
    if (authLoading) {
      return
    }

    if (!user) {
      setSnapshot(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('current_admin_access_snapshot')

      if (rpcError) {
        throw rpcError
      }

      const nextSnapshot = normalizeSnapshot(data)
      setSnapshot(nextSnapshot)

      if (nextSnapshot.is_authorized === false && ['staff_record_missing', 'staff_inactive'].includes(nextSnapshot.reason || '')) {
        setError(nextSnapshot.reason === 'staff_inactive'
          ? 'Your staff account is inactive. Please contact an administrator.'
          : 'No staff record was found for this account.')
      }
    } catch (rpcError) {
      const message = rpcError instanceof Error ? rpcError.message : 'Failed to load admin access state.'
      setError(message)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [refresh])

  const permissions = snapshot?.permissions ?? EMPTY_PERMISSIONS
  const permissionsSet = useMemo(() => new Set(permissions), [permissions])
  const landingPath = useMemo(() => getFirstAccessibleAdminPath(permissionsSet), [permissionsSet])
  const hasPermission = useCallback((permission: string) => permissionsSet.has(permission), [permissionsSet])
  const hasAny = useCallback((requiredPermissions: string[]) => hasAnyPermission(permissionsSet, requiredPermissions), [permissionsSet])
  const hasAll = useCallback((requiredPermissions: string[]) => hasAllPermissions(permissionsSet, requiredPermissions), [permissionsSet])

  const state: AdminAccessState = {
    loading: authLoading || loading,
    error,
    isAuthorized: snapshot?.is_authorized ?? false,
    reason: snapshot?.reason ?? null,
    staffId: snapshot?.staff_id ?? null,
    userId: snapshot?.user_id ?? null,
    fullName: snapshot?.full_name ?? null,
    email: snapshot?.email ?? null,
    roleCode: snapshot?.role_code ?? null,
    permissions,
    permissionsSet,
    landingPath,
    refresh,
    hasPermission,
    hasAnyPermission: hasAny,
    hasAllPermissions: hasAll,
  }

  return <AdminAccessContext.Provider value={state}>{children}</AdminAccessContext.Provider>
}

