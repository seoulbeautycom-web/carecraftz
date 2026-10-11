import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AnnouncementBar from './AnnouncementBar'
import PageFrame from './PageFrame'
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

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  author_name: string
  published_at: string
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
  const [featuredBestseller, setFeaturedBestseller] = useState<Product | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
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

  const fetchFeaturedBestseller = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .limit(1)
      .single()
    if (data) {
      const colors = colorSchemes[0]
      setFeaturedBestseller({
        id: data.id,
        name: data.name,
        subtitle: data.subtitle || data.description?.substring(0, 40) || 'Natural skincare',
        price: data.price_pkr || data.price_aed || 0,
        price_pkr: data.price_pkr || 0,
        price_aed: data.price_aed || 0,
        currency: (data.currency || 'PKR') as 'PKR' | 'AED',
        image: data.image || '',
        bgColor: colors.bg,
        shadowColor: colors.shadow,
      })
    }
  }

  useEffect(() => {
    fetchFeaturedBestseller()
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, author_name, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4)
    if (data) {
      setBlogPosts(data)
    }
  }

  const formatPrice = (product: Product) => {
    if (product.price_pkr) return `From ₨${product.price_pkr.toLocaleString()}`
    if (product.price_aed) return `From AED ${product.price_aed}`
    return ''
  }

  return (
    <PageFrame frameColor="#E8A4E0">
          {/* Hero + pills — one laptop fold inside the cream frame */}
          <section className="relative w-full md:h-[calc(100dvh-24px)] md:max-h-[calc(100dvh-24px)] overflow-hidden flex flex-col">
            <div className="relative flex-1 min-h-[280px] overflow-hidden">
              <img
                src="/herosec.png"
                alt="CareCraftz Hero"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Cream wash — softens the photo, no dark band at the banner edge */}
              <div className="absolute inset-0 bg-[#fbfcf4]/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0e6]/55 via-[#fbfcf4]/15 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-4 pt-20">
                <div className="bg-[#fbfcf4]/94 backdrop-blur-sm rounded-2xl px-4 py-3.5 max-w-sm border border-[#2b2b2b]/06 shadow-sm">
                  <h1
                    className="text-[#2b2b2b] leading-tight mb-1"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)' }}
                  >
                    Trusted skincare marketplace
                  </h1>
                  <p className="text-[#696a67] text-xs leading-snug mb-2.5">
                    Verified sellers. Curated products. Shop with certainty.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-[#ff9570] hover:bg-[#ff7a50] text-white text-[10px] font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Shop products
                    </button>
                    <button
                      onClick={() => navigate('/partners')}
                      className="bg-[#2b2b2b] hover:bg-black text-white text-[10px] font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Become a seller
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full">
              <AnnouncementBar />
            </div>
          </section>

          {/* Products first */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <h2
                className="text-[#2b2b2b] leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)' }}
              >
                Shop the marketplace
              </h2>
              <button
                onClick={() => navigate('/shop')}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d6b4a] hover:opacity-70"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl h-56 bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-xl p-3.5 flex flex-col cursor-pointer"
                    style={{
                      backgroundColor: product.bgColor,
                      boxShadow: `3px 3px 0px ${product.shadowColor}`,
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <button
                      className="absolute top-2.5 left-2.5 w-7 h-7 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full transition-colors z-10"
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
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center min-h-[140px] py-2">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="max-h-36 max-w-full object-contain drop-shadow-md" />
                      ) : (
                        <div className="w-20 h-20 bg-white/30 rounded-xl" />
                      )}
                    </div>
                    <div className="mt-1.5">
                      <h3 className="font-semibold text-[#2b2b2b] text-xs leading-snug line-clamp-2">{product.name}</h3>
                      <p className="text-[#2b2b2b] font-medium text-[11px] mt-0.5">{formatPrice(product)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {colorSchemes.slice(0, 4).map((colors, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl p-3.5 flex flex-col min-h-[200px]"
                    style={{ backgroundColor: colors.bg, boxShadow: `3px 3px 0px ${colors.shadow}` }}
                  >
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/30 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Shop by skin type — compact */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#eef4ee]">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <h2
                className="text-[#2b2b2b] leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)' }}
              >
                Shop by skin type
              </h2>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {SKIN_TYPES.map((type) => (
                <button
                  key={type.label}
                  onClick={() => setActiveSkinType(type.label)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeSkinType === type.label
                      ? `${type.activeColor} text-[#2b2b2b] shadow-sm`
                      : `${type.color} opacity-80 hover:opacity-100`
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {skinTypeProducts.length > 0 ? (
                skinTypeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-xl p-3.5 flex flex-col flex-shrink-0 cursor-pointer"
                    style={{
                      width: '200px',
                      backgroundColor: product.bgColor,
                      boxShadow: `3px 3px 0px ${product.shadowColor}`,
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <button
                      className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center text-[#2b2b2b] hover:bg-black/10 rounded-full z-10"
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
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center min-h-[120px] py-2">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="max-h-28 max-w-full object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-white/30 rounded-xl" />
                      )}
                    </div>
                    <h3 className="font-semibold text-[#2b2b2b] text-xs line-clamp-2">{product.name}</h3>
                    <p className="text-[#2b2b2b] font-medium text-[11px] mt-0.5">{formatPrice(product)}</p>
                  </div>
                ))
              ) : (
                colorSchemes.map((colors, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl p-3.5 flex flex-col flex-shrink-0"
                    style={{ width: '200px', backgroundColor: colors.bg, boxShadow: `3px 3px 0px ${colors.shadow}` }}
                  >
                    <div className="flex items-center justify-center min-h-[120px]">
                      <div className="w-16 h-16 bg-white/30 rounded-xl" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Marketplace intro — compact */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5">
            <div className="rounded-2xl bg-[#FFD6A5] px-5 py-5 sm:px-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2
                  className="text-[#2b2b2b] leading-tight mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)' }}
                >
                  A marketplace built on proof
                </h2>
                <p className="text-[#5a4a3a] text-sm leading-snug max-w-lg">
                  Verified sellers, curated listings, and CareCraftz Official under one quality bar.
                </p>
              </div>
              <button
                onClick={() => navigate('/about')}
                className="self-start sm:self-auto bg-[#FF9A7A] hover:bg-[#ff8560] text-[#2b2b2b] text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-colors shrink-0"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                About us
              </button>
            </div>
          </section>

          {/* Featured pick — product only, no lifestyle soap art */}
          {featuredBestseller && (
            <section className="w-full px-4 sm:px-5 lg:px-6 pb-5">
              <div className="rounded-2xl bg-[#f5f0e8] border border-[#2b2b2b]/08 px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="w-28 h-28 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: '#e8e6c9' }}
                >
                  {featuredBestseller.image ? (
                    <img
                      src={featuredBestseller.image}
                      alt={featuredBestseller.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/50 rounded-lg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#696a67] mb-1"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Featured listing
                  </p>
                  <h3
                    className="text-[#2b2b2b] font-semibold text-base truncate"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {featuredBestseller.name}
                  </h3>
                  <p className="text-[#5a5a5a] text-xs truncate">{featuredBestseller.subtitle}</p>
                  <p className="text-[#2b2b2b] font-medium text-sm mt-1">{formatPrice(featuredBestseller)}</p>
                </div>
                <button
                  onClick={() => navigate(`/product/${featuredBestseller.id}`)}
                  className="self-start sm:self-auto bg-[#2b2b2b] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors shrink-0"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  View product
                </button>
              </div>
            </section>
          )}

          {/* Blog — compact */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <h2
                className="text-[#2b2b2b] leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)' }}
              >
                From the journal
              </h2>
              <button
                onClick={() => navigate('/blog')}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d6b4a] hover:opacity-70"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                All posts →
              </button>
            </div>

            {blogPosts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {blogPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group cursor-pointer rounded-xl bg-white border border-[#2b2b2b]/08 overflow-hidden"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    <div className="relative overflow-hidden aspect-[4/3] bg-[#f0ece0]">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/60 rounded-lg" />
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <h3 className="font-semibold text-[#2b2b2b] text-xs leading-snug line-clamp-2 group-hover:text-[#3d6b4a] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[#696a67] text-[11px] leading-snug line-clamp-2 mt-1">
                        {post.excerpt || 'Tips and guides from the CareCraftz marketplace.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl bg-white border border-[#2b2b2b]/08 overflow-hidden">
                    <div className="aspect-[4/3] bg-[#f0ece0] animate-pulse" />
                    <div className="px-3 py-2.5 space-y-1.5">
                      <div className="h-3 bg-[#f0ece0] rounded w-3/4" />
                      <div className="h-2.5 bg-[#f0ece0] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* How we verify — compact */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5">
            <div className="rounded-2xl bg-[#FF9A7A] px-4 py-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
                <div>
                  <h2
                    className="text-[#2b2b2b] leading-tight mb-1"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)' }}
                  >
                    How we verify sellers
                  </h2>
                  <p className="text-[#2b2b2b]/75 text-sm leading-snug max-w-md">
                    A structured review before any brand lists on CareCraftz.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/why-us')}
                  className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-[0.18em] text-[#2b2b2b] hover:opacity-70"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Learn more →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { step: '01', label: 'Identity', desc: 'License & contact' },
                  { step: '02', label: 'Safety', desc: 'Formula & testing' },
                  { step: '03', label: 'Claims', desc: 'Evidence check' },
                  { step: '04', label: 'Packaging', desc: 'Standards' },
                  { step: '05', label: 'Documents', desc: 'Labs & certs' },
                ].map((item) => (
                  <div key={item.step} className="bg-white/45 rounded-xl px-3 py-3">
                    <p className="text-[#2b2b2b]/45 text-[10px] font-bold tracking-widest mb-1">{item.step}</p>
                    <p className="text-[#2b2b2b] text-xs font-bold">{item.label}</p>
                    <p className="text-[#2b2b2b]/70 text-[11px] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Values strip */}
          <section className="w-full px-4 sm:px-5 lg:px-6 pb-5">
            <div className="rounded-full overflow-hidden py-2.5 px-4" style={{ backgroundColor: '#E8B800' }}>
              <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
                {[
                  'Verified sellers',
                  'Authentic products',
                  'Curated assortment',
                  'Document review',
                  'CareCraftz Official',
                  'Trust first',
                ].flatMap((label, i) => [
                  <span key={`a-${i}`} className="inline-flex items-center gap-2 text-[#2b2b2b] text-xs font-semibold">
                    <span className="w-1 h-1 rounded-full bg-[#2b2b2b]" />
                    {label}
                  </span>,
                  <span key={`b-${i}`} className="inline-flex items-center gap-2 text-[#2b2b2b] text-xs font-semibold">
                    <span className="w-1 h-1 rounded-full bg-[#2b2b2b]" />
                    {label}
                  </span>,
                ])}
              </div>
            </div>
          </section>

          {/* Reviews — compact, marketplace-focused */}
          <section className="w-full px-4 sm:px-5 lg:px-6 py-5 pb-8">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <div>
                <h2
                  className="text-[#2b2b2b] leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.25rem, 2.4vw, 1.65rem)' }}
                >
                  What shoppers say
                </h2>
                <p className="text-[#696a67] text-sm mt-0.5">Trusted by skincare buyers across UAE & Pakistan</p>
              </div>
              <p className="text-[#2b2b2b] text-xs font-medium">
                <span className="text-[#1db954]">★★★★★</span> 4.9/5 average
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { name: 'Sarah M.', location: 'Dubai', text: 'Love that every listing feels vetted. I found a cleanser that actually suits my skin without guessing.' },
                { name: 'Aisha K.', location: 'Lahore', text: 'Finally a marketplace that works for sensitive skin. Clear seller info and products that deliver.' },
                { name: 'Fatima R.', location: 'Karachi', text: 'Ordered a serum through CareCraftz — packaging was solid and results showed within two weeks.' },
                { name: 'Noor H.', location: 'Islamabad', text: 'Shop by skin type made browsing easy. Checkout was smooth and delivery was on time.' },
                { name: 'Zara A.', location: 'Dubai', text: 'Prefer buying here over random stores. The curated assortment saves me from bad impulse picks.' },
                { name: 'Maryam S.', location: 'London', text: 'Discovered CareCraftz in Dubai and still order from the UK. Products arrive well packed.' },
              ].map((review, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl px-3.5 py-3.5 border border-[#2b2b2b]/08"
                  style={{ boxShadow: `3px 3px 0px ${['#8DEBD1', '#F4956A', '#FFD94A', '#E8A4E0', '#7EC8E3', '#FF8FAB'][i % 6]}` }}
                >
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, s) => (
                      <span key={s} className="text-[#E8B800] text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-[#2b2b2b] text-xs leading-snug mb-3">"{review.text}"</p>
                  <div>
                    <p className="text-[#2b2b2b] text-xs font-semibold">{review.name}</p>
                    <p className="text-[#696a67] text-[11px]">{review.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

    </PageFrame>
  )
}
