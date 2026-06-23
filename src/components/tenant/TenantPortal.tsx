import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import {
  ChevronRight,
  LogOut,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
} from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { TenantAccessProvider } from '../../contexts/TenantAccessContext'
import { useTenantAccess } from '../../contexts/tenant-access-context'
import { TENANT_NAV_ITEMS, getTenantPath, getTenantRootPath } from '../../lib/tenantNavigation'

interface TenantRouteScopeProps {
  children?: ReactNode
}

interface TenantProtectedRouteProps {
  children: ReactNode
  requiredAnyPermissions?: string[]
  requiredAllPermissions?: string[]
}

const loadingShell = (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-slate-300 shadow-2xl backdrop-blur">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
      <span>Loading partner portal...</span>
    </div>
  </div>
)

function TenantRestrictedCard({ reason, onSignOut }: { reason: string | null; onSignOut: () => Promise<void> }) {
  const message = reason === 'partner_membership_missing'
    ? 'No partner membership was found for this account.'
    : reason === 'store_access_denied'
      ? 'You do not have access to this store.'
      : reason === 'store_not_found'
        ? 'This partner store could not be found.'
        : reason === 'partner_permissions_missing'
          ? 'You are linked to this store, but no partner modules are enabled for your account.'
        : 'You do not currently have access to a partner store.'

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3 text-amber-300">
            <ShieldAlert className="h-6 w-6" />
            <p className="text-xs font-semibold uppercase tracking-[0.32em]">Access restricted</p>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-white">Partner portal access unavailable</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{message}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await onSignOut()
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TenantRouteScope({ children }: TenantRouteScopeProps) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug ?? null

  return (
    <TenantAccessProvider targetSlug={slug}>
      <TenantLayout>{children ?? <Outlet />}</TenantLayout>
    </TenantAccessProvider>
  )
}

export function TenantLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    loading,
    error,
    isAuthorized,
    reason,
    slug,
    displayName,
    legalName,
    tenantType,
    roleCodes,
    accessibleStores,
    hasAnyPermission,
  } = useTenantAccess()

  const menuItems = useMemo(
    () => TENANT_NAV_ITEMS.filter((item) => hasAnyPermission(item.requiredAnyPermissions)),
    [hasAnyPermission],
  )

  if (authLoading || loading) {
    return loadingShell
  }

  if (!user) {
    return <>{children}</>
  }

  if (!isAuthorized) {
    return <TenantRestrictedCard reason={reason} onSignOut={signOut} />
  }

  const currentSlug = slug ?? accessibleStores[0]?.slug ?? ''
  const currentStoreLabel = displayName || legalName || currentSlug || 'Partner store'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-800 bg-slate-950/95 px-4 py-5 backdrop-blur xl:w-80">
          <Link to={getTenantPath(currentSlug || 'carecraftz')} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 transition-colors hover:border-emerald-500/40 hover:bg-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">{currentStoreLabel}</span>
                {tenantType ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                    {tenantType}
                  </span>
                ) : null}
              </div>
              <span className="block truncate text-xs text-slate-400">/{currentSlug}</span>
            </div>
          </Link>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Roles</p>
                <p className="mt-1 text-sm text-slate-200">{roleCodes.length ? roleCodes.join(' • ') : 'No role codes'}</p>
              </div>
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search store..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const path = getTenantPath(currentSlug, item.segment)
              const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`)

              return (
                <Link
                  key={item.segment}
                  to={path}
                  className={`flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              )
            })}
          </nav>

          {accessibleStores.length > 1 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Accessible stores</p>
              <div className="mt-3 space-y-2">
                {accessibleStores.map((store) => {
                  const storeSlug = store.slug || ''
                  const isCurrent = storeSlug === currentSlug

                  return (
                    <Link
                      key={`${storeSlug}-${store.store_id}`}
                      to={getTenantPath(storeSlug)}
                      className={`block rounded-xl border px-3 py-2 transition-colors ${
                        isCurrent
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="block text-sm font-medium">{store.display_name || store.legal_name || storeSlug}</span>
                      <span className="block text-xs text-slate-500">/{storeSlug}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={async () => {
                await signOut()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-slate-950">
          <div className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-8 space-y-4">
            {error ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function TenantEntryRedirect() {
  const location = useLocation()
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading: accessLoading, landingPath, isAuthorized, reason } = useTenantAccess()

  if (authLoading || accessLoading) {
    return loadingShell
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  }

  if (landingPath) {
    return <Navigate to={landingPath} replace />
  }

  if (!isAuthorized && reason) {
    return <TenantRestrictedCard reason={reason} onSignOut={signOut} />
  }

  return <TenantRestrictedCard reason="partner_permissions_missing" onSignOut={signOut} />
}

export function TenantProtectedRoute({
  children,
  requiredAnyPermissions = [],
  requiredAllPermissions = [],
}: TenantProtectedRouteProps) {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const {
    loading: accessLoading,
    slug,
    landingPath,
    hasAnyPermission,
    hasAllPermissions,
  } = useTenantAccess()

  if (authLoading || accessLoading) {
    return loadingShell
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  }

  const hasRequiredAny = requiredAnyPermissions.length === 0 || hasAnyPermission(requiredAnyPermissions)
  const hasRequiredAll = requiredAllPermissions.length === 0 || hasAllPermissions(requiredAllPermissions)

  if (!hasRequiredAny || !hasRequiredAll) {
    return <Navigate to={landingPath ?? getTenantRootPath(slug ?? 'carecraftz')} replace />
  }

  return <>{children}</>
}
