import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const HERO_TEXT = '#332023'
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const PRODUCT = {
  name: 'Eau So Fresh',
  size: '100 ml / 3.4 oz',
  image: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260511_143221_81001e13-b71c-4a90-b2d7-abf4e2ec08ff.png&w=1280&q=85',
}

const HERO_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_142713_322c5ac5-8a5d-413b-be68-4a0e82014264.mp4'

function anim(visible: boolean, delay: number, opts: { y?: number; x?: number; duration?: number } = {}) {
  const { y = 20, x = 0, duration = 1600 } = opts
  const translateFrom = y !== 0 ? `translateY(${y}px)` : x !== 0 ? `translateX(${x}px)` : 'none'
  return {
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0,0)' : translateFrom,
      transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
    } as CSSProperties,
  }
}

export default function WildDaisyHero() {
  const heroRef = useRef<HTMLElement>(null)
  const [v, setV] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setV(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={heroRef as any} className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden">
      {/* 1a. Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        ref={(el) => { if (el) el.playbackRate = 1 }}
      >
        <source src={HERO_VIDEO_URL} type="video/mp4" />
      </video>

      {/* 1b. Header nav */}
      <header
        className="absolute top-0 left-0 w-full flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6"
        style={{ zIndex: 40, ...anim(v, 100, { y: -10, duration: 1400 }).style }}
      >
        <div className="font-black text-xs sm:text-sm tracking-widest leading-tight uppercase" style={{ color: HERO_TEXT }}>
          <div>Wild Daisy</div>
          <div>Fragrances</div>
        </div>
        <nav className="flex gap-5 sm:gap-8">
          <a className="text-xs font-bold tracking-widest uppercase relative group" style={{ color: HERO_TEXT }}>
            <span>Shop Now</span>
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" style={{ backgroundColor: HERO_TEXT }} />
          </a>
          <a className="text-xs font-bold tracking-widest uppercase relative group" style={{ color: HERO_TEXT }}>
            <span>Cart</span>
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" style={{ backgroundColor: HERO_TEXT }} />
          </a>
        </nav>
      </header>

      {/* 1c. Scroll indicator (desktop only) */}
      <div
        className="hidden sm:block absolute right-8 md:right-10"
        style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 20, ...anim(v, 1000, { x: 16, duration: 1600 }).style }}
      >
        <span className="text-xl tracking-widest" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: HERO_TEXT }}>
          Scroll
        </span>
      </div>

      {/* 1d. Floating product card (desktop only, bottom-right) */}
      <div
        className="hidden sm:flex absolute bottom-10 right-10 rounded-2xl items-center gap-2 px-5 py-4"
        style={{ zIndex: 30, minWidth: '260px', backgroundColor: '#ffffff', boxShadow: '0 4px 24px rgba(51,32,35,0.08), 0 1px 4px rgba(51,32,35,0.06)', ...anim(v, 1300, { y: 20, duration: 1400 }).style }}
      >
        <div className="flex-shrink-0 overflow-hidden" style={{ width: '60px', height: '76px', borderRadius: '8px' }}>
          <img
            src={PRODUCT.image}
            alt={PRODUCT.name}
            style={{ width: '130%', height: '130%', objectFit: 'contain', display: 'block', marginLeft: '-15%', marginTop: '-15%' }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide leading-tight" style={{ color: HERO_TEXT }}>
            Eau So Fresh
          </span>
          <span className="tracking-wide" style={{ fontSize: '11px', fontWeight: 500, marginTop: '3px', color: HERO_TEXT }}>
            100 ml / 3.4 oz
          </span>
          <button className="text-xs font-bold tracking-widest uppercase self-start leading-tight relative overflow-hidden group" style={{ marginTop: '14px', color: HERO_TEXT }}>
            <span className="relative z-10">Add to Cart</span>
            <span className="absolute bottom-0 left-0 h-px w-full origin-left transition-transform duration-300 ease-out scale-x-100 group-hover:scale-x-0" style={{ backgroundColor: HERO_TEXT }} />
            <span className="absolute bottom-0 left-0 h-px w-full origin-right transition-transform duration-300 ease-out delay-150 scale-x-0 group-hover:scale-x-100" style={{ backgroundColor: HERO_TEXT, opacity: 0.4 }} />
          </button>
        </div>
      </div>

      {/* 1e. Slide index "01" (desktop only) */}
      <div
        className="hidden sm:block absolute left-6 md:left-8"
        style={{
          top: '50%',
          transform: v ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-24px)',
          fontFamily: '"Playfair Display", "Didot", "Bodoni MT", "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(2.5rem,6.5vw,6rem)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          zIndex: 10,
          color: HERO_TEXT,
          opacity: v ? 1 : 0,
          transition: `opacity 1600ms ${EASE} 500ms, transform 1600ms ${EASE} 500ms`,
        }}
      >
        01
      </div>

      {/* 1f. Hero title + mobile card wrapper */}
      <div className="relative pb-0 sm:pb-12 pl-5 sm:pl-8 pr-0 sm:pr-8" style={{ zIndex: 10 }}>
        <h1 className="font-medium uppercase leading-tight sm:leading-none" style={{ fontSize: 'clamp(2.2rem,8vw,4rem)', letterSpacing: '-0.01em' }}>
          {/* Mobile lines */}
          <span className="block sm:hidden" style={{ color: '#ffffff', textShadow: '0 2px 16px rgba(0,0,0,0.4)', ...anim(v, 600, { y: 24, duration: 1600 }).style }}>
            Sweet Daisy
          </span>
          <span className="block sm:hidden" style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 12px rgba(0,0,0,0.35)', ...anim(v, 800, { y: 24, duration: 1600 }).style }}>
            Personal Scent
          </span>
          <span className="block sm:hidden" style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 12px rgba(0,0,0,0.35)', ...anim(v, 1000, { y: 24, duration: 1600 }).style }}>
            Finder
          </span>

          {/* Desktop lines */}
          <span className="hidden sm:block" style={{ color: HERO_TEXT, ...anim(v, 600, { y: 24, duration: 1600 }).style }}>
            Sweet Daisy
          </span>
          <span className="hidden sm:block" style={{ color: '#B0A2A1', ...anim(v, 800, { y: 24, duration: 1600 }).style }}>
            Personal Scent
          </span>
          <span className="hidden sm:block" style={{ color: '#B0A2A1', ...anim(v, 1000, { y: 24, duration: 1600 }).style }}>
            Finder
          </span>
        </h1>

        {/* 1g. Mobile inline product card (below title) */}
        <div
          className="sm:hidden flex items-center gap-3 mt-4 mr-5 mb-8 px-4 py-4 rounded-2xl"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 24px rgba(51,32,35,0.08), 0 1px 4px rgba(51,32,35,0.06)', ...anim(v, 1300, { y: 20, duration: 1400 }).style }}
        >
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '56px', height: '70px', borderRadius: '6px' }}>
            <img
              src={PRODUCT.image}
              alt={PRODUCT.name}
              style={{ width: '130%', height: '130%', objectFit: 'contain', display: 'block', marginLeft: '-15%', marginTop: '-15%' }}
            />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold tracking-wide leading-tight" style={{ color: HERO_TEXT }}>
              Eau So Fresh
            </span>
            <span className="tracking-wide" style={{ fontSize: '11px', fontWeight: 500, marginTop: '3px', color: HERO_TEXT }}>
              100 ml / 3.4 oz
            </span>
            <button className="text-xs font-bold tracking-widest uppercase self-start leading-tight relative overflow-hidden group" style={{ marginTop: '12px', color: HERO_TEXT }}>
              <span className="relative z-10">Add to Cart</span>
              <span className="absolute bottom-0 left-0 h-px w-full origin-left transition-transform duration-300 ease-out scale-x-100 group-hover:scale-x-0" style={{ backgroundColor: HERO_TEXT }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
