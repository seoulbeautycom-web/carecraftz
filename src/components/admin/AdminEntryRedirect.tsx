import { LogOut, ShieldAlert } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { useTenantAccess } from '../../contexts/tenant-access-context'
import { getTenantRootPath } from '../../lib/tenantNavigation'

export default function AdminEntryRedirect() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading: accessLoading, landingPath } = useAdminAccess()
  const { loading: tenantAccessLoading, landingPath: tenantLandingPath, slug: tenantSlug, isAuthorized: tenantIsAuthorized } = useTenantAccess()

  if (authLoading || accessLoading || tenantAccessLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-slate-300 shadow-2xl backdrop-blur">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
          <span>Loading admin access...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (landingPath) {
    return <Navigate to={landingPath} replace />
  }

  if (tenantLandingPath) {
    return <Navigate to={tenantLandingPath} replace />
  }

  if (tenantIsAuthorized && tenantSlug) {
    return <Navigate to={getTenantRootPath(tenantSlug)} replace />
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3 text-amber-300">
            <ShieldAlert className="h-6 w-6" />
            <p className="text-xs font-semibold uppercase tracking-[0.32em]">Access restricted</p>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-white">No admin modules are assigned to this account</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Your session is active, but this user does not currently have permission to open any admin sections.
            Ask a super admin to assign the correct permissions in Access Control.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSignOut}
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
