import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AdminAccessProvider } from './contexts/AdminAccessContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import StaffManagement from './pages/admin/Staff'
import Products from './pages/admin/Products'
import ProductEditor from './pages/admin/ProductEditor'
import Settings from './pages/admin/Settings'
import Analytics from './pages/admin/Analytics'
import Reviews from './pages/admin/Reviews'
import BlogPosts from './pages/admin/BlogPosts'
import SocialMedia from './pages/admin/SocialMedia'
import SkinTypes from './pages/admin/SkinTypes'
import AccessControl from './pages/admin/AccessControl'
import AdminEntryRedirect from './components/admin/AdminEntryRedirect'
import { ADMIN_MODULE_PERMISSIONS } from './lib/adminNavigation'

/**
 * Admin Portal App - Separate from customer-facing site
 * Deploy to: admin.carecraftz.com
 * Build: npm run build:admin
 */
function AdminApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAccessProvider>
          <Routes>
            {/* Admin Login - No protected route */}
            <Route path="/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.dashboard}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.orders}>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.staff}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/products/new" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.productsNew}>
                <ProductEditor />
              </ProtectedRoute>
            } />
            <Route path="/products/:productId" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.productsEdit}>
                <ProductEditor />
              </ProtectedRoute>
            } />
            <Route path="/access-control" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.accessControl}>
                <AccessControl />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.products}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.settings}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.analytics}>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/reviews" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.reviews}>
                <Reviews />
              </ProtectedRoute>
            } />
            <Route path="/content" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.content}>
                <BlogPosts />
              </ProtectedRoute>
            } />
            <Route path="/social" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.settings}>
                <SocialMedia />
              </ProtectedRoute>
            } />
            <Route path="/skin-types" element={
              <ProtectedRoute requiredAnyPermissions={ADMIN_MODULE_PERMISSIONS.products}>
                <SkinTypes />
              </ProtectedRoute>
            } />

            {/* Redirect root and unknown paths to the safest landing page */}
            <Route path="/" element={<AdminEntryRedirect />} />
            <Route path="*" element={<AdminEntryRedirect />} />
          </Routes>
        </AdminAccessProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AdminApp
