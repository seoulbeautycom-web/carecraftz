import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

const IMAGES = [
  { src: '/s1.png', bg: '#F4845F', panel: '#F79B7F' },
  { src: '/s2.png', bg: '#6BBF7A', panel: '#85CC92' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png', bg: '#E882B4', panel: '#ED9DC4' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png', bg: '#6EB5FF', panel: '#8DC4FF' },
]

const CONTENT = [
  {
    title: 'spotless glow',
    bullets: [
      'Even-toned, radiant skin',
      'Say bye to dark spots',
      'Powered by natural ingredients',
    ],
  },
  {
    title: 'For your sensitive skin',
    bullets: [
      'Exfoliate',
      'Cleanse',
      'Shine',
    ],
  },
  {
    title: '',
    bullets: [],
  },
  {
    title: '',
    bullets: [],
  },
]

export default function ToonHubHero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Preload all images
    IMAGES.forEach((img) => {
      new Image().src = img.src
    })

    // Check mobile on mount and resize
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navigate = (direction: 'next' | 'prev') => {
    if (isAnimating) return
    setIsAnimating(true)
    
    if (direction === 'next') {
      setActiveIndex((prev) => (prev + 1) % 4)
    } else {
      setActiveIndex((prev) => (prev + 3) % 4)
    }

    setTimeout(() => setIsAnimating(false), 650)
  }

  const center = activeIndex
  const left = (activeIndex + 3) % 4
  const right = (activeIndex + 1) % 4

  const getRole = (index: number) => {
    if (index === center) return 'center'
    if (index === left) return 'left'
    if (index === right) return 'right'
    return 'back'
  }

  const getItemStyle = (role: string) => {
    const baseStyle = {
      position: 'absolute' as const,
      aspectRatio: '0.6 / 1',
      willChange: 'transform, filter, opacity' as const,
      transition: 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)',
    }

    switch (role) {
      case 'center':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) scale(' + (isMobile ? 1.25 : 1.68) + ')',
          filter: 'none',
          opacity: 1,
          zIndex: 20,
          left: '50%',
          height: isMobile ? '60%' : '92%',
          bottom: isMobile ? '22%' : '12%',
        }
      case 'left':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)',
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? '20%' : '30%',
          height: isMobile ? '16%' : '28%',
          bottom: isMobile ? '32%' : '12%',
        }
      case 'right':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)',
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? '80%' : '70%',
          height: isMobile ? '16%' : '28%',
          bottom: isMobile ? '32%' : '12%',
        }
      case 'back':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(4px)',
          opacity: 1,
          zIndex: 5,
          left: '50%',
          height: isMobile ? '13%' : '22%',
          bottom: isMobile ? '32%' : '12%',
        }
      default:
        return baseStyle
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="relative w-full" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Giant ghost text */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            zIndex: 2,
            top: '18%',
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(45px, 14vw, 190px)',
            fontWeight: 900,
            color: 'white',
            opacity: 1,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          FOR THAT GLASS SKIN
        </div>

        {/* Carousel */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {IMAGES.map((img, index) => {
            const role = getRole(index)
            const style = getItemStyle(role)
            return (
              <div key={index} style={style}>
                <img
                  src={img.src}
                  alt={`ToonHub figurine ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'bottom center',
                  }}
                  draggable={false}
                />
              </div>
            )
          })}
        </div>

        {/* Bottom-left text + nav buttons */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: '320px' }}
        >
          <p
            className="font-bold uppercase tracking-widest text-base sm:text-[22px]"
            style={{
              color: 'white',
              opacity: 0.95,
              letterSpacing: '0.02em',
            }}
          >
            {CONTENT[activeIndex].title}
          </p>
          <div className="hidden sm:block mt-2 space-y-2">
            {CONTENT[activeIndex].bullets.map((bullet, index) => (
              <div key={index} className="flex items-center gap-2" style={{ color: 'white', opacity: 0.85 }}>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-xs sm:text-sm">{bullet}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('prev')}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 border-white bg-transparent transition-all duration-150 hover:scale-108 hover:bg-white/12"
              style={{ color: 'white' }}
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => navigate('next')}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 border-white bg-transparent transition-all duration-150 hover:scale-108 hover:bg-white/12"
              style={{ color: 'white' }}
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Bottom-right link */}
        <a
          href="#"
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 flex items-center gap-2 no-underline"
          style={{
            zIndex: 60,
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(20px, 4vw, 56px)',
            fontWeight: 400,
            color: 'white',
            opacity: 0.95,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.95'}
        >
          DISCOVER IT
          <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={2.25} />
        </a>
      </div>
    </div>
  )
}
