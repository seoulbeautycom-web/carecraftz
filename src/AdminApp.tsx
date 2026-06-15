import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import StaffManagement from './pages/admin/Staff'
import Products from './pages/admin/Products'
import Settings from './pages/admin/Settings'
import Analytics from './pages/admin/Analytics'
import Reviews from './pages/admin/Reviews'
import BlogPosts from './pages/admin/BlogPosts'
import SocialMedia from './pages/admin/SocialMedia'
import SkinTypes from './pages/admin/SkinTypes'

/**
 * Admin Portal App - Separate from customer-facing site
 * Deploy to: admin.carecraftz.com
 * Build: npm run build:admin
 */
function AdminApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin Login - No protected route */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute>
              <StaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/reviews" element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          } />
          <Route path="/content" element={
            <ProtectedRoute>
              <BlogPosts />
            </ProtectedRoute>
          } />
          <Route path="/social" element={
            <ProtectedRoute>
              <SocialMedia />
            </ProtectedRoute>
          } />
          <Route path="/skin-types" element={
            <ProtectedRoute>
              <SkinTypes />
            </ProtectedRoute>
          } />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AdminApp
