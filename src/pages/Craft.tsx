import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageFrame from '../components/PageFrame'

const PORTAL_BG = "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1779707217/image_1_vdzwae.png"
const CURTAIN_LEFT = "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1779706559/curtain_left_znkmva.png"
const CURTAIN_RIGHT = "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1779706564/curtain_right_paeyym.png"
const WORLD_BG = "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1779706392/image_2_gkcdlx.png"
const BOTTOM_CLOUDS = "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1779706555/bottom_clouds_xskut6.png"

const CARD_IMAGES = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260525_160507_2ccbb4eb-1469-484f-af25-59168ad9a233.png&w=1280&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260525_160644_072a7f68-a101-4ded-a332-7d37707dbdd1.png&w=1280&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260525_160706_1c153d04-0dfb-4ac9-a4ef-e74f301c329c.png&w=1280&q=85"
]

const CARDS = [
  { title: 'Hidden Realms', desc: 'Luminous sanctuaries unseen by wandering eyes', color: '#f3cdd6' },
  { title: 'Wild Solitudes', desc: 'Dissolve into untamed horizons and deep calm', color: '#dcedc2' },
  { title: 'Silent Havens', desc: 'Remote escapes far beyond ordinary reach', color: '#c3e3f4' },
  { title: 'Bespoke Quests', desc: 'Journeys shaped around your vision and soul', color: '#f0e4c0' },
  { title: 'Vivid Drifts', desc: 'Surreal passages through breathtaking terrain', color: '#dcd2f2' },
  { title: 'Mystic Crests', desc: 'Timeless ridgelines wrapped in cloud and myth', color: '#f3cdd6' },
  { title: 'Deep Currents', desc: 'Glowing depths alive with uncharted wonder', color: '#c3e3f4' },
  { title: 'Gilded Dusk', desc: 'Amber horizons that stretch past all reason', color: '#f0e4c0' },
  { title: 'Glassy Tides', desc: 'Calm waters holding skies of pure stillness', color: '#dcedc2' }
]

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max)

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

interface ArcCardSliderProps {
  cards: typeof CARDS
  rotationOffset: number
  isMobile: boolean
}

function ArcCardSlider({ cards, rotationOffset, isMobile }: ArcCardSliderProps) {
  const cardSpacingDeg = isMobile ? 12 : 9
  const centerIndex = Math.floor(cards.length / 2)
  const arcRadius = isMobile ? 700 : 1100
  const cardW = isMobile ? 160 : 220
  const cardH = isMobile ? 175 : 230
  const halfW = cardW / 2

  return (
    <div style={{ position: 'relative', width: '100%', height: isMobile ? 260 : 360 }}>
      {cards.map((card, i) => {
        const baseDeg = (i - centerIndex) * cardSpacingDeg
        const deg = baseDeg - rotationOffset + (centerIndex * cardSpacingDeg)
        const rad = deg * Math.PI / 180
        const x = Math.sin(rad) * arcRadius
        const y = arcRadius - Math.cos(rad) * arcRadius

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: -y + (isMobile ? 140 : 200),
              left: `calc(50% + ${x}px - ${halfW}px)`,
              width: cardW,
              height: cardH,
              borderRadius: isMobile ? 18 : 26,
              backgroundColor: card.color,
              boxShadow: '0 8px 40px rgba(80,40,60,0.18)',
              transform: `rotate(${deg}deg)`,
              transformOrigin: `${halfW}px ${arcRadius}px`,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1.5px solid rgba(80,50,60,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Imprima, sans-serif',
                fontSize: 10,
                color: 'rgba(80,50,60,0.6)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div>
              <div style={{ fontFamily: 'Viaoda Libre, serif', fontSize: isMobile ? 22 : 30, color: '#3a2530', marginBottom: 4 }}>
                {card.title}
              </div>
              <div style={{ fontFamily: 'Imprima, sans-serif', fontSize: isMobile ? 12 : 15, color: 'rgba(58,37,48,0.65)' }}>
                {card.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CraftInner() {
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [curtainsOpen, setCurtainsOpen] = useState(false)
  const [uiVisible, setUiVisible] = useState(false)
  const [entranceDone, setEntranceDone] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 })
  
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const cloudsRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const curtainLRef = useRef<HTMLDivElement>(null)
  const curtainRRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const containerHeight = containerRef.current.scrollHeight
      const windowHeight = window.innerHeight
      const progress = window.scrollY / (containerHeight - windowHeight)
      setScrollProgress(clamp(progress, 0, 1))
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setCurtainsOpen(true), 100)
    const t2 = setTimeout(() => setUiVisible(true), 600)
    const t3 = setTimeout(() => setEntranceDone(true), 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  useEffect(() => {
    if (isMobile) return
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return
    let animationFrameId: number
    const animate = () => {
      setSmoothMouse(prev => ({
        x: lerp(prev.x, mousePos.x, 0.07),
        y: lerp(prev.y, mousePos.y, 0.07)
      }))
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [mousePos, isMobile])

  const ep = scrollProgress
  const MAG = { world: 6, clouds: 9, portal: 7, curtainL: 14, curtainR: 14 }
  
  const mx = isMobile ? 0 : (smoothMouse.x / window.innerWidth - 0.5) * 2
  const my = isMobile ? 0 : (smoothMouse.y / window.innerHeight - 0.5) * 2

  const scene1Opacity = clamp(1 - ep / 0.22, 0, 1)
  const scene2Opacity = clamp((ep - 0.68) / 0.16, 0, 1)

  const arcSweepDeg = (CARDS.length - 1) * 10
  const rotationOffset = lerp(0, arcSweepDeg, clamp((ep - 0.70) / 0.30, 0, 1))

  return (
    <div ref={containerRef} style={{ height: '480vh', position: 'relative', background: '#0a0608' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#0a0608' }}>
        
        <div
          ref={worldRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '50% 50%',
            transform: `scale(${lerp(1, 1.18, ep)}) translate(${mx * MAG.world}px, ${my * MAG.world}px)`,
            zIndex: 0,
          }}
        >
          <img src={WORLD_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div
          ref={cloudsRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transformOrigin: '50% 100%',
            transform: `scale(${lerp(1, 1.4, ep)}) translate(${mx * MAG.clouds}px, ${my * MAG.clouds * 0.4}px)`,
            opacity: lerp(0.7, 1, clamp(ep / 0.05, 0, 1)),
            zIndex: 10,
          }}
        >
          <img src={BOTTOM_CLOUDS} alt="" style={{ width: '100%', height: 'auto' }} />
        </div>

        <div style={{ position: 'absolute', bottom: isMobile ? 60 : 80, left: 0, right: 0, zIndex: 9, opacity: scene2Opacity }}>
          <ArcCardSlider cards={CARDS} rotationOffset={rotationOffset} isMobile={isMobile} />
        </div>

        <div
          ref={portalRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '52% 38%',
            transform: `scale(${lerp(1, 7.5, ep)}) translate(${mx * MAG.portal}px, ${my * MAG.portal}px)`,
            opacity: ep > 0.65 ? lerp(1, 0, (ep - 0.65) / 0.2) : 1,
            zIndex: 15,
          }}
        >
          <img src={PORTAL_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 16 }} />

        <div
          ref={curtainLRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transform: `translateX(${curtainsOpen ? -62 : 0}%) translateX(${lerp(0, 150, ep)}%) scale(${lerp(1, 1.3, ep)}) translate(${mx * MAG.curtainL}px, ${my * MAG.curtainL * 0.3}px)`,
            transition: entranceDone ? 'none' : 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 16,
          }}
        >
          <img src={CURTAIN_LEFT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
        </div>

        <div
          ref={curtainRRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'right center',
            transform: `translateX(${curtainsOpen ? 62 : 0}%) translateX(${lerp(0, -150, ep)}%) scale(${lerp(1, 1.3, ep)}) translate(${mx * MAG.curtainR}px, ${my * MAG.curtainR * 0.3}px)`,
            transition: entranceDone ? 'none' : 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 16,
          }}
        >
          <img src={CURTAIN_RIGHT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left center' }} />
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42vh', background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 45 }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '18px 20px' : '22px 48px', zIndex: 50 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 2l2.09 6.42H23l-5.45 3.96 2.09 6.42L14 14.84l-5.64 4.06 2.09-6.42L4.96 8.42h6.95L14 2z" fill="white" opacity="0.9" />
            <circle cx="14" cy="24" r="1.5" fill="white" opacity="0.6" />
            <circle cx="6" cy="6" r="1" fill="white" opacity="0.4" />
            <circle cx="22" cy="6" r="1" fill="white" opacity="0.4" />
          </svg>
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 20, opacity: scene1Opacity, pointerEvents: 'none' }}>
          
          <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 100px', opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease, transform 0.9s ease', transform: uiVisible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '0.3s' }}>
            <h1 style={{ fontFamily: 'Viaoda Libre, serif', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: '0.1em', color: '#3b1a0a' }}>
                EXPLORE OUR
              </div>
              <div style={{ fontSize: 'clamp(52px, 16vw, 80px)', letterSpacing: '-0.02em', lineHeight: 0.9, color: '#3b1a0a' }}>
                CRAFT JOURNEY
              </div>
            </h1>
            <p style={{ fontFamily: 'Imprima, sans-serif', fontSize: 15, lineHeight: 1.6, color: '#5c2d0e', maxWidth: 280, textAlign: 'center', marginTop: 20 }}>
              Handcrafted organic skincare, meticulously researched and refined. Every bar tells a story of nature's wisdom and our dedication to pure, sophisticated formulations.
            </p>
            <div style={{ width: 140, height: 140, borderRadius: 22, backgroundImage: `url(${CARD_IMAGES[0]})`, backgroundSize: 'cover', marginTop: 32, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="black">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span style={{ fontFamily: 'Imprima, sans-serif', fontSize: 13, color: 'white' }}>View Reel</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex xl:hidden" style={{ flexDirection: 'column', alignItems: 'center', gap: 28, padding: '80px 32px 96px', opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease, transform 0.9s ease', transform: uiVisible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '0.3s' }}>
            <h1 style={{ fontFamily: 'Viaoda Libre, serif', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '0.1em', color: '#3b1a0a' }}>
                EXPLORE OUR
              </div>
              <div style={{ fontSize: 'clamp(60px, 12vw, 86px)', letterSpacing: '-0.02em', lineHeight: 0.9, color: '#3b1a0a' }}>
                CRAFT JOURNEY
              </div>
            </h1>
            <p style={{ fontFamily: 'Imprima, sans-serif', fontSize: 16, lineHeight: 1.6, color: '#5c2d0e', maxWidth: 400, textAlign: 'center' }}>
              Handcrafted organic skincare, meticulously researched and refined. Every bar tells a story of nature's wisdom and our dedication to pure, sophisticated formulations.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              {CARD_IMAGES.map((img, i) => (
                <div key={i} style={{ width: 140, height: 140, borderRadius: 22, backgroundImage: `url(${img})`, backgroundSize: 'cover', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.2), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '44%', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />
                  {i === 1 ? (
                    <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                      <div style={{ fontFamily: 'Viaoda Libre, serif', fontSize: 28, color: 'white' }}>32</div>
                      <div style={{ fontFamily: 'Imprima, sans-serif', fontSize: 13, color: 'white' }}>World Patrons</div>
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="black">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span style={{ fontFamily: 'Imprima, sans-serif', fontSize: 13, color: 'white' }}>View Reel</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden xl:block" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '46%', left: 60, maxWidth: 440, opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease, transform 0.9s ease', transform: uiVisible ? 'translateY(-50%)' : 'translateY(-30px)', transitionDelay: '0.3s' }}>
              <h1 style={{ fontFamily: 'Viaoda Libre, serif', textShadow: '0 2px 24px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.9)' }}>
                <div style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', lineHeight: 1.1, letterSpacing: '0.04em', color: 'white' }}>
                  EXPLORE OUR
                </div>
                <div style={{ fontSize: 'clamp(50px, 7.5vw, 88px)', lineHeight: 0.9, letterSpacing: '-0.02em', color: 'white' }}>
                  CRAFT JOURNEY
                </div>
              </h1>
              <p style={{ fontFamily: 'Imprima, sans-serif', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,245,235,0.88)', maxWidth: 300, marginTop: 16, textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>
                Handcrafted organic skincare, meticulously researched and refined. Every bar tells a story of nature's wisdom and our dedication to pure, sophisticated formulations.
              </p>
            </div>
            <div style={{ position: 'absolute', right: 40, top: '50%', display: 'flex', gap: 12, opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease, transform 0.9s ease', transform: uiVisible ? 'translateY(-50%)' : 'translateY(-30px)', transitionDelay: '0.55s' }}>
              {CARD_IMAGES.map((img, i) => (
                <div key={i} style={{ width: 158, height: 158, borderRadius: 28, backgroundImage: `url(${img})`, backgroundSize: 'cover', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.2), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '44%', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                    {i === 1 ? (
                      <>
                        <div style={{ fontFamily: 'Viaoda Libre, serif', fontSize: 36, color: 'white' }}>32</div>
                        <div style={{ fontFamily: 'Imprima, sans-serif', fontSize: 18, color: 'white' }}>World Patrons</div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <span style={{ fontFamily: 'Imprima, sans-serif', fontSize: 18, color: 'white' }}>View Reel</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: isMobile ? 28 : 40, left: isMobile ? '50%' : 60, transform: isMobile ? 'translateX(-50%)' : 'none', display: 'flex', gap: 8, opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease', transitionDelay: '0.8s' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: i === 0 ? 28 : 14, height: 4, borderRadius: 2, background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>

          {!isMobile && (
            <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', opacity: uiVisible ? 1 : 0, transition: 'opacity 0.9s ease', transitionDelay: '0.9s' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 8 }}>DESCEND</div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', animation: 'bobUp 1.8s ease-in-out infinite' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 46, opacity: scene2Opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <h2 style={{ fontFamily: 'Viaoda Libre, serif', fontSize: isMobile ? 'clamp(28px, 8vw, 44px)' : 'clamp(38px, 6.5vw, 78px)', color: 'white', letterSpacing: '0.03em', lineHeight: 1.05, textAlign: 'center', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            PURE FORMULATIONS
          </h2>
          <p style={{ fontFamily: 'Imprima, sans-serif', fontSize: isMobile ? 14 : 20, lineHeight: 1.6, letterSpacing: '-0.01em', maxWidth: isMobile ? 260 : 480, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginTop: isMobile ? '8vh' : '12vh' }}>
            Discover our collection of handcrafted organic soaps, each meticulously formulated with natural ingredients sourced from the UAE and Pakistan. Experience the difference of truly refined skincare.
          </p>
          <button
            onClick={() => navigate('/about')}
            style={{ marginTop: isMobile ? '4vh' : '6vh', padding: '14px 36px', borderRadius: 40, background: 'white', color: '#1a0a10', fontFamily: 'Imprima, sans-serif', fontSize: isMobile ? 14 : 16, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
          >
            About Us →
          </button>
        </div>

      </div>
    </div>
  )
}

export default function Craft() {
  return (
    <PageFrame frameColor="#8DEBD1" showFooter={true} scrollDriven={true}>
      <CraftInner />
    </PageFrame>
  )
}
