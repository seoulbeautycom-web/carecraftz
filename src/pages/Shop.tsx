import { useState, useEffect, useRef } from 'react'
import { Pause, Play } from 'lucide-react'

const HERO_BG_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_101925_8e509c31-4e75-4ae1-b164-2605265b2d47.png&w=1280&q=85'

const HERO_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_112022_cddf2487-4ffe-45b6-ba4c-99ab79003cc5.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_175400_b46d1cd2-2050-45e2-9d13-b9c0bacb16b3.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_182440_671605c8-2ed8-4507-a4cb-a62a8f61316f.mp4',
]

const PRODUCTS = [
  {
    category: 'ILLUMINATE',
    name: 'Illuminating cleansing gel',
    price: '€36,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_193822_8c95f5ed-b142-454f-ab87-59ad1f09e758.png&w=1280&q=85',
  },
  {
    category: 'UNIFY',
    subcategory: 'TIGHTEN PORES',
    name: 'Unifying serum spray',
    price: '€34,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_194048_278bf3cc-7d1f-43c1-9dc7-73d8fcd9949c.png&w=1280&q=85',
  },
  {
    category: 'NATURAL GLOW',
    name: 'Super glow set',
    price: '€92,00',
    oldPrice: '€99,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_194058_d89610de-05f8-45e4-8196-0680296c565a.png&w=1280&q=85',
  },
  {
    category: 'PROTECT',
    subcategory: 'ILLUMINATE',
    name: 'Radiance day oil',
    price: '€59,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_194112_1763cbb2-3171-4ad3-9f38-1b738b8f1bb6.png&w=1280&q=85',
  },
  {
    category: 'HYDRATE',
    subcategory: 'NOURISH',
    name: 'Deep moisture cream',
    price: '€48,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_193822_8c95f5ed-b142-454f-ab87-59ad1f09e758.png&w=1280&q=85',
  },
  {
    category: 'RENEW',
    name: 'Night repair elixir',
    price: '€72,00',
    oldPrice: '€79,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_194048_278bf3cc-7d1f-43c1-9dc7-73d8fcd9949c.png&w=1280&q=85',
  },
  {
    category: 'SMOOTH',
    subcategory: 'REFINE',
    name: 'Gentle exfoliating toner',
    price: '€42,00',
    image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260518_194058_d89610de-05f8-45e4-8196-0680296c565a.png&w=1280&q=85',
  },
]

const CATEGORIES = [
  {
    name: 'face',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_203023_87a26602-2898-4acc-a396-c7a2b5ad84fd.mp4',
  },
  {
    name: 'beauty tools',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_203415_b86e3f19-2aec-46cd-9a86-b64c40118e38.mp4',
  },
  {
    name: 'body',
    video: '/moringarotate.mp4',
  },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible] as const
}

export default function Shop() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [activeTab, setActiveTab] = useState('best sellers')
  const [scrollProgress, setScrollProgress] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const [heroRef, heroVisible] = useInView(0.15)
  const [bestSellersRef, bestSellersVisible] = useInView(0.15)
  const [categoriesRef, categoriesVisible] = useInView(0.15)

  // Auto-advance hero videos
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_VIDEOS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPaused])

  // Handle horizontal scroll with mouse wheel
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        carousel.scrollLeft += e.deltaY
      }
    }

    carousel.addEventListener('wheel', handleWheel, { passive: false })
    return () => carousel.removeEventListener('wheel', handleWheel)
  }, [])

  // Update scroll progress
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleScroll = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth
      const progress = carousel.scrollLeft / maxScroll
      setScrollProgress(progress)
    }

    carousel.addEventListener('scroll', handleScroll)
    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section ref={heroRef as any} className="relative w-full min-h-screen flex flex-col lg:flex-row pt-16">
        {/* Hero Left */}
        <div className="w-full lg:w-1/2 min-h-[60vh] lg:min-h-0 relative">
          <img src={HERO_BG_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div
            className={`relative z-10 p-6 sm:p-8 lg:p-12 transition-all duration-1000 ${
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[clamp(3.5rem,5vw,6rem)] font-light leading-[1.05] mb-6 text-white">
              ethical beauty,
              <br />
              sustainable impact.
              <svg className="absolute -bottom-1 left-0 w-full h-4" viewBox="0 0 400 16" fill="none">
                <path d="M0 8 Q100 2 200 8 T400 8" stroke="#C8A45C" strokeWidth="2" fill="none" />
                <path d="M0 10 Q100 4 200 10 T400 10" stroke="#C8A45C" strokeWidth="1.5" fill="none" />
                <path d="M0 12 Q100 6 200 12 T400 12" stroke="#C8A45C" strokeWidth="1" fill="none" />
              </svg>
            </h1>
            <p className="text-sm md:text-base text-white/80 mb-10 max-w-md">
              Committed to sustainable beauty and minimize our impact on the planet.
            </p>
            <button className="btn-primary px-10 py-4 bg-white text-black rounded-full text-sm">
              about us
            </button>
          </div>
        </div>

        {/* Hero Right */}
        <div className="w-full lg:w-1/2 min-h-[40vh] lg:min-h-0 relative bg-black">
          {HERO_VIDEOS.map((video, index) => (
            <video
              key={video}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={video} type="video/mp4" />
            </video>
          ))}

          {/* Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
            {HERO_VIDEOS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section ref={bestSellersRef as any} className="bg-[#F9F4F0] py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
        <div
          className={`transition-all duration-800 ${
            bestSellersVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Tabs */}
          <div className="flex items-center gap-8 mb-8">
            <button
              onClick={() => setActiveTab('best sellers')}
              className={`text-2xl sm:text-4xl md:text-5xl font-medium relative ${
                activeTab === 'best sellers' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              best sellers
              {activeTab === 'best sellers' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1a1a1a] animate-scale-in" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('sets')}
              className={`text-2xl sm:text-4xl md:text-5xl font-medium relative ${
                activeTab === 'sets' ? 'text-[#1a1a1a]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              sets
              {activeTab === 'sets' && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1a1a1a] animate-scale-in" />
              )}
            </button>
          </div>

          {/* Product Carousel */}
          <div
            ref={carouselRef}
            className="flex overflow-x-auto scrollbar-hide gap-0 pb-4"
          >
            {PRODUCTS.map((product, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px] lg:w-[calc(25%-1px)] border border-gray-200 -ml-[1px] first:ml-0 transition-all duration-500 ${
                  bestSellersVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${200 + index * 80}ms` }}
              >
                <div className="px-4 h-12 flex flex-col justify-center">
                  <span className="text-xs font-medium tracking-wider uppercase">{product.category}</span>
                  {product.subcategory && (
                    <span className="text-xs text-gray-500 uppercase mt-0.5">{product.subcategory}</span>
                  )}
                </div>
                <div className="mx-4 aspect-[3/4] rounded-lg overflow-hidden bg-[#F9F4F0] group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm mb-2">{product.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">{product.oldPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Progress Bar */}
          <div className="mt-8 sm:mt-10 mx-auto max-w-[280px]">
            <div className="h-[2px] bg-gray-300 rounded-full">
              <div
                className="h-full bg-[#1a1a1a] rounded-full transition-transform duration-300"
                style={{ transform: `translateX(${scrollProgress * (100 / 0.3)}%)` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section ref={categoriesRef as any} className="bg-black py-12 sm:py-16 px-4 sm:px-6 lg:px-10">
        <div
          className={`grid grid-cols-1 md:grid-cols-3 transition-all duration-1000 ${
            categoriesVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          {CATEGORIES.map((category, index) => (
            <div
              key={index}
              className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[750px] p-6 sm:p-8 md:p-12 overflow-hidden group"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
                <source src={category.video} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium text-white"
                  style={{
                    writingMode: 'vertical-lr',
                    transform: 'rotate(180deg)',
                  }}
                >
                  {category.name}
                </div>
                <button className="btn-primary px-8 py-3 bg-white text-black rounded-full text-sm self-start">
                  shop {category.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
