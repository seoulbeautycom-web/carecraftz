import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, Star, ChevronLeft, Check } from 'lucide-react'
import NewHeader from '../components/NewHeader'

interface Product {
  id: string
  name: string
  subtitle: string | null
  description: string | null
  how_to_use: string | null
  ingredients: string | null
  price: number
  price_pkr: number | null
  price_aed: number | null
  compare_at_price: number | null
  inventory: number
  category: string | null
  location: string
  delivery_charge: number
  images: string[]
  tag1: string | null
  tag2: string | null
  weight: number | null
  sku: string | null
  currency: string | null
}

const TABS = ['What It Is', 'How To Use', 'Ingredients'] as const
type Tab = typeof TABS[number]

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart, items } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('What It Is')
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscribe'>('one-time')

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single()
        if (error) { console.error('Error fetching product:', error); return }
        setProduct(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    const location = product.location as 'Pakistan' | 'UAE'
    const currency = location === 'Pakistan' ? 'PKR' : 'AED'
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      location: location || 'UAE',
      delivery_charge: product.delivery_charge || 0,
      currency: currency
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const formatPrice = (p: Product) => {
    if (p.price_aed) return `AED ${p.price_aed.toFixed(2)}`
    if (p.price_pkr) return `₨${p.price_pkr.toLocaleString()}`
    return `${p.price}`
  }

  const subscribePrice = (p: Product) => {
    if (p.price_aed) return `AED ${(p.price_aed * 0.9).toFixed(2)}`
    if (p.price_pkr) return `₨${Math.round(p.price_pkr * 0.9).toLocaleString()}`
    return `${(p.price * 0.9).toFixed(2)}`
  }

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-[#2b2b2b] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="text-center">
          <p className="text-[#696a67] mb-4">Product not found</p>
          <button onClick={() => navigate('/shop')} className="bg-[#2b2b2b] text-white px-6 py-2.5 rounded-full text-sm">Back to Shop</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#E8A4E0] p-3 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden">

        {/* Sticky Header */}
        <NewHeader />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-16">

          {/* Back Nav */}
          <div className="px-6 pt-6 pb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-[#696a67] text-sm hover:text-[#2b2b2b] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 pb-12 max-w-6xl mx-auto">

            {/* ── LEFT: Image Gallery ── */}
            <div className="flex gap-3">
              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex flex-col gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-[#2b2b2b]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1 rounded-3xl overflow-hidden bg-[#f0ece0] aspect-square flex items-center justify-center">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/50 rounded-2xl flex items-center justify-center">
                    <span className="text-5xl">🌿</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div className="flex flex-col gap-5 pt-2">

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-[#2b2b2b]">{product.name}</h1>
                {product.subtitle && (
                  <p className="text-[#696a67] italic mt-1">{product.subtitle}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[#2b2b2b]">{formatPrice(product)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-base text-[#696a67] line-through">
                    AED {product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Star Rating placeholder */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-[#E8B800] text-[#E8B800]" />
                  ))}
                </div>
                <span className="text-[#696a67] text-sm">(reviews)</span>
              </div>

              {/* Short description */}
              {product.description && (
                <p className="text-[#696a67] text-sm leading-relaxed">{product.description}</p>
              )}

              {/* Tabs: What It Is / How To Use / Ingredients */}
              <div>
                <div className="flex gap-1 bg-[#f0ece0] rounded-full p-1 mb-4">
                  {TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                        activeTab === tab
                          ? 'bg-[#eeecfe] text-[#2b2b2b] shadow-sm'
                          : 'text-[#696a67] hover:text-[#2b2b2b]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="text-sm text-[#696a67] leading-relaxed min-h-[80px]">
                  {activeTab === 'What It Is' && (
                    <p>{product.description || 'Product description coming soon.'}</p>
                  )}
                  {activeTab === 'How To Use' && (
                    <p className="whitespace-pre-line">{product.how_to_use || 'Usage instructions coming soon.'}</p>
                  )}
                  {activeTab === 'Ingredients' && (
                    <p className="whitespace-pre-line">{product.ingredients || 'Full ingredients list coming soon.'}</p>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.inventory <= 0 || addedToCart}
                className={`w-full py-4 rounded-full font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-[#1db954] text-white'
                    : product.inventory <= 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#eeecfe] text-[#2b2b2b] hover:bg-[#dddaf8]'
                }`}
              >
                {addedToCart ? (
                  <><Check className="w-4 h-4" /> Added to Cart</>
                ) : product.inventory <= 0 ? (
                  'Out of Stock'
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                )}
              </button>

              {/* Purchase Type Toggle */}
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    purchaseType === 'one-time' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-gray-200 bg-white'
                  }`}
                  onClick={() => setPurchaseType('one-time')}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    purchaseType === 'one-time' ? 'border-[#E8B800] bg-[#E8B800]' : 'border-gray-300'
                  }`}>
                    {purchaseType === 'one-time' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-medium text-[#2b2b2b]">
                    One-time purchase {formatPrice(product)}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    purchaseType === 'subscribe' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-gray-200 bg-white'
                  }`}
                  onClick={() => setPurchaseType('subscribe')}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    purchaseType === 'subscribe' ? 'border-[#E8B800] bg-[#E8B800]' : 'border-gray-300'
                  }`}>
                    {purchaseType === 'subscribe' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-medium text-[#2b2b2b]">
                    Subscribe &amp; save 10% — {subscribePrice(product)}
                  </span>
                </label>
              </div>

              {/* Stock / SKU */}
              <div className="flex items-center gap-4 text-xs text-[#696a67]">
                {product.inventory > 0
                  ? <span className="text-[#1db954] font-medium">✓ In stock ({product.inventory} left)</span>
                  : <span className="text-red-400 font-medium">Out of stock</span>
                }
                {product.sku && <span>SKU: {product.sku}</span>}
              </div>

            </div>
          </div>
        </div>

        {/* Floating Cart Indicator */}
        {cartCount > 0 && (
          <button
            onClick={() => navigate('/cart')}
            className="fixed bottom-8 right-8 bg-[#2b2b2b] text-white rounded-full px-5 py-3 flex items-center gap-2 shadow-lg hover:bg-black transition-colors z-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm font-semibold">{cartCount} in cart</span>
          </button>
        )}

      </div>
    </div>
  )
}
