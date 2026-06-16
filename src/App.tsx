import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import SeoulBeauty from './components/SeoulBeauty'
import AboutUs from './components/AboutUs'
import PageFrame from './components/PageFrame'
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
import NewHomePage from './components/NewHomePage'

// Inline page wrappers for components that are not yet standalone pages
function SeoulBeautyPage() {
  return <PageFrame frameColor="#F7B2BD" scrollDriven={true}><SeoulBeauty /></PageFrame>
}
function AboutUsPage() {
  return <PageFrame frameColor="#B2D8B2" scrollDriven={true}><AboutUs /></PageFrame>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Home — uses its own self-contained frame (pink #E8A4E0) */}
            <Route path="/" element={<NewHomePage />} />

            {/* All other pages — PageFrame is the single source of truth for frame/header/footer */}
            <Route path="/seoul-beauty" element={<SeoulBeautyPage />} />
            <Route path="/about"        element={<AboutUsPage />} />
            <Route path="/about-us"     element={<AboutUsPage />} />
            <Route path="/shop"         element={<Shop />} />           {/* #FF8C69 coral — scrollDriven */}
            <Route path="/product/:id"  element={<ProductDetail />} />  {/* #FFAFC5 rose  — scrollDriven */}
            <Route path="/craft"        element={<Craft />} />          {/* #8DEBD1 mint  — scrollDriven */}
            <Route path="/future-launches" element={<FutureLaunches />} /> {/* #7EC8E3 sky — scrollDriven */}
            <Route path="/blog"         element={<Blog />} />           {/* #FFD94A yellow */}
            <Route path="/refill"       element={<Refill />} />         {/* #F4956A peach */}
            <Route path="/partners"     element={<Partners />} />       {/* #E8A4E0 lilac */}
            <Route path="/rewards"      element={<Navigate to="/partners" replace />} />
            <Route path="/signin"       element={<SignIn />} />         {/* #C9B8FF purple */}
            <Route path="/signup"       element={<SignUp />} />         {/* #A8E6CF mint */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile"      element={<Profile />} />        {/* #FFD6B0 peach */}
            <Route path="/cart"         element={<CartPage />} />       {/* #B0E4FF sky */}
            <Route path="/checkout"     element={<Checkout />} />       {/* #B5C7EB indigo */}
            <Route path="/privacy"      element={<Privacy />} />        {/* #D4B896 tan */}
            <Route path="/terms"        element={<Terms />} />          {/* #A3C4BC teal */}
            {/* Admin routes — use admin.carecraftz.com */}
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
