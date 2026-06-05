import { SoapProvider } from './context/SoapContext'
import Navbar from './components/Navbar'
import FlyingSoap from './components/FlyingSoap'
import HeroSection from './components/HeroSection'
import CraftSection from './components/CraftSection'
import HandsSection from './components/HandsSection'
import ShopSection from './components/ShopSection'
import Footer from './components/Footer'

function App() {
  return (
    <SoapProvider>
      <Navbar />
      <FlyingSoap />
      <main>
        <HeroSection />
        <CraftSection />
        <HandsSection />
        <ShopSection />
      </main>
      <Footer />
    </SoapProvider>
  )
}

export default App
