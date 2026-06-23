import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFirstAccessibleTenantPath, hasAllPermissions, hasAnyPermission } from '../lib/tenantNavigation'
import { useAuth } from './auth-context'
import { TenantAccessContext } from './tenant-access-context'
import type { TenantAccessSnapshot, TenantAccessState, TenantAccessibleStore } from './tenant-access-context'

const EMPTY_PERMISSIONS: string[] = []
const EMPTY_STORES: TenantAccessibleStore[] = []

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

const toAccessibleStores = (value: unknown): TenantAccessibleStore[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      store_id: typeof entry.store_id === 'string' ? entry.store_id : undefined,
      slug: typeof entry.slug === 'string' ? entry.slug : undefined,
      display_name: typeof entry.display_name === 'string' ? entry.display_name : undefined,
      legal_name: typeof entry.legal_name === 'string' ? entry.legal_name : undefined,
      tenant_type: typeof entry.tenant_type === 'string' ? entry.tenant_type : undefined,
      status: typeof entry.status === 'string' ? entry.status : undefined,
      approval_status: typeof entry.approval_status === 'string' ? entry.approval_status : undefined,
      role_codes: toStringArray(entry.role_codes),
      permissions: toStringArray(entry.permissions),
    }))
}

const normalizeSnapshot = (value: unknown): TenantAccessSnapshot => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const record = value as Record<string, unknown>

  return {
    is_authorized: typeof record.is_authorized === 'boolean' ? record.is_authorized : undefined,
    reason: typeof record.reason === 'string' ? record.reason : null,
    user_id: typeof record.user_id === 'string' ? record.user_id : null,
    store_id: typeof record.store_id === 'string' ? record.store_id : null,
    slug: typeof record.slug === 'string' ? record.slug : null,
    display_name: typeof record.display_name === 'string' ? record.display_name : null,
    legal_name: typeof record.legal_name === 'string' ? record.legal_name : null,
    tenant_type: typeof record.tenant_type === 'string' ? record.tenant_type : null,
    status: typeof record.status === 'string' ? record.status : null,
    approval_status: typeof record.approval_status === 'string' ? record.approval_status : null,
    role_codes: toStringArray(record.role_codes),
    permissions: toStringArray(record.permissions),
    accessible_stores: toAccessibleStores(record.accessible_stores),
    landing_path: typeof record.landing_path === 'string' ? record.landing_path : null,
  }
}

export function TenantAccessProvider({
  children,
  targetSlug = null,
}: {
  children: React.ReactNode
  targetSlug?: string | null
}) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<TenantAccessSnapshot | null>(null)

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
      const { data, error: rpcError } = await supabase.rpc('current_partner_access_snapshot', {
        target_slug: targetSlug,
      })

      if (rpcError) {
        throw rpcError
      }

      const nextSnapshot = normalizeSnapshot(data)
      setSnapshot(nextSnapshot)

      if (nextSnapshot.is_authorized === false && nextSnapshot.reason) {
        const readableReason = nextSnapshot.reason === 'not_authenticated'
          ? 'Please sign in to access partner portals.'
          : nextSnapshot.reason === 'store_access_denied'
            ? 'You do not have access to that store.'
            : nextSnapshot.reason === 'store_not_found'
              ? 'That partner store could not be found.'
              : nextSnapshot.reason === 'partner_membership_missing'
                ? 'No partner membership was found for this account.'
                : 'Unable to load partner access state.'
        setError(readableReason)
      }
    } catch (rpcError) {
      const message = rpcError instanceof Error ? rpcError.message : 'Failed to load partner access state.'
      setError(message)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [authLoading, targetSlug, user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [refresh])

  const permissions = snapshot?.permissions ?? EMPTY_PERMISSIONS
  const permissionsSet = useMemo(() => new Set(permissions), [permissions])
  const landingPath = useMemo(() => snapshot?.landing_path ?? getFirstAccessibleTenantPath(permissionsSet, snapshot?.slug ?? targetSlug), [permissionsSet, snapshot?.landing_path, snapshot?.slug, targetSlug])
  const hasPermission = useCallback((permission: string) => permissionsSet.has(permission), [permissionsSet])
  const hasAny = useCallback((requiredPermissions: string[]) => hasAnyPermission(permissionsSet, requiredPermissions), [permissionsSet])
  const hasAll = useCallback((requiredPermissions: string[]) => hasAllPermissions(permissionsSet, requiredPermissions), [permissionsSet])

  const state: TenantAccessState = {
    loading: authLoading || loading,
    error,
    isAuthorized: snapshot?.is_authorized ?? false,
    reason: snapshot?.reason ?? null,
    userId: snapshot?.user_id ?? null,
    storeId: snapshot?.store_id ?? null,
    slug: snapshot?.slug ?? targetSlug ?? null,
    displayName: snapshot?.display_name ?? null,
    legalName: snapshot?.legal_name ?? null,
    tenantType: snapshot?.tenant_type ?? null,
    status: snapshot?.status ?? null,
    approvalStatus: snapshot?.approval_status ?? null,
    roleCodes: snapshot?.role_codes ?? EMPTY_PERMISSIONS,
    permissions,
    permissionsSet,
    accessibleStores: snapshot?.accessible_stores ?? EMPTY_STORES,
    landingPath,
    refresh,
    hasPermission,
    hasAnyPermission: hasAny,
    hasAllPermissions: hasAll,
  }

  return <TenantAccessContext.Provider value={state}>{children}</TenantAccessContext.Provider>
}
