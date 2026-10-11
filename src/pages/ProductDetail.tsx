import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, Star, Check, Quote, ArrowRight, Minus, Plus } from 'lucide-react'
import PageFrame from '../components/PageFrame'
import VerifiedSellerBadge, { isVerifiedSeller, type SellerTrustInfo } from '../components/VerifiedSellerBadge'

interface Product {
  id: string
  name: string
  subtitle: string | null
  description: string | null
  how_to_use: string | null
  ingredients: string | null
  brand_name: string | null
  brand_logo: string | null
  seller_name: string | null
  partner_store_id: string | null
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

function ProductDetailInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart, items, setIsCartOpen } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('What It Is')
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscribe'>('one-time')
  const [sections, setSections] = useState<ProductSection[]>([])
  const [blogAssignment, setBlogAssignment] = useState<BlogAssignment | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [sellerStore, setSellerStore] = useState<SellerTrustInfo | null>(null)

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

        if (productRes.data?.partner_store_id) {
          const { data: storeData } = await supabase
            .from('partner_stores')
            .select('id, display_name, tenant_type, status, approval_status, verified_at, public_certifications')
            .eq('id', productRes.data.partner_store_id)
            .maybeSingle()
          setSellerStore((storeData as SellerTrustInfo | null) ?? null)
        } else {
          setSellerStore(null)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  useEffect(() => {
    setQuantity(1)
    setSelectedImage(0)
    setAddedToCart(false)
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
      currency: currency,
      quantity,
    })
    setAddedToCart(true)
    setIsCartOpen(true)
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

  const inCartQty = product ? (items.find((i) => i.id === product.id)?.quantity ?? 0) : 0
  const maxQty = product ? Math.max(1, product.inventory || 1) : 1

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
    <>
        <div className="pt-20">

          {/* Main product — compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 px-4 sm:px-5 lg:px-6 pb-5 max-w-6xl mx-auto">

            {/* Image gallery */}
            <div className="flex gap-2">
              {product.images && product.images.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-[#2b2b2b]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 rounded-2xl overflow-hidden bg-[#f0ece0] aspect-square max-h-[420px] flex items-center justify-center">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="flex flex-col gap-2.5">

              <div>
                <h1
                  className="text-[#2b2b2b] leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)' }}
                >
                  {product.name}
                </h1>
                {product.subtitle && (
                  <p className="text-[#696a67] text-sm italic mt-0.5">{product.subtitle}</p>
                )}
              </div>

              {(product.brand_name || product.seller_name || product.brand_logo || sellerStore) && (
                <div className="rounded-xl border border-[#2b2b2b]/08 bg-white px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 overflow-hidden rounded-lg bg-[#f0ece0] flex items-center justify-center shrink-0">
                      {product.brand_logo ? (
                        <img src={product.brand_logo} alt={product.brand_name || product.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-[#2b2b2b]">
                          {(product.brand_name || sellerStore?.display_name || product.name).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-[#696a67]">Brand & seller</p>
                      <p className="text-xs font-semibold text-[#2b2b2b] truncate">
                        {product.brand_name || sellerStore?.display_name || 'Brand not set'}
                      </p>
                      <p className="text-[11px] text-[#696a67] truncate">
                        Sold by {product.seller_name || sellerStore?.display_name || 'CareCraftz'}
                      </p>
                    </div>
                    <VerifiedSellerBadge store={sellerStore} />
                  </div>
                  {isVerifiedSeller(sellerStore) && (
                    <div className="rounded-lg bg-[#fbfcf4] border border-[#2b2b2b]/08 px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-[#2b2b2b]">
                        {sellerStore?.display_name}
                        {sellerStore?.verified_at
                          ? ` · Verified ${new Date(sellerStore.verified_at).toLocaleDateString()}`
                          : ' · Verified seller'}
                      </p>
                      {sellerStore?.public_certifications && sellerStore.public_certifications.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {sellerStore.public_certifications.slice(0, 4).map((cert) => (
                            <span key={cert} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-[#2b2b2b]">
                              {cert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-semibold text-[#2b2b2b]">{formatPrice(product)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-sm text-[#696a67] line-through">
                    AED {product.compare_at_price.toFixed(2)}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-3.5 h-3.5 fill-[#E8B800] text-[#E8B800]" />
                    ))}
                  </div>
                  <span className="text-[#696a67] text-[11px]">
                    {reviews.length > 0 ? `${reviews.length} reviews` : 'reviews'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex gap-1 bg-[#f0ece0] rounded-full p-0.5 mb-2">
                  {TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                        activeTab === tab
                          ? 'bg-[#eeecfe] text-[#2b2b2b] shadow-sm'
                          : 'text-[#696a67] hover:text-[#2b2b2b]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-[#696a67] leading-snug min-h-[56px] line-clamp-4">
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

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full border border-[#2b2b2b]/12 bg-white shrink-0">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5 text-[#2b2b2b]" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-[#2b2b2b] tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2b2b2b]" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory <= 0 || addedToCart}
                  className={`flex-1 py-3 rounded-full font-semibold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    addedToCart
                      ? 'bg-[#1db954] text-white'
                      : product.inventory <= 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#eeecfe] text-[#2b2b2b] hover:bg-[#dddaf8]'
                  }`}
                >
                  {addedToCart ? (
                    <><Check className="w-4 h-4" /> Added ×{quantity}</>
                  ) : product.inventory <= 0 ? (
                    'Out of Stock'
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Add {quantity > 1 ? `${quantity} ` : ''}to cart</>
                  )}
                </button>
              </div>

              {inCartQty > 0 && (
                <p className="text-[11px] text-[#3d6b4a] font-medium">
                  {inCartQty} in your cart
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="ml-2 underline underline-offset-2 hover:opacity-70"
                  >
                    View cart
                  </button>
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <label
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ${
                    purchaseType === 'one-time' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-[#2b2b2b]/10 bg-white'
                  }`}
                  onClick={() => setPurchaseType('one-time')}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    purchaseType === 'one-time' ? 'border-[#E8B800] bg-[#E8B800]' : 'border-gray-300'
                  }`}>
                    {purchaseType === 'one-time' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-[11px] font-medium text-[#2b2b2b]">
                    One-time {formatPrice(product)}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ${
                    purchaseType === 'subscribe' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-[#2b2b2b]/10 bg-white'
                  }`}
                  onClick={() => setPurchaseType('subscribe')}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    purchaseType === 'subscribe' ? 'border-[#E8B800] bg-[#E8B800]' : 'border-gray-300'
                  }`}>
                    {purchaseType === 'subscribe' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-[11px] font-medium text-[#2b2b2b]">
                    Subscribe −10% {subscribePrice(product)}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#696a67]">
                {product.inventory > 0
                  ? <span className="text-[#1db954] font-medium">In stock ({product.inventory})</span>
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
                <div key={section.id} className="px-4 sm:px-5 lg:px-6 py-3 max-w-6xl mx-auto">
                  <div className="bg-[#eeecfe] rounded-2xl px-5 py-5 text-center">
                    <h2
                      className="text-[#2b2b2b] leading-tight mb-1.5"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)' }}
                    >
                      {section.manifesto_title || 'Multipurpose Manifesto'}
                    </h2>
                    <p className="text-[#696a67] text-sm leading-snug max-w-xl mx-auto">
                      {section.manifesto_body || ''}
                    </p>
                  </div>
                </div>
              )
            }

            if (section.section_type === 'breakdown') {
              return (
                <div key={section.id} className="px-4 sm:px-5 lg:px-6 py-3 max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 rounded-2xl overflow-hidden">
                    <div className="bg-[#f0ece0] rounded-xl overflow-hidden aspect-[16/10] flex items-center justify-center">
                      {section.breakdown_left_image ? (
                        <img src={section.breakdown_left_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-white/50 rounded-lg" />
                      )}
                    </div>
                    <div className="bg-[#eeecfe] rounded-xl px-4 py-4 flex flex-col justify-center">
                      <h3
                        className="text-[#2b2b2b] leading-tight mb-1.5"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)' }}
                      >
                        {section.breakdown_title || 'The Breakdown'}
                      </h3>
                      <p className="text-[#696a67] text-xs leading-snug whitespace-pre-line">
                        {section.breakdown_body || ''}
                      </p>
                      {section.breakdown_image && (
                        <img src={section.breakdown_image} alt="Detail" className="mt-3 rounded-lg w-full object-cover max-h-28" />
                      )}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}

          {(() => {
            const bp = blogAssignment?.blog_posts
            const post: BlogPost | null = Array.isArray(bp) ? (bp[0] ?? null) : (bp ?? null)
            if (!post) return null
            return (
              <div className="px-4 sm:px-5 lg:px-6 py-3 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 rounded-2xl overflow-hidden">
                  <div className="bg-[#eeecfe] rounded-xl px-4 py-4 flex flex-col justify-center">
                    <h3
                      className="text-[#2b2b2b] leading-tight mb-1.5"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)' }}
                    >
                      {post.title}
                    </h3>
                    {post.excerpt && <p className="text-[#696a67] text-xs leading-snug mb-3 line-clamp-3">{post.excerpt}</p>}
                    <button
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="inline-flex items-center gap-1.5 self-start text-[10px] uppercase tracking-widest font-bold text-[#2b2b2b] hover:opacity-70"
                    >
                      Read the blog <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="bg-[#f0ece0] rounded-xl overflow-hidden aspect-[16/10] flex items-center justify-center">
                    {post.featured_image ? (
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-white/50 rounded-lg" />
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="px-4 sm:px-5 lg:px-6 py-5 max-w-6xl mx-auto pb-8">
            <div className="flex items-end justify-between gap-2 mb-3">
              <h2
                className="text-[#2b2b2b] leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)' }}
              >
                Customer reviews
              </h2>
              {reviews.length > 0 && (
                <span className="text-xs text-[#696a67]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-xl bg-[#f5f0e8] border border-[#2b2b2b]/08 px-4 py-6 text-center">
                <p className="text-[#696a67] text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl px-3.5 py-3 border border-[#2b2b2b]/08 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#2b2b2b] text-xs">{review.customer_name}</p>
                        {review.is_verified_purchase && (
                          <span className="text-[10px] text-[#1db954] font-medium">Verified purchase</span>
                        )}
                      </div>
                      <Quote className="w-4 h-4 text-[#eeecfe] flex-shrink-0" />
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#E8B800] text-[#E8B800]' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-[#696a67] text-xs leading-snug flex-1 line-clamp-4">{review.review_text}</p>
                    {review.image_url && (
                      <img src={review.image_url} alt="Review" className="rounded-lg w-full object-cover max-h-28" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
    </>
  )
}

export default function ProductDetail() {
  return (
    <PageFrame frameColor="#FFAFC5">
      <ProductDetailInner />
    </PageFrame>
  )
}
