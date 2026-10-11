import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const ROTATING = [
  'the best products',
  'verified sellers only',
  'skincare you can trust',
  'proof before the cart',
]

const SEALS = [
  { icon: '/about/icons/shield.png', label: 'Seller verified' },
  { icon: '/about/icons/lab.png', label: 'Lab reviewed' },
  { icon: '/about/icons/check.png', label: 'Claims checked' },
  { icon: '/about/icons/sparkle.png', label: 'Curated for you' },
]

const MARQUEE = [
  'Best products',
  'Verified sellers',
  'Document review',
  'CareCraftz Official',
  'UAE · Pakistan',
  'Shop with certainty',
]

function Fade({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function RotatingLine() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % ROTATING.length), 2200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className="relative block h-[1.15em] overflow-hidden" style={{ minWidth: '18ch' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING[index]}
          className="absolute inset-x-0 top-0 italic text-[#8DEBD1]"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          initial={{ opacity: 0, y: '40%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-40%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {ROTATING[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function LoopVideo({
  src,
  poster,
  className = '',
}: {
  src: string
  poster?: string
  className?: string
}) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

export default function AboutUs() {
  const navigate = useNavigate()

  return (
    <div className="bg-[#fbfcf4] w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Full-bleed video hero */}
      <section className="relative w-full md:min-h-[calc(100dvh-24px)] md:max-h-[calc(100dvh-24px)] overflow-hidden flex flex-col">
        <div className="relative flex-1 min-h-[420px]">
          <LoopVideo src="/about/video-cream.mp4?v=3" poster="/about/hero-people.jpg" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1611]/90 via-[#0f1611]/55 to-[#0f1611]/25" />

          <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 lg:px-10 pb-8 pt-24 max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#8DEBD1] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              CareCraftz
            </motion.p>
            <h1
              className="text-white leading-[1.02] mb-3"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
              }}
            >
              Focused to bring you
              <RotatingLine />
            </h1>
            <p className="text-white/75 text-sm leading-snug max-w-md mb-4">
              We verify sellers and curate hard — so every product on CareCraftz earns its place.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-1.5 bg-[#8DEBD1] hover:bg-white text-[#142016] text-[10px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Shop the best <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => navigate('/why-us')}
                className="inline-flex items-center gap-1.5 border border-white/35 text-white text-[10px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                How we verify
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEALS.slice(0, 3).map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <img src={s.icon} alt="" className="w-3.5 h-3.5" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1F331F] py-2 overflow-hidden shrink-0 w-full">
          <motion.div
            className="flex whitespace-nowrap gap-7"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
          >
            {[0, 1].map((loop) => (
              <div key={loop} className="flex gap-7 items-center px-4">
                {MARQUEE.map((item) => (
                  <span
                    key={`${loop}-${item}`}
                    className="inline-flex items-center gap-2 text-[#c8e6cf] text-[11px] font-semibold tracking-wide"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <span className="w-1 h-1 rounded-full bg-[#8DEBD1]" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 2 — how we protect quality */}
      <section className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#fbfcf4]">
        <Fade>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <h2
              className="text-[#142016] leading-tight max-w-xl"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
              }}
            >
              Every seller is checked{' '}
              <span className="italic text-[#2d5a3d]">before a product goes live.</span>
            </h2>
            <p
              className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#3d6b4a]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Our verification
            </p>
          </div>
          <p className="text-[#566057] text-sm max-w-lg mb-4 leading-snug">
            Licenses, lab evidence, and claims get reviewed first — so you never have to guess what’s real.
          </p>
        </Fade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {[
            { src: '/about/video-foam.mp4?v=3', poster: '/about/hero-skincare.jpg', label: 'Clinic care' },
            { src: '/about/video-serum.mp4?v=3', poster: '/about/clip-still-shop.jpg', label: 'Treatment' },
            { src: '/about/video-mask.mp4?v=3', poster: '/about/hero-apply.jpg', label: 'Products' },
          ].map((clip, i) => (
            <Fade key={clip.label} delay={i * 0.06}>
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-[#142016]">
                <LoopVideo src={clip.src} poster={clip.poster} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#142016]/70 via-transparent to-transparent" />
                <span
                  className="absolute bottom-2.5 left-2.5 text-white text-xs font-semibold"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {clip.label}
                </span>
              </div>
            </Fade>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {SEALS.map((s, i) => (
            <Fade key={s.label} delay={i * 0.04}>
              <div className="rounded-xl bg-white border border-[#142016]/08 px-3 py-3 h-full flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#f0f7f1] flex items-center justify-center shrink-0">
                  <img src={s.icon} alt="" className="w-6 h-6" />
                </div>
                <p
                  className="text-xs font-semibold text-[#142016] leading-snug"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {s.label}
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* Section 3 — shopping experience / shelf */}
      <section className="w-full px-4 sm:px-5 lg:px-6 pt-5 pb-0 bg-[#eeecfe]">
        <div className="pb-5">
          <Fade>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
              <h2
                className="text-[#142016] leading-tight max-w-xl"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
                }}
              >
                Then it lands on your shelf —{' '}
                <span className="italic text-[#2d5a3d]">ready to use with confidence.</span>
              </h2>
              <p
                className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#3d6b4a]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Your experience
              </p>
            </div>
            <p className="text-[#566057] text-sm max-w-lg mb-4 leading-snug">
              Browse verified stores, pick what fits your skin, and check out knowing CareCraftz already did the hard part.
            </p>
          </Fade>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {[
              { src: '/about/hero-skincare.jpg', label: 'Expert care' },
              { src: '/about/hero-apply.jpg', label: 'Crafted formulas' },
              { src: '/about/hero-people.jpg', label: 'Daily ritual' },
            ].map((shot, i) => (
              <Fade key={shot.label} delay={i * 0.05}>
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-white">
                  <img
                    src={shot.src}
                    alt={shot.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span
                    className="absolute bottom-2 left-2 rounded-full bg-[#142016]/85 text-white text-[10px] font-semibold px-2.5 py-1"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {shot.label}
                  </span>
                </div>
              </Fade>
            ))}
          </div>

          <Fade delay={0.08}>
            <div className="rounded-xl bg-white/80 border border-[#142016]/08 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p
                  className="text-[#142016] leading-tight"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                  }}
                >
                  Start with something verified today.
                </p>
                <p className="text-[#566057] text-xs">
                  CareCraftz Official and partner stores — same quality bar.
                </p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FF8C69] hover:bg-[#ff7a50] text-[#142016] text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors shrink-0"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Shop now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  )
}
