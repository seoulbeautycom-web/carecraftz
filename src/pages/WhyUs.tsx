import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Eye, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import PageFrame from '../components/PageFrame'

const ROTATING = ['verified sellers', 'proof before the cart', 'authentic skincare', 'certainty, not guesswork']

const MARQUEE = [
  'Verified sellers',
  'Authentic products',
  'Document review',
  'Selective curation',
  'CareCraftz Official',
  'Trust first',
]

const PILLARS = [
  {
    n: '01',
    title: 'We verify sellers',
    body: 'Licenses, certifications, and lab evidence are reviewed before anything goes live.',
    accent: '#FF8C69',
  },
  {
    n: '02',
    title: 'We curate, not flood',
    body: 'Selective assortment only. If it does not meet our bar, it never reaches your cart.',
    accent: '#8DEBD1',
  },
  {
    n: '03',
    title: 'We make trust visible',
    body: 'Official and Verified badges show who passed — not marketing fluff.',
    accent: '#7EC8E3',
  },
  {
    n: '04',
    title: 'We stand behind it',
    body: 'CareCraftz Official is one verified seller among others. Same standards for every store.',
    accent: '#E8A4E0',
  },
]

const CHECKLIST = [
  { label: 'Business identity & license', icon: ShieldCheck },
  { label: 'Formula safety & testing', icon: FlaskConical },
  { label: 'Claims vs evidence', icon: Eye },
  { label: 'Packaging standards', icon: Sparkles },
  { label: 'Document review complete', icon: BadgeCheck },
]

const CONTRAST = [
  { skip: 'Open marketplace, anyone can list', ours: 'Application + evidence required' },
  { skip: 'Trust the product photo', ours: 'Trust a verified seller record' },
  { skip: 'Mystery sellers at checkout', ours: 'Named, vetted stores on every PDP' },
  { skip: 'Hope it is authentic', ours: 'Checklist completed before approval' },
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
    <span className="relative block h-[1.15em] overflow-hidden" style={{ minWidth: '16ch' }}>
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

function WhyUsInner() {
  const navigate = useNavigate()

  return (
    <div className="bg-[#fbfcf4] w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero + marquee — one laptop fold */}
      <section className="relative w-full md:min-h-[calc(100svh-1.5rem)] md:max-h-[calc(100dvh-1.5rem)] overflow-hidden flex flex-col">
        <div className="relative flex-1 min-h-[360px]">
          <img
            src="/bestseller-lifestyle.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#fbfcf4]/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1611]/90 via-[#0f1611]/55 to-[#0f1611]/25" />

          <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 lg:px-10 pb-6 pt-24 max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#8DEBD1] mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Why CareCraftz
            </motion.p>
            <h1
              className="text-white leading-[1.02] mb-3"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
              }}
            >
              Shop with
              <RotatingLine />
            </h1>
            <p className="text-white/75 text-sm leading-snug max-w-md mb-4">
              We verify every seller. You shop authentic skincare with confidence — not guesswork.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-1.5 bg-[#8DEBD1] hover:bg-white text-[#142016] text-[10px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Shop verified <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => document.getElementById('why-proof')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1.5 border border-white/35 text-white text-[10px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                How we verify
              </button>
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

      {/* Manifesto — compact */}
      <section className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#fbfcf4]">
        <Fade>
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#3d6b4a] mb-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            The CareCraftz difference
          </p>
          <h2
            className="text-[#142016] leading-tight max-w-2xl mb-2"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
            }}
          >
            Most stores sell products.{' '}
            <span className="italic text-[#2d5a3d]">We sell certainty.</span>
          </h2>
          <p className="text-[#566057] text-sm max-w-lg leading-snug">
            Counterfeits and unverified claims flood beauty commerce. CareCraftz exists so you never have to wonder who stands behind what you put on your skin.
          </p>
        </Fade>
      </section>

      {/* Pillars — dense grid */}
      <section className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#142016]">
        <Fade>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <h2
              className="text-white leading-tight"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
              }}
            >
              Four reasons people stay
            </h2>
          </div>
        </Fade>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PILLARS.map((pillar, i) => (
            <Fade key={pillar.n} delay={i * 0.04}>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3.5 h-full">
                <p
                  className="text-[10px] font-bold tracking-[0.2em] mb-1.5"
                  style={{ color: pillar.accent, fontFamily: "'Poppins', sans-serif" }}
                >
                  {pillar.n}
                </p>
                <h3
                  className="text-white text-sm font-semibold leading-snug mb-1"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-white/60 text-xs leading-snug">{pillar.body}</p>
                <div className="mt-3 h-0.5 w-10 rounded-full" style={{ backgroundColor: pillar.accent }} />
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* Proof checklist */}
      <section id="why-proof" className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#fbfcf4]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          <div className="lg:col-span-5">
            <Fade>
              <p
                className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#3d6b4a] mb-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                How verification works
              </p>
              <h2
                className="text-[#142016] leading-tight mb-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
                }}
              >
                Nothing lists{' '}
                <span className="italic text-[#2d5a3d]">until it passes.</span>
              </h2>
              <p className="text-[#566057] text-sm leading-snug mb-3 max-w-md">
                Sellers upload licenses, certifications, and lab reports. Our team completes a structured checklist before a store can go active.
              </p>
              <button
                onClick={() => navigate('/partners')}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#142016] hover:opacity-70"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Become a verified seller <ArrowRight className="w-3 h-3" />
              </button>
            </Fade>
          </div>

          <div className="lg:col-span-7 space-y-1.5">
            {CHECKLIST.map((item, i) => {
              const Icon = item.icon
              return (
                <Fade key={item.label} delay={i * 0.04}>
                  <div className="flex items-center gap-2.5 rounded-xl bg-white border border-[#142016]/08 px-3 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#f0f7f1] text-[#2d5a3d] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold text-[#142016]"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[#696a67]">Required before approval</p>
                    </div>
                    <span className="text-[#1db954] text-sm font-bold">✓</span>
                  </div>
                </Fade>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contrast */}
      <section className="w-full px-4 sm:px-5 lg:px-6 py-5 bg-[#FF8C69]">
        <Fade>
          <h2
            className="text-[#142016] leading-tight mb-3"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
            }}
          >
            Elsewhere vs CareCraftz
          </h2>
        </Fade>
        <div className="hidden sm:grid grid-cols-2 gap-2 mb-1.5 px-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#142016]/55">Typical store</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#142016]">CareCraftz</p>
        </div>
        <div className="space-y-1.5">
          {CONTRAST.map((row, i) => (
            <Fade key={row.ours} delay={i * 0.04}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className="rounded-xl bg-[#142016]/10 px-3 py-2.5 text-[#142016]/65 text-xs line-through decoration-[#142016]/35">
                  {row.skip}
                </div>
                <div className="rounded-xl bg-[#142016] px-3 py-2.5 text-[#8DEBD1] text-xs font-medium">
                  {row.ours}
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="w-full px-4 sm:px-5 lg:px-6 pt-5 pb-0 bg-[#eeecfe]">
        <div className="pb-5">
          <Fade>
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
                  Ready to shop with certainty?
                </p>
                <p className="text-[#566057] text-xs">
                  Curated skincare from verified sellers — including CareCraftz Official.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => navigate('/shop')}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#FF8C69] hover:bg-[#ff7a50] text-[#142016] text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Enter the shop <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center justify-center gap-1.5 border border-[#142016]/20 text-[#142016] text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#142016]/5 transition-colors"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Our story
                </button>
              </div>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  )
}

export default function WhyUs() {
  return (
    <PageFrame frameColor="#7EC8E3">
      <WhyUsInner />
    </PageFrame>
  )
}
