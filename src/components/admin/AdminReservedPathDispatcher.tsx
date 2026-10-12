import { matchPath, useLocation } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import StaffDetail from '../../pages/admin/StaffDetail'
import ProductEditor from '../../pages/admin/ProductEditor'
import PartnerStoreEditor from '../../pages/admin/PartnerStoreEditor'
import { ADMIN_MODULE_PERMISSIONS } from '../../lib/adminNavigation'

/**
 * Renders admin detail routes when a tenant `/:slug` route incorrectly captures
 * paths like `/staff/:id` (slug = "staff").
 */
export default function AdminReservedPathDispatcher() {
  const location = useLocation()

  const staffMatch = matchPath({ path: '/staff/:staffId', end: true }, location.pathname)
  if (staffMatch) {
    return (
      <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.staff}>
        <StaffDetail />
      </ProtectedRoute>
    )
  }

  const productMatch = matchPath({ path: '/products/:productId', end: true }, location.pathname)
  if (productMatch) {
    return (
      <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.productsEdit}>
        <ProductEditor />
      </ProtectedRoute>
    )
  }

  const partnerMatch = matchPath({ path: '/partners/:storeId', end: true }, location.pathname)
  if (partnerMatch) {
    return (
      <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.partners}>
        <PartnerStoreEditor />
      </ProtectedRoute>
    )
  }

  return null
}
