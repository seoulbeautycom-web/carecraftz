import { useEffect, useState } from 'react'
import NewHeader from './NewHeader'
import AnnouncementBar from './AnnouncementBar'
import ProductCard from './ProductCard'
import { supabase } from '../lib/supabase'

interface Product {
  id: string
  name: string
  subtitle: string
  price: number
  currency: 'PKR' | 'AED'
  image: string
  bgColor: string
  shadowColor: string
}

const colorSchemes = [
  { bg: '#A8E6CF', shadow: '#00C853' },
  { bg: '#FFB899', shadow: '#FF6B35' },
  { bg: '#FFE66D', shadow: '#FFC107' },
  { bg: '#E8D5F2', shadow: '#9C27B0' },
  { bg: '#B4E7F0', shadow: '#00BCD4' },
  { bg: '#FFD1DC', shadow: '#FF4081' },
]

export default function NewHomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .limit(6)
    
    if (data) {
      const mappedProducts = data.map((p, index) => {
        const colors = colorSchemes[index % colorSchemes.length]
        return {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle || p.description?.substring(0, 50) || 'Natural skincare',
          price: p.price_pkr || p.price_aed || 0,
          currency: (p.currency || 'PKR') as 'PKR' | 'AED',
          image: p.image || '/cclogo.png',
          bgColor: colors.bg,
          shadowColor: colors.shadow,
        }
      })
      setProducts(mappedProducts)
    }
    setLoading(false)
  }

  return (
    <div className="h-screen w-screen bg-[#E8A4E0] p-3 overflow-hidden">
      {/* Inner Container - Fixed height, internal scroll */}
      <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <NewHeader />
        <AnnouncementBar />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <section className="w-full">
            <img 
              src="/herosec.png" 
              alt="CareCraftz Hero"
              className="w-full h-auto object-cover"
            />
          </section>

          {/* Main Content */}
          <main className="px-4 py-8 md:px-8 lg:px-12">
            {/* Section Title */}
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2b2b2b]">
                Shop Our Bestsellers
              </h2>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="rounded-3xl p-6 h-96 bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-[#2b2b2b]/60">No products available</p>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-[#eeecfe] px-4 py-8 md:px-8 lg:px-12 mt-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <h3 className="font-bold text-[#2b2b2b] text-lg mb-3">CareCraftz</h3>
                  <p className="text-[#2b2b2b]/70 text-sm max-w-sm">
                    Premium handmade and Korean skincare products.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2b2b2b] mb-3">Shop</h4>
                  <ul className="space-y-2 text-sm text-[#2b2b2b]/70">
                    <li><a href="/shop" className="hover:text-[#ff9570]">All Products</a></li>
                    <li><a href="/shop" className="hover:text-[#ff9570]">Bestsellers</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2b2b2b] mb-3">Support</h4>
                  <ul className="space-y-2 text-sm text-[#2b2b2b]/70">
                    <li><a href="/faq" className="hover:text-[#ff9570]">FAQ</a></li>
                    <li><a href="/contact" className="hover:text-[#ff9570]">Contact</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[#2b2b2b]/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#2b2b2b]/50">
                  © 2025 CareCraftz. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-xs text-[#2b2b2b]/50">
                  <a href="/privacy" className="hover:text-[#2b2b2b]">Privacy Policy</a>
                  <a href="/terms" className="hover:text-[#2b2b2b]">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
