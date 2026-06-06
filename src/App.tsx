import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
