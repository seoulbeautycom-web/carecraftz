import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, Pause, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import PageFrame from '../components/PageFrame'

interface Product {
  id: string
  name: string
  subtitle?: string | null
  price: number
  price_pkr?: number | null
  price_aed?: number | null
  compare_at_price: number | null
  images: string[]
  tag1: string | null
  tag2: string | null
  category: string | null
  is_active: boolean
  location?: string
  delivery_charge?: number
  currency?: string
}

const HERO_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_112022_cddf2487-4ffe-45b6-ba4c-99ab79003cc5.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_175400_b46d1cd2-2050-45e2-9d13-b9c0bacb16b3.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_182440_671605c8-2ed8-4507-a4cb-a62a8f61316f.mp4',
]

const HERO_BG_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_101925_8e509c31-4e75-4ae1-b164-2605265b2d47.png&w=1280&q=85'

const CATEGORIES = [
  { name: 'face',         video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_203023_87a26602-2898-4acc-a396-c7a2b5ad84fd.mp4' },
  { name: 'beauty tools', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_203415_b86e3f19-2aec-46cd-9a86-b64c40118e38.mp4' },
  { name: 'body',         video: '/moringarotate.mp4' },
]

const PASTEL_COLORS = [
  'bg-[#fce4ec]', // pink
  'bg-[#e8f5e9]', // green
  'bg-[#fff9c4]', // yellow
  'bg-[#ede7f6]', // lavender
  'bg-[#e3f2fd]', // blue
  'bg-[#fff3e0]', // peach
  'bg-[#f3e5f5]', // purple
  'bg-[#e0f7fa]', // teal
]

const BOTTOM_COLORS = [
  'bg-[#f8bbd0]',
  'bg-[#c8e6c9]',
  'bg-[#fff59d]',
  'bg-[#d1c4e9]',
  'bg-[#bbdefb]',
  'bg-[#ffe0b2]',
  'bg-[#e1bee7]',
  'bg-[#b2ebf2]',
]

function ShopInner() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [categories, setCategories] = useState<string[]>([])  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => setCurrentSlide(p => (p + 1) % HERO_VIDEOS.length), 5000)
    return () => clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => setScrollProgress(el.scrollLeft / (el.scrollWidth - el.clientWidth))
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        if (error) { console.error(error); return }
        const prods = data || []
        setProducts(prods)
        const cats = Array.from(new Set(prods.map((p: Product) => p.category).filter(Boolean))) as string[]
        setCategories(cats)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filters = ['All', ...categories]

  const filtered = activeFilter === 'All'
    ? products
    : products.filter(p => p.category === activeFilter)

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    const loc = (product.location as 'Pakistan' | 'UAE') || 'UAE'
    const currency = loc === 'Pakistan' ? 'PKR' : 'AED'
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      location: loc,
      delivery_charge: product.delivery_charge || 0,
      currency,
    })
    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 1500)
  }

  return (
    <div className="min-h-screen bg-white font-['Poppins']">

      {/* Filter Tabs */}
      <div className="pt-24 pb-4 flex justify-center">
        <div className="flex items-center gap-2 flex-wrap justify-center px-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeFilter === f
                  ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                  : 'bg-white text-[#2b2b2b] border-gray-200 hover:border-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${PASTEL_COLORS[i % PASTEL_COLORS.length]} aspect-[3/4] animate-pulse`} />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-4 py-24 text-center text-gray-400 text-sm">No products found</div>
        ) : (
          filtered.map((product, index) => {
            const pastel = PASTEL_COLORS[index % PASTEL_COLORS.length]
            const bottom = BOTTOM_COLORS[index % BOTTOM_COLORS.length]
            const added = addedToCart === product.id
            return (
              <div key={product.id} className="group relative flex flex-col cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                {/* Image area with pastel bg */}
                <div className={`${pastel} relative flex items-end justify-center pt-8 px-6 overflow-hidden`} style={{ minHeight: '340px' }}>
                  {/* + button top-left */}
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                      added ? 'bg-green-500 text-white' : 'bg-white/80 hover:bg-white text-[#2b2b2b]'
                    }`}
                  >
                    {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>

                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-auto max-w-[75%] object-contain transition-transform duration-500 group-hover:scale-105"
                      style={{ maxHeight: '280px' }}
                    />
                  ) : (
                    <div className="w-32 h-48 flex items-center justify-center text-gray-300 text-4xl">📦</div>
                  )}
                </div>

                {/* Info area with slightly darker pastel bottom */}
                <div className={`${bottom} px-4 py-4 flex flex-col`}>
                  <p className="font-semibold text-[#2b2b2b] text-sm leading-tight">{product.name}</p>
                  {product.subtitle && (
                    <p className="text-xs text-[#696a67] italic mt-0.5">{product.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-[#2b2b2b]">
                      {product.compare_at_price ? 'From ' : ''}
                      AED {product.price_aed ? product.price_aed.toFixed(2) : product.price.toFixed(2)}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">AED {product.compare_at_price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      {/* ── HERO SPLIT ───────────────────────────── */}
      <section className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 min-h-[60vh] relative">
          <img src={HERO_BG_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 p-8 lg:p-14 flex flex-col justify-end h-full min-h-[60vh]">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-4 text-white">
              ethical beauty,<br />sustainable impact.
            </h2>
            <p className="text-sm text-white/80 mb-8 max-w-sm">Committed to sustainable beauty and minimise our impact on the planet.</p>
            <button onClick={() => navigate('/craft')} className="self-start px-8 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors">
              about us
            </button>
          </div>
        </div>
        <div className="w-full lg:w-1/2 min-h-[40vh] lg:min-h-[60vh] relative bg-black">
          {HERO_VIDEOS.map((video, i) => (
            <video key={video} autoPlay loop muted playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <source src={video} type="video/mp4" />
            </video>
          ))}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
            {HERO_VIDEOS.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
            <button onClick={() => setIsPaused(p => !p)}
              className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white">
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS CAROUSEL ─────────────────── */}
      <section className="bg-[#F9F4F0] py-12 px-4 sm:px-8 lg:px-12">
        <h2 className="text-4xl md:text-5xl font-medium text-[#1a1a1a] mb-8">best sellers</h2>
        <div ref={carouselRef} className="flex overflow-x-auto gap-0 pb-4" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
          {loading ? (
            <div className="flex-shrink-0 w-full py-12 text-center text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="flex-shrink-0 w-full py-12 text-center text-gray-500">No products yet</div>
          ) : (
            products.map((product) => (
              <div key={product.id}
                className="flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[300px] border border-gray-200 -ml-[1px] first:ml-0 flex flex-col cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="px-4 h-10 flex items-center">
                  <span className="text-xs font-medium tracking-wider uppercase text-gray-500">{product.tag1 || ''}</span>
                </div>
                <div className="mx-4 aspect-[3/4] rounded-lg overflow-hidden bg-[#F0EBE5]">
                  <img src={product.images?.[0] || ''} alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm mb-1">{product.name}</p>
                  {product.subtitle && <p className="text-xs text-gray-500 italic mb-1">{product.subtitle}</p>}
                  <span className="text-sm font-medium">AED {(product.price_aed ?? product.price).toFixed(2)}</span>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={e => handleAddToCart(e, product)}
                    className={`w-full py-2 rounded-full text-sm font-medium transition-colors ${
                      addedToCart === product.id ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
                    }`}>
                    {addedToCart === product.id ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-8 mx-auto max-w-[240px]">
          <div className="h-[2px] bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300" style={{width: '30%', transform: `translateX(${scrollProgress * 233}%)`}} />
          </div>
        </div>
      </section>

      {/* ── VIDEO CATEGORIES ──────────────────────── */}
      <section className="bg-black">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className="relative min-h-[400px] md:min-h-[600px] overflow-hidden group">
              <video autoPlay loop muted playsInline
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <source src={cat.video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500" />
              <div className="relative z-10 h-full min-h-[400px] md:min-h-[600px] p-8 flex flex-col justify-between">
                <div className="text-5xl md:text-6xl lg:text-7xl font-medium text-white"
                  style={{writingMode:'vertical-lr', transform:'rotate(180deg)'}}>
                  {cat.name}
                </div>
                <button onClick={() => { setActiveFilter(cat.name); window.scrollTo({top:0,behavior:'smooth'}) }}
                  className="self-start px-7 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors">
                  shop {cat.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default function Shop() {
  return (
    <PageFrame frameColor="#FF8C69" showFooter={true} scrollDriven={true}>
      <ShopInner />
    </PageFrame>
  )
}
