import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SoapProvider } from './context/SoapContext'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import FlyingSoap from './components/FlyingSoap'
import HeroSection from './components/HeroSection'
import UnwrapSection from './components/UnwrapSection'
import CraftSection from './components/CraftSection'
import HandsSection from './components/HandsSection'
import ShopSection from './components/ShopSection'
import BrandStory from './components/BrandStory'
import Footer from './components/Footer'
import SeoulBeauty from './components/SeoulBeauty'
import AboutUs from './components/AboutUs'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import FutureLaunches from './pages/FutureLaunches'
import Craft from './pages/Craft'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import AuthCallback from './pages/auth/AuthCallback'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import WhatsAppButton from './components/WhatsAppButton'
import CartDrawer from './components/CartDrawer'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import StaffManagement from './pages/admin/Staff'
import Products from './pages/admin/Products'
import Settings from './pages/admin/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={
              <SoapProvider>
                <Navbar />
                <FlyingSoap />
                <main>
                  <HeroSection />
                  <BrandStory />
                  <UnwrapSection />
                  <CraftSection />
                  <HandsSection />
                  <ShopSection />
                </main>
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </SoapProvider>
            } />
            <Route path="/seoul-beauty" element={
              <>
                <Navbar />
                <SeoulBeauty />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/about" element={
              <>
                <Navbar />
                <AboutUs />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/about-us" element={
              <>
                <Navbar />
                <AboutUs />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/shop" element={
              <>
                <Navbar />
                <Shop />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/product/:id" element={
              <>
                <ProductDetail />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/future-launches" element={
              <>
                <Navbar />
                <FutureLaunches />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/craft" element={
              <>
                <Navbar />
                <Craft />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/signin" element={
              <>
                <Navbar />
                <SignIn />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/signup" element={
              <>
                <Navbar />
                <SignUp />
                <Footer />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy" element={
              <>
                <Privacy />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/terms" element={
              <>
                <Terms />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
