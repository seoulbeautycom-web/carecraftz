import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, Star, ChevronLeft, Check, Quote, ArrowRight } from 'lucide-react'
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

interface ProductSection {
  id: string
  section_type: 'manifesto' | 'breakdown'
  sort_order: number
  manifesto_title: string | null
  manifesto_body: string | null
  breakdown_title: string | null
  breakdown_body: string | null
  breakdown_image: string | null
  breakdown_left_image: string | null
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
}

interface BlogAssignment {
  blog_posts: BlogPost | BlogPost[] | null
}

interface Review {
  id: string
  customer_name: string
  rating: number
  review_text: string
  image_url: string | null
  created_at: string
  is_verified_purchase: boolean
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
  const [sections, setSections] = useState<ProductSection[]>([])
  const [blogAssignment, setBlogAssignment] = useState<BlogAssignment | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    async function fetchAll() {
      if (!id) return
      try {
        const [productRes, sectionsRes, blogRes, reviewsRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
          supabase.from('product_sections').select('*').eq('product_id', id).order('sort_order'),
          supabase.from('product_blog_assignments').select('blog_posts(id,title,slug,excerpt,featured_image)').eq('product_id', id).maybeSingle(),
          supabase.from('reviews').select('*').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false })
        ])
        if (productRes.error) { console.error('Product error:', productRes.error); return }
        setProduct(productRes.data)
        setSections(sectionsRes.data || [])
        if (blogRes.data) setBlogAssignment(blogRes.data as BlogAssignment)
        setReviews(reviewsRes.data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
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

          {/* ══════════════════════════════════════════
              PRODUCT SECTIONS (Manifesto + Breakdown)
          ══════════════════════════════════════════ */}
          {sections.length > 0 && sections.map((section) => {
            if (section.section_type === 'manifesto') {
              return (
                <div key={section.id} className="mx-6 my-6">
                  <div className="bg-[#eeecfe] rounded-[2rem] px-8 py-10 text-center max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#2b2b2b] mb-3">
                      {section.manifesto_title || 'Multipurpose Manifesto'}
                    </h2>
                    <p className="text-[#696a67] text-sm md:text-base max-w-xl mx-auto">
                      {section.manifesto_body || ''}
                    </p>
                  </div>
                </div>
              )
            }

            if (section.section_type === 'breakdown') {
              return (
                <div key={section.id} className="mx-6 my-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-6xl mx-auto rounded-[2rem] overflow-hidden" style={{ minHeight: '360px' }}>
                    {/* Left: lifestyle image */}
                    <div className="bg-[#f0ece0] flex items-center justify-center overflow-hidden">
                      {section.breakdown_left_image ? (
                        <img src={section.breakdown_left_image} alt="" className="w-full h-full object-cover" style={{ minHeight: '360px' }} />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-[#696a67] p-12">
                          <span className="text-6xl">🌿</span>
                          <span className="text-sm">Product image</span>
                        </div>
                      )}
                    </div>
                    {/* Right: breakdown text on lavender blob */}
                    <div className="bg-[#fbfcf4] flex items-end justify-end p-6 relative">
                      <div className="bg-[#eeecfe] rounded-tl-[3rem] rounded-bl-[3rem] rounded-br-[3rem] p-8 md:p-10 w-full md:w-[85%] self-end">
                        <h3 className="text-xl md:text-2xl font-bold text-[#2b2b2b] mb-3">
                          {section.breakdown_title || 'The Breakdown'}
                        </h3>
                        <p className="text-[#696a67] text-sm leading-relaxed whitespace-pre-line">
                          {section.breakdown_body || ''}
                        </p>
                        {section.breakdown_image && (
                          <img src={section.breakdown_image} alt="Detail" className="mt-4 rounded-2xl w-full object-cover max-h-40" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}

          {/* Placeholder if no sections yet */}
          {sections.length === 0 && (
            <div className="mx-6 my-6 space-y-6 max-w-6xl mx-auto">
              {/* Manifesto placeholder */}
              <div className="bg-[#eeecfe] rounded-[2rem] px-8 py-10 text-center opacity-40 border-2 border-dashed border-[#bbb8f0]">
                <p className="text-sm text-[#696a67] font-medium">✏️ Manifesto section — add in admin</p>
              </div>
              {/* Breakdown placeholder */}
              <div className="grid grid-cols-2 gap-0 rounded-[2rem] overflow-hidden border-2 border-dashed border-[#d4d4d4] opacity-40" style={{ minHeight: '300px' }}>
                <div className="bg-[#f0ece0] flex items-center justify-center">
                  <p className="text-sm text-[#696a67]">📸 Left image</p>
                </div>
                <div className="bg-[#fbfcf4] flex items-end p-6">
                  <div className="bg-[#eeecfe] rounded-tl-[3rem] rounded-bl-[3rem] rounded-br-[3rem] p-8 w-full">
                    <p className="text-sm text-[#696a67]">📝 Breakdown text — add in admin</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              BLOG SECTION — assigned blog post
          ══════════════════════════════════════════ */}
          {(() => {
            const bp = blogAssignment?.blog_posts
            const post: BlogPost | null = Array.isArray(bp) ? (bp[0] ?? null) : (bp ?? null)
            if (!post) return (
              <div className="mx-6 my-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden border-2 border-dashed border-[#d4d4d4] opacity-40" style={{ minHeight: '320px' }}>
                  <div className="bg-[#eeecfe] flex items-center justify-center p-10 rounded-bl-[2rem]">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#2b2b2b] mb-2">Blog title here</p>
                      <p className="text-sm text-[#696a67] mb-4">Assign a blog post in admin</p>
                      <span className="text-xs uppercase tracking-widest font-bold text-[#2b2b2b]">READ THE BLOG →</span>
                    </div>
                  </div>
                  <div className="bg-[#f0ece0] flex items-center justify-center">
                    <span className="text-6xl">📖</span>
                  </div>
                </div>
              </div>
            )
            return (
              <div className="mx-6 my-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden" style={{ minHeight: '320px' }}>
                  {/* Left lavender blob */}
                  <div className="bg-[#eeecfe] flex items-center p-10 md:p-12">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#2b2b2b] mb-3 leading-tight">{post.title}</h3>
                      {post.excerpt && <p className="text-[#696a67] text-sm mb-6 leading-relaxed">{post.excerpt}</p>}
                      <button
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#2b2b2b] hover:gap-4 transition-all"
                      >
                        READ THE BLOG <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Right: featured image */}
                  <div className="bg-[#f0ece0] overflow-hidden flex items-center justify-center">
                    {post.featured_image ? (
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" style={{ minHeight: '320px' }} />
                    ) : (
                      <span className="text-6xl">📖</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ══════════════════════════════════════════
              REVIEWS SECTION
          ══════════════════════════════════════════ */}
          <div className="mx-6 my-8 max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2b2b2b]">Customer Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-[#E8B800] text-[#E8B800]" />)}
                  </div>
                  <span className="text-sm text-[#696a67]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-[#f5f0e8] rounded-[2rem] p-12 text-center border-2 border-dashed border-[#d4d4d4]">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-[#696a67] font-medium">No reviews yet — they'll appear here once approved in admin</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#2b2b2b] text-sm">{review.customer_name}</p>
                        {review.is_verified_purchase && (
                          <span className="text-[10px] text-[#1db954] font-medium">✓ Verified Purchase</span>
                        )}
                      </div>
                      <Quote className="w-5 h-5 text-[#eeecfe] flex-shrink-0" />
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-[#E8B800] text-[#E8B800]' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-[#696a67] text-sm leading-relaxed flex-1">{review.review_text}</p>
                    {review.image_url && (
                      <img src={review.image_url} alt="Review" className="rounded-xl w-full object-cover max-h-40" />
                    )}
                    <p className="text-[10px] text-[#696a67]">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}
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
