import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import NewHeader from '../components/NewHeader'

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

export default function Shop() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [categories, setCategories] = useState<string[]>([])

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
      <NewHeader />

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
    </div>
  )
}
