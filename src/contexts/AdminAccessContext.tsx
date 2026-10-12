import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFirstAccessibleAdminPath, hasAllPermissions, hasAnyPermission } from '../lib/adminNavigation'
import { DEFAULT_OPS_SETTINGS, fetchPlatformOpsSettings } from '../lib/opsSettings'
import { useAuth } from './auth-context'
import { AdminAccessContext } from './admin-access-context'
import type { AdminAccessSnapshot, AdminAccessState } from './admin-access-context'

const EMPTY_PERMISSIONS: string[] = []
const ADMIN_ACTIVITY_KEY = 'carecraftz_admin_last_activity'

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

  // Enforce admin session timeout from platform ops security settings.
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const touch = () => {
      localStorage.setItem(ADMIN_ACTIVITY_KEY, String(Date.now()))
    }

    const checkTimeout = async () => {
      const ops = await fetchPlatformOpsSettings()
      if (cancelled) return
      const hours = ops.security.session_timeout_hours || DEFAULT_OPS_SETTINGS.security.session_timeout_hours
      const last = Number(localStorage.getItem(ADMIN_ACTIVITY_KEY) || '0')
      const limitMs = Math.max(1, hours) * 60 * 60 * 1000
      if (last > 0 && Date.now() - last > limitMs) {
        localStorage.removeItem(ADMIN_ACTIVITY_KEY)
        await supabase.auth.signOut()
        return
      }
      touch()
    }

    void checkTimeout()
    touch()

    const onActivity = () => touch()
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    const interval = window.setInterval(() => {
      void checkTimeout()
    }, 60_000)

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.clearInterval(interval)
    }
  }, [user])

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

