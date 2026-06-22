import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAdminAccess } from '../contexts/admin-access-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredAnyPermissions?: string[]
  requiredAllPermissions?: string[]
}

export default function ProtectedRoute({
  children,
  requiredAnyPermissions = [],
  requiredAllPermissions = [],
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const {
    loading: accessLoading,
    hasAnyPermission,
    hasAllPermissions,
  } = useAdminAccess()

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasRequiredAny = requiredAnyPermissions.length === 0 || hasAnyPermission(requiredAnyPermissions)
  const hasRequiredAll = requiredAllPermissions.length === 0 || hasAllPermissions(requiredAllPermissions)

  if (!hasRequiredAny || !hasRequiredAll) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
