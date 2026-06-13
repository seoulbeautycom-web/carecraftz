import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SoapProvider } from './context/SoapContext'
import Navbar from './components/Navbar'
import FlyingSoap from './components/FlyingSoap'
import HeroSection from './components/HeroSection'
import UnwrapSection from './components/UnwrapSection'
import CraftSection from './components/CraftSection'
import HandsSection from './components/HandsSection'
import ShopSection from './components/ShopSection'
import Footer from './components/Footer'
import SeoulBeauty from './components/SeoulBeauty'
import AboutUs from './components/AboutUs'
import Shop from './pages/Shop'
import FutureLaunches from './pages/FutureLaunches'
import Craft from './pages/Craft'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import StaffManagement from './pages/admin/Staff'
import Products from './pages/admin/Products'
import Settings from './pages/admin/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <SoapProvider>
            <Navbar />
            <FlyingSoap />
            <main>
              <HeroSection />
              <UnwrapSection />
              <CraftSection />
              <HandsSection />
              <ShopSection />
            </main>
            <Footer />
          </SoapProvider>
        } />
        <Route path="/seoul-beauty" element={
          <>
            <Navbar />
            <SeoulBeauty />
            <Footer />
          </>
        } />
        <Route path="/about" element={
          <>
            <Navbar />
            <AboutUs />
            <Footer />
          </>
        } />
        <Route path="/about-us" element={
          <>
            <Navbar />
            <AboutUs />
            <Footer />
          </>
        } />
        <Route path="/shop" element={
          <>
            <Navbar />
            <Shop />
            <Footer />
          </>
        } />
        <Route path="/future-launches" element={
          <>
            <Navbar />
            <FutureLaunches />
            <Footer />
          </>
        } />
        <Route path="/craft" element={
          <>
            <Navbar />
            <Craft />
            <Footer />
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
    </BrowserRouter>
  )
}

export default App
