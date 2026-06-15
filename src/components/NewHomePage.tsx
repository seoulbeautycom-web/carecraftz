import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import NewHeader from './NewHeader'
import AnnouncementBar from './AnnouncementBar'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'

const SKIN_TYPES = [
  { label: 'Oily',      color: 'bg-[#c8f135] text-[#2b2b2b]',  activeColor: 'bg-[#a8d41a]' },
  { label: 'Dry',       color: 'bg-[#FFD4B8] text-[#2b2b2b]',  activeColor: 'bg-[#ffb886]' },
  { label: 'Combo',     color: 'bg-[#8DEBD1] text-[#2b2b2b]',  activeColor: 'bg-[#5ed4b5]' },
  { label: 'Sensitive', color: 'bg-[#b8c6ff] text-[#2b2b2b]',  activeColor: 'bg-[#8fa5ff]' },
]

interface Product {
  id: string
  name: string
  subtitle: string
  price: number
  price_pkr: number
  price_aed: number
  currency: 'PKR' | 'AED'
  image: string
  bgColor: string
  shadowColor: string
}

const colorSchemes = [
  { bg: '#8DEBD1', shadow: '#1db954' },
  { bg: '#F4956A', shadow: '#e05c1a' },
  { bg: '#FFD94A', shadow: '#e6b800' },
  { bg: '#E8A4E0', shadow: '#c25bb8' },
  { bg: '#7EC8E3', shadow: '#1a91b8' },
  { bg: '#FF8FAB', shadow: '#d63060' },
]

export default function NewHomePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [skinTypeProducts, setSkinTypeProducts] = useState<Product[]>([])
  const [activeSkinType, setActiveSkinType] = useState('Oily')
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
          subtitle: p.subtitle || p.description?.substring(0, 40) || 'Natural skincare',
          price: p.price_pkr || p.price_aed || 0,
          price_pkr: p.price_pkr || 0,
          price_aed: p.price_aed || 0,
          currency: (p.currency || 'PKR') as 'PKR' | 'AED',
          image: p.image || '',
          bgColor: colors.bg,
          shadowColor: colors.shadow,
        }
      })
      setProducts(mappedProducts)
    }
    setLoading(false)
  }

  const fetchSkinTypeProducts = async (skinType: string) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('skin_type', skinType)
      .limit(6)
    if (data) {
      const mapped = data.map((p, index) => {
        const colors = colorSchemes[index % colorSchemes.length]
        return {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle || p.description?.substring(0, 40) || 'Natural skincare',
          price: p.price_pkr || p.price_aed || 0,
          price_pkr: p.price_pkr || 0,
          price_aed: p.price_aed || 0,
          currency: (p.currency || 'PKR') as 'PKR' | 'AED',
          image: p.image || '',
          bgColor: colors.bg,
          shadowColor: colors.shadow,
        }
      })
      setSkinTypeProducts(mapped)
    } else {
      setSkinTypeProducts([])
    }
  }

  useEffect(() => {
    fetchSkinTypeProducts(activeSkinType)
  }, [activeSkinType])

  const formatPrice = (product: Product) => {
    if (product.price_pkr) return `From ₨${product.price_pkr.toLocaleString()}`
    if (product.price_aed) return `From AED ${product.price_aed}`
    return ''
  }

  return (
    <div className="h-screen w-screen bg-[#E8A4E0] p-3 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Inner Container */}
      <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden">

        {/* Scrollable Content - hero is first, header floats over it */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">

          {/* ── SECTION 1: HERO - full bleed, header floats above ── */}
          <section className="relative w-full">
            {/* Header floats over hero */}
            <NewHeader />

            <img
              src="/herosec.png"
              alt="CareCraftz Hero"
              className="w-full object-cover block"
              style={{ height: '100vh' }}
            />
            {/* Overlaid text card - bottom left */}
            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 max-w-xs shadow-lg">
              <h1 className="text-xl font-bold text-[#2b2b2b] mb-2">Natural Skincare,<br />Crafted With Care</h1>
              <p className="text-sm text-[#696a67] mb-4">Handmade and Korean-inspired beauty. Crafted with care.</p>
              <button
                onClick={() => navigate('/shop')}
                className="bg-[#ff9570] hover:bg-[#ff7a50] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
              >
                Shop Now
              </button>
            </div>
          </section>

          {/* ── SECTION 2: ANNOUNCEMENT BAR - with breathing room ── */}
          <div className="mt-6">
            <AnnouncementBar />
          </div>

          {/* ── SECTION 4: LIFESTYLE IMAGE ── */}
          <section className="relative mx-4 my-8 rounded-3xl overflow-hidden">
            <img
              src="/sec2-v2.png"
              alt="CareCraftz Natural Products"
              className="w-full object-cover block"
              style={{ height: '70vh' }}
            />
            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 max-w-xs shadow-lg">
              <h2 className="text-xl font-bold text-[#2b2b2b] mb-2">Refill. Reuse. Rejoice.</h2>
              <p className="text-sm text-[#696a67] mb-4">Our refill program cuts waste and saves you money. Because good skin shouldn't cost the earth.</p>
              <button
                onClick={() => navigate('/refill')}
                className="bg-[#2b2b2b] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
              >
                Shop Refill Program
              </button>
            </div>
          </section>

          {/* ── SECTION 5: SHOP BY SKIN TYPE ── */}
          <section className="px-4 py-10 md:px-6">
            <h2 className="text-center text-2xl font-semibold text-[#2b2b2b] mb-6">Shop by Skin Type</h2>

            {/* Filter Pills */}
            <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
              {SKIN_TYPES.map((type) => (
                <button
                  key={type.label}
                  onClick={() => setActiveSkinType(type.label)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeSkinType === type.label
                      ? `${type.activeColor} text-[#2b2b2b] scale-105 shadow-md`
                      : `${type.color} opacity-80 hover:opacity-100`
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Horizontal Scrolling Product Cards */}
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {skinTypeProducts.length > 0 ? (
                skinTypeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-3xl p-5 flex flex-col flex-shrink-0 cursor-pointer"
                    style={{
                      width: '280px',
                      backgroundColor: product.bgColor,
                      boxShadow: `5px 5px 0px ${product.shadowColor}`,
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <button
                      className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          currency: product.currency,
                          location: product.currency === 'PKR' ? 'Pakistan' : 'UAE',
                          delivery_charge: product.currency === 'PKR' ? 200 : 15,
                        })
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center justify-center min-h-[200px] py-4">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="max-h-48 max-w-full object-contain drop-shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-white/30 rounded-2xl" />
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold text-[#2b2b2b] text-sm">{product.name}</h3>
                      <p className="text-[#2b2b2b]/70 text-xs italic">{product.subtitle}</p>
                      <p className="text-[#2b2b2b] font-medium text-xs mt-1">{formatPrice(product)}</p>
                    </div>
                  </div>
                ))
              ) : (
                /* Placeholder cards */
                colorSchemes.map((colors, i) => (
                  <div
                    key={i}
                    className="relative rounded-3xl p-5 flex flex-col flex-shrink-0"
                    style={{ width: '280px', backgroundColor: colors.bg, boxShadow: `5px 5px 0px ${colors.shadow}` }}
                  >
                    <button className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="w-24 h-24 bg-white/30 rounded-2xl" />
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 bg-white/40 rounded w-3/4" />
                      <div className="h-3 bg-white/30 rounded w-1/2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── SECTION 6: MORINGA SOAP SPOTLIGHT ── */}
          <section className="mx-4 my-8 rounded-3xl overflow-hidden bg-[#1a2e1a]">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">

              {/* Left: Text Content */}
              <div className="flex flex-col justify-center px-10 py-12 md:px-14">
                {/* Tag */}
                <span className="inline-block bg-[#c8f135] text-[#1a2e1a] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 self-start">
                  Featured Product
                </span>

                <h2 className="text-4xl font-bold text-white leading-tight mb-3">
                  Moringa<br />
                  <span className="text-[#c8f135]">Soap</span>
                </h2>
                <p className="text-[#a8c4a8] text-sm font-medium mb-6 tracking-wide uppercase">
                  Nature's Touch, Made With Care
                </p>

                {/* Qualities */}
                <ul className="space-y-3 mb-8">
                  {[
                    { icon: '🌿', label: 'Natural Ingredients', desc: 'Cold-pressed Moringa oil rich in antioxidants' },
                    { icon: '✋', label: '100% Handmade', desc: 'Crafted in small batches for premium quality' },
                    { icon: '💧', label: 'Deep Nourishing', desc: 'Restores moisture barrier, soothes dry skin' },
                    { icon: '🌍', label: 'Eco Friendly', desc: 'Minimal packaging, zero harsh chemicals' },
                  ].map((q) => (
                    <li key={q.label} className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{q.icon}</span>
                      <div>
                        <p className="text-white text-sm font-semibold">{q.label}</p>
                        <p className="text-[#7a9e7a] text-xs">{q.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/shop')}
                  className="self-start bg-[#c8f135] hover:bg-[#b0d820] text-[#1a2e1a] text-sm font-bold uppercase tracking-wider px-7 py-3 rounded-full transition-colors"
                >
                  Shop Moringa Soap
                </button>
              </div>

              {/* Right: Video */}
              <div className="relative flex items-center justify-center bg-[#121f12] md:rounded-r-3xl overflow-hidden">
                <video
                  src="/moringa.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ minHeight: '380px', maxHeight: '520px' }}
                />
              </div>

            </div>
          </section>

          {/* ── SECTION 3: SHOP BESTSELLERS ── */}
          <section className="px-4 py-10 md:px-6">
            <h2 className="text-center text-2xl font-semibold text-[#2b2b2b] mb-8">
              Shop Our Bestsellers
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-3xl h-96 bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-3xl p-6 flex flex-col cursor-pointer group"
                    style={{
                      backgroundColor: product.bgColor,
                      boxShadow: `5px 5px 0px ${product.shadowColor}`,
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Quick Add Button */}
                    <button
                      className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          currency: product.currency,
                          location: product.currency === 'PKR' ? 'Pakistan' : 'UAE',
                          delivery_charge: product.currency === 'PKR' ? 200 : 15,
                        })
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    {/* Product Image */}
                    <div className="flex-1 flex items-center justify-center py-6 min-h-[220px]">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-56 max-w-full object-contain drop-shadow-md"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-white/30 rounded-2xl flex items-center justify-center">
                          <span className="text-4xl">🌿</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="mt-4">
                      <h3 className="font-semibold text-[#2b2b2b] text-base">{product.name}</h3>
                      <p className="text-[#2b2b2b]/70 text-sm italic">{product.subtitle}</p>
                      <p className="text-[#2b2b2b] font-medium text-sm mt-1">{formatPrice(product)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Placeholder cards when no products yet */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {colorSchemes.map((colors, i) => (
                  <div
                    key={i}
                    className="relative rounded-3xl p-6 flex flex-col min-h-[380px]"
                    style={{
                      backgroundColor: colors.bg,
                      boxShadow: `5px 5px 0px ${colors.shadow}`,
                    }}
                  >
                    <button className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-28 h-28 bg-white/30 rounded-2xl" />
                    </div>
                    <div className="mt-4">
                      <div className="h-4 bg-white/40 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/30 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── SECTION 7: WE ARE ── */}
          <section className="mx-4 my-8">
            <div
              className="relative rounded-[80px] overflow-hidden py-20 px-8"
              style={{ backgroundColor: '#FFD6A5', fontFamily: "'Poppins', sans-serif" }}
            >
              {/* Decorative Clouds */}
              <div className="absolute top-8 left-[10%] text-[#2b2b2b]/10 text-4xl">☁️</div>
              <div className="absolute top-12 right-[15%] text-[#2b2b2b]/10 text-3xl">☁️</div>
              <div className="absolute bottom-16 left-[20%] text-[#2b2b2b]/10 text-2xl">☁️</div>
              <div className="absolute bottom-20 right-[25%] text-[#2b2b2b]/10 text-3xl">☁️</div>
              <div className="absolute top-1/2 left-[5%] text-[#2b2b2b]/10 text-2xl">☁️</div>

              {/* Decorative Illustrations */}
              {/* Flying Bird Left */}
              <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 opacity-90">
                <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                  <path d="M70 20C65 15 55 18 50 25C45 18 35 15 30 20C25 25 30 35 40 38C35 40 20 42 10 38C15 45 30 48 45 45C50 55 60 52 65 45C70 50 80 48 85 42C90 38 88 30 80 28C85 22 78 18 70 20Z" fill="#2b2b2b"/>
                  <circle cx="55" cy="26" r="2" fill="#FFD6A5"/>
                  <path d="M75 22L85 18M75 24L85 26" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Running Cat Right */}
              <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 w-28 h-28 md:w-40 md:h-40 opacity-90">
                <svg viewBox="0 0 100 70" fill="none" className="w-full h-full">
                  <ellipse cx="45" cy="40" rx="25" ry="18" fill="#2b2b2b"/>
                  <circle cx="70" cy="32" r="12" fill="#2b2b2b"/>
                  <circle cx="72" cy="30" r="2" fill="#FFD6A5"/>
                  <path d="M60 25L55 15M65 22L62 12M75 24L78 14M82 28L90 20" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M30 50L20 58M35 52L28 62M55 52L62 60M60 50L68 58" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M78 38C82 40 85 38 88 35" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M25 35C20 32 15 35 12 40" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Center Content */}
              <div className="relative z-10 text-center max-w-md mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-[#2b2b2b] mb-4">We Are</h2>
                <p className="text-[#5a4a3a] text-base md:text-lg leading-relaxed mb-8">
                  Vegan personal care for every body. Always ethical, low-waste, handmade & cruelty-free.
                </p>
                <button
                  onClick={() => navigate('/about')}
                  className="bg-[#FF9A7A] hover:bg-[#ff8560] text-[#2b2b2b] text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-full transition-colors shadow-sm"
                >
                  About Us
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#eeecfe] px-6 py-10 mt-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <h3 className="font-bold text-[#2b2b2b] text-base mb-2">CareCraftz</h3>
                <p className="text-[#696a67] text-sm">Premium handmade and Korean-inspired skincare, crafted with care in Dubai.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2b2b2b] text-sm mb-3">Shop</h4>
                <ul className="space-y-2 text-sm text-[#696a67]">
                  <li><a href="/shop" className="hover:text-[#2b2b2b]">All Products</a></li>
                  <li><a href="/shop" className="hover:text-[#2b2b2b]">Bestsellers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#2b2b2b] text-sm mb-3">Help</h4>
                <ul className="space-y-2 text-sm text-[#696a67]">
                  <li><a href="/faq" className="hover:text-[#2b2b2b]">FAQ</a></li>
                  <li><a href="/privacy" className="hover:text-[#2b2b2b]">Privacy</a></li>
                  <li><a href="/terms" className="hover:text-[#2b2b2b]">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#2b2b2b]/10 text-center text-xs text-[#696a67]">
              © 2025 CareCraftz. All rights reserved.
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
