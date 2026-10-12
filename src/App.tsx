import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { StorefrontIdentityProvider } from './contexts/StorefrontIdentityContext'
import BlogPostDetail from './pages/BlogPostDetail'
import AboutUs from './components/AboutUs'
import PageFrame from './components/PageFrame'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import FutureLaunches from './pages/FutureLaunches'
import Blog from './pages/Blog'
import WhyUs from './pages/WhyUs'
import Partners from './pages/Partners'
import CartPage from './pages/CartPage'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import AuthCallback from './pages/auth/AuthCallback'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Checkout from './pages/Checkout'
import NewHomePage from './components/NewHomePage'

function AboutUsPage() {
  return <PageFrame frameColor="#B2D8B2"><AboutUs /></PageFrame>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StorefrontIdentityProvider>
          <AuthModalProvider>
          <CartProvider>
          <Routes>
            {/* All storefront routes use PageFrame (global header/footer + home shell). Only frameColor differs. */}
            <Route path="/" element={<NewHomePage />} />               {/* #E8A4E0 lilac */}
            <Route path="/seoul-beauty" element={<Navigate to="/shop" replace />} />
            <Route path="/about"        element={<AboutUsPage />} />
            <Route path="/about-us"     element={<AboutUsPage />} />
            <Route path="/shop"         element={<Shop />} />           {/* #FF8C69 coral */}
            <Route path="/product/:id"  element={<ProductDetail />} />  {/* #FFAFC5 rose */}
            <Route path="/craft"        element={<Navigate to="/about" replace />} />
            <Route path="/future-launches" element={<FutureLaunches />} /> {/* #7EC8E3 sky */}
            <Route path="/blog"         element={<Blog />} />           {/* #FFD94A yellow */}
            <Route path="/blog/:slug"   element={<BlogPostDetail />} />
            <Route path="/why-us"       element={<WhyUs />} />          {/* #1F2A24 forest */}
            <Route path="/refill"       element={<Navigate to="/why-us" replace />} />
            <Route path="/partners"     element={<Partners />} />       {/* #E8A4E0 lilac */}
            <Route path="/rewards"      element={<Navigate to="/partners" replace />} />
            <Route path="/signin"       element={<SignIn />} />         {/* #C9B8FF purple */}
            <Route path="/signup"       element={<SignUp />} />         {/* #A8E6CF mint */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile"      element={<Profile />} />        {/* #FFD6B0 peach */}
            <Route path="/cart"         element={<CartPage />} />       {/* #B0E4FF sky */}
            <Route path="/checkout"     element={<Checkout />} />       {/* #B5C7EB indigo */}
            <Route path="/privacy"      element={<Privacy />} />        {/* #D4B896 tan */}
            <Route path="/terms"        element={<Terms />} />          {/* #A3C4BC teal */}
            {/* Admin routes — use admin.carecraftz.com */}
          </Routes>
          </CartProvider>
          </AuthModalProvider>
        </StorefrontIdentityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
