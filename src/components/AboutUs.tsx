import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260521_064421_279656fd-e76f-40a0-8fed-7456d4f7715a.mp4'

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function NavItem({ children }: { children: string }) {
  const [cycle, setCycle] = useState(0)

  return (
    <a className="relative overflow-hidden group flex items-center justify-center py-1">
      {cycle === 0 ? (
        <span className="text-white/64 group-hover:text-white transition-colors duration-300">{children}</span>
      ) : (
        <>
          <span key={cycle} className="animate-fly-out-up">{children}</span>
          <span key={cycle + 1} className="absolute animate-fly-in-up">{children}</span>
        </>
      )}
    </a>
  )
}

export default function AboutUs() {
  const [arrowCycle, setArrowCycle] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const screen3Ref = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll()
  const headerY = useTransform(scrollY, [0, 500, 800], [0, 0, -150])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleCanPlay = () => setIsLoaded(true)
    video.addEventListener('canplaythrough', handleCanPlay)
    video.load()
    return () => video.removeEventListener('canplaythrough', handleCanPlay)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const video = videoRef.current
    if (!video || !video.duration) return

    const handleScroll = () => {
      if (!screen3Ref.current || video.seeking) return
      const rect = screen3Ref.current.getBoundingClientRect()
      const absoluteTop = window.scrollY + rect.top
      const stopScroll = Math.max(1, absoluteTop - window.innerHeight * 0.2)
      const scrollFraction = Math.max(0, Math.min(1, window.scrollY / stopScroll))
      video.currentTime = scrollFraction * video.duration
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoaded])

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <span className="text-[10px] font-mono tracking-widest mb-4 text-white/50">LOADING</span>
        <div className="w-64 h-[1px] bg-white/10 mt-8 overflow-hidden">
          <div className="h-full bg-white w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Fixed video background */}
      <div className="fixed inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
          muted
          playsInline
        />
      </div>

      {/* Fixed header */}
      <motion.header
        style={{ y: headerY }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-20 w-[90%] flex items-center justify-between pointer-events-auto py-4 md:py-6 lg:py-8"
      >
        <svg width="157" height="25" viewBox="0 0 157 25" fill="none">
          <path d="M10 5 L20 20 L30 5" stroke="white" strokeWidth="2" fill="none" />
          <path d="M40 5 L50 20 L60 5" stroke="white" strokeWidth="2" fill="none" />
          <path d="M70 5 L80 20 L90 5" stroke="white" strokeWidth="2" fill="none" />
          <path d="M100 5 L110 20 L120 5" stroke="white" strokeWidth="2" fill="none" />
        </svg>

        <div className="hidden lg:flex items-stretch bg-[#1A1A1A]/40 backdrop-blur-[80px]">
          <div className="flex items-center justify-between px-6 font-mono text-xs tracking-[-0.01em] w-[480px]">
            <NavItem>LEAGUES</NavItem>
            <NavItem>STADIUMS</NavItem>
            <NavItem>TRAINING</NavItem>
            <NavItem>COMPETITIONS</NavItem>
            <NavItem>TICKETS</NavItem>
          </div>
          <button className="bg-white text-black px-6 py-5 font-mono text-xs leading-4 font-bold tracking-[-0.01em] hover:bg-gray-200 transition-colors w-[148px]">
            BUY MATCH PASS
          </button>
        </div>
      </motion.header>

      {/* Scrollable content */}
      <div className="relative z-10 pointer-events-none">
        {/* Section 1: Hero */}
        <section className="w-[90%] mx-auto h-screen flex flex-col py-8 md:py-12 lg:py-16 pb-12 pointer-events-auto">
          <div className="flex-1 w-full flex flex-col md:grid md:grid-cols-12 md:grid-rows-[1fr_auto] gap-y-8 md:gap-y-0 md:gap-x-8">
            <Reveal delay={0.2} className="md:row-start-2 md:col-start-1 md:col-span-8 flex items-end">
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] font-medium tracking-tight text-white whitespace-nowrap">
                Championing
                <br />
                The Pitch Of Legends
              </h1>
            </Reveal>

            <Reveal delay={0.3} className="md:row-start-1 md:col-start-8 md:col-span-5 flex flex-col justify-center items-start md:items-end text-left md:text-right">
              <p className="text-[clamp(1rem,1.6vw,1.375rem)] text-white/64 leading-[1.3] font-normal max-w-[460px] relative -top-[90px]">
                Advanced preparation and training of world-class football teams for leagues, tournaments, and trophies.{' '}
                <span className="font-semibold text-white">We bring the trophy closer to your cabinet.</span>
              </p>
            </Reveal>

            <Reveal delay={0.4} className="md:row-start-2 md:col-start-8 md:col-span-5 flex items-end justify-start md:justify-end">
              <div className="flex items-stretch gap-1 group cursor-pointer">
                <div className="px-8 py-5 bg-white/8 backdrop-blur-[80px] group-hover:bg-white transition-colors">
                  <span className="font-mono text-[12px] tracking-[-0.01em] text-white/90 group-hover:text-black transition-colors">
                    EXPLORE OUR STADIUMS
                  </span>
                </div>
                <div className="px-6 bg-white/8 backdrop-blur-[80px] group-hover:bg-white transition-colors flex items-center justify-center">
                  {arrowCycle === 0 ? (
                    <ArrowRight className="w-5 h-5 text-white/90 group-hover:text-black transition-colors" />
                  ) : (
                    <>
                      <ArrowRight key={arrowCycle} className="w-5 h-5 text-white/90 group-hover:text-black animate-fly-out" />
                      <ArrowRight key={arrowCycle + 1} className="w-5 h-5 text-white/90 group-hover:text-black absolute animate-fly-in" />
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-[200px] w-full" />

        {/* Section 2: ScrollReveal + Grid */}
        <section className="w-[90%] mx-auto min-h-screen flex flex-col justify-center py-8 md:py-12 lg:py-16 pointer-events-auto">
          <div className="max-w-[1200px] w-full">
            <ScrollReveal
              baseOpacity={0.1}
              enableBlur={true}
              baseRotation={3}
              blurStrength={4}
              textClassName="text-[clamp(2rem,4.5vw,4rem)] leading-[1.1] font-medium tracking-tight text-white w-full"
            >
              Complete Football Programs For Professional Player Development. We Build The Foundations For Next-Generation Strikers, Midfielders, And Star Defenders.
            </ScrollReveal>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
              <Reveal delay={0.1} className="md:col-span-4">
                <div className="flex items-center gap-4 mb-4">
                  <svg width="71" height="43" viewBox="0 0 71 43" fill="none" stroke="white" strokeWidth="1">
                    <ellipse cx="35.5" cy="21.5" rx="35" ry="21" />
                    <line x1="35.5" y1="0.5" x2="35.5" y2="42.5" />
                    <line x1="0.5" y1="21.5" x2="70.5" y2="21.5" />
                  </svg>
                  <svg width="157" height="25" viewBox="0 0 157 25" fill="none" className="h-[18px] w-auto">
                    <path d="M10 5 L20 20 L30 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M40 5 L50 20 L60 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M70 5 L80 20 L90 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M100 5 L110 20 L120 5" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <p className="text-[11px] font-mono tracking-widest text-white/60 uppercase leading-relaxed">
                  Winning the future on pitch
                </p>
              </Reveal>

              <Reveal delay={0.2} className="md:col-span-4">
                <h3 className="text-xl font-medium text-white mb-4">Performance Analytics / Facilities</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  State-of-the-art training facilities equipped with cutting-edge analytics to optimize player performance and track development metrics.
                </p>
              </Reveal>

              <Reveal delay={0.3} className="md:col-span-4">
                <h3 className="text-xl font-medium text-white mb-4">Matchday Premium / Fan Experiences!</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  Premium seating, exclusive access, and unforgettable matchday experiences for fans and VIP guests.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-[200px] w-full" />

        {/* Section 3: Footer */}
        <section ref={screen3Ref} className="pointer-events-auto">
          <div style={{ width: '90%', margin: '0 auto', paddingBottom: '64px' }}>
            <div
              style={{
                backgroundColor: 'rgba(26, 26, 26, 0.6)',
                backdropFilter: 'blur(80px)',
                WebkitBackdropFilter: 'blur(80px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: 'clamp(32px, 4vw, 64px)',
              }}
            >
              <div className="flex flex-wrap items-end justify-between gap-10 pb-[clamp(48px,4vw,80px)]" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'white' }}>
                  Ready To Score / Your Winning Season?
                </h2>
                <div className="flex items-stretch gap-1">
                  <div className="px-8 py-5 bg-white transition-colors">
                    <span className="font-mono text-[12px] tracking-[-0.01em] text-black font-bold">
                      START YOUR SEASONS
                    </span>
                  </div>
                  <div className="px-6 bg-white flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-black" />
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 'clamp(48px, 4vw, 64px)' }} className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[clamp(32px,3vw,48px)]">
                <div>
                  <svg width="157" height="25" viewBox="0 0 157 25" fill="none" className="h-[14px] mb-4">
                    <path d="M10 5 L20 20 L30 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M40 5 L50 20 L60 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M70 5 L80 20 L90 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M100 5 L110 20 L120 5" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: 220 }}>
                    Championing excellence in football development worldwide.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-mono tracking-[0.1em] text-white/30 mb-4">COMPANY</div>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">About</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Rosters</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Press</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Contact</a></li>
                  </ul>
                </div>

                <div>
                  <div className="text-[10px] font-mono tracking-[0.1em] text-white/30 mb-4">SERVICES</div>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Coaching</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Training Camp</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Fitness</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Tryout</a></li>
                  </ul>
                </div>

                <div>
                  <div className="text-[10px] font-mono tracking-[0.1em] text-white/30 mb-4">CONNECT</div>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">LinkedIn</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">X / Twitter</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">YouTube</a></li>
                    <li><a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">Newsletter</a></li>
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }} className="flex flex-wrap justify-between">
                <span className="text-[11px] font-mono text-white/25 tracking-[0.1em]">
                  2026 WISA. ALL RIGHTS RESERVED.
                </span>
                <div className="flex gap-6">
                  <a href="#" className="text-[11px] font-mono text-white/25 tracking-[0.1em] hover:text-white transition-colors">PRIVACY</a>
                  <a href="#" className="text-[11px] font-mono text-white/25 tracking-[0.1em] hover:text-white transition-colors">TERMS</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
