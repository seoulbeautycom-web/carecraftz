import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SeoulBeauty from './components/SeoulBeauty'
import AboutUs from './components/AboutUs'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import FutureLaunches from './pages/FutureLaunches'
import Craft from './pages/Craft'
import Blog from './pages/Blog'
import Refill from './pages/Refill'
import Partners from './pages/Partners'
import CartPage from './pages/CartPage'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import AuthCallback from './pages/auth/AuthCallback'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Checkout from './pages/Checkout'
import WhatsAppButton from './components/WhatsAppButton'
import CartDrawer from './components/CartDrawer'
import NewHomePage from './components/NewHomePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={
              <AuthProvider>
                <CartProvider>
                  <NewHomePage />
                </CartProvider>
              </AuthProvider>
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
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={
              <>
                <ProductDetail />
                <WhatsAppButton />
                <CartDrawer />
              </>
            } />
            <Route path="/future-launches" element={<FutureLaunches />} />
            <Route path="/craft" element={<Craft />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/refill" element={<Refill />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/rewards" element={<Navigate to="/partners" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<CartPage />} />
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
            <Route path="/checkout" element={<Checkout />} />
            {/* Admin routes removed - use admin.carecraftz.com */}
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
