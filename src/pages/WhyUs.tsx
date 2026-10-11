import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionTemplate,
} from 'framer-motion'
import { ArrowRight, BadgeCheck, Eye, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react'
import PageFrame from '../components/PageFrame'
import { usePageShell } from '../contexts/PageShellContext'

const PILLARS = [
  {
    n: '01',
    title: 'We verify sellers',
    body: 'Business licenses, certifications, and lab evidence are reviewed before anything goes live.',
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
    body: 'Official and Verified Seller badges show you who passed our checklist — not marketing fluff.',
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

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function WhyUsInner() {
  const navigate = useNavigate()
  const { scrollRef } = usePageShell()
  const heroRef = useRef<HTMLElement>(null)
  const pillarsRef = useRef<HTMLElement>(null)

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    container: scrollRef,
    offset: ['start start', 'end start'],
  })

  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.12])
  const heroOpacity = useTransform(heroProgress, [0, 0.85], [1, 0.35])
  const heroY = useTransform(heroProgress, [0, 1], ['0%', '12%'])
  const titleY = useTransform(heroProgress, [0, 1], [0, 80])

  const { scrollYProgress: pillarsProgress } = useScroll({
    target: pillarsRef,
    container: scrollRef,
    offset: ['start end', 'end start'],
  })
  const pillarsX = useTransform(pillarsProgress, [0, 1], ['4%', '-18%'])
  const glow = useTransform(pillarsProgress, [0, 0.5, 1], [0.2, 0.55, 0.25])
  const glowFilter = useMotionTemplate`blur(${useTransform(glow, (v) => 40 + v * 40)}px)`

  return (
    <div className="overflow-x-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale, y: heroY, opacity: heroOpacity }}>
          <img
            src="/bestseller-lifestyle.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1410] via-[#0f1410]/55 to-[#0f1410]/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,140,105,0.35),transparent_55%)]" />
        </motion.div>

        <motion.div
          className="relative z-10 w-full px-6 sm:px-10 lg:px-16 pb-16 md:pb-20 pt-32"
          style={{ y: titleY }}
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[#FF8C69] text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase mb-5"
          >
            CareCraftz
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-white max-w-4xl leading-[0.95] mb-6"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(3.2rem, 9vw, 7rem)',
            }}
          >
            Why buy
            <br />
            <span className="italic text-[#8DEBD1]">anywhere else?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/75 text-base sm:text-lg max-w-md mb-8 leading-relaxed"
          >
            We verify every seller. You shop authentic skincare with confidence — not guesswork.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-wrap gap-3"
          >
            <button
              onClick={() => navigate('/shop')}
              className="group inline-flex items-center gap-2 bg-[#FF8C69] hover:bg-[#ff7a50] text-[#1a1a1a] text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-full transition-colors"
            >
              Shop verified
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => {
                const target = document.getElementById('why-proof')
                const shell = scrollRef.current
                if (!target || !shell) return
                const top = target.getBoundingClientRect().top - shell.getBoundingClientRect().top + shell.scrollTop - 24
                shell.scrollTo({ top, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 border border-white/30 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              See how we verify
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-6 right-6 md:right-12 text-white/40 text-[10px] tracking-[0.3em] uppercase hidden sm:block"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Scroll
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <section className="bg-[#1a1a1a] py-4 overflow-hidden border-y border-white/5">
        <motion.div
          className="flex whitespace-nowrap gap-10"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
        >
          {[...Array(2)].map((_, loop) => (
            <div key={loop} className="flex gap-10 items-center">
              {['Verified sellers', 'Authentic products', 'Document review', 'Selective curation', 'CareCraftz Official', 'Trust first'].map((item) => (
                <span key={`${loop}-${item}`} className="inline-flex items-center gap-3 text-[#8DEBD1] text-sm font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C69]" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="px-6 sm:px-10 lg:px-16 py-24 md:py-32 bg-[#fbfcf4]">
        <Reveal>
          <p className="text-[#FF8C69] text-xs font-bold tracking-[0.3em] uppercase mb-4">The CareCraftz difference</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            className="text-[#1a1a1a] max-w-4xl leading-[1.05] mb-8"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)',
            }}
          >
            Most stores sell products.
            <br />
            <span className="italic text-[#2b2b2b]/70">We sell certainty.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[#696a67] text-lg max-w-2xl leading-relaxed">
            Counterfeits and unverified claims flood beauty commerce. CareCraftz exists so you never have to wonder
            who stands behind what you put on your skin.
          </p>
        </Reveal>
      </section>

      {/* ── PILLARS HORIZONTAL ── */}
      <section ref={pillarsRef} className="relative bg-[#121612] py-20 md:py-28 overflow-hidden">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/3 w-[420px] h-[420px] rounded-full bg-[#FF8C69]/30"
          style={{ filter: glowFilter, opacity: glow }}
        />
        <div className="px-6 sm:px-10 lg:px-16 mb-10">
          <Reveal>
            <h2
              className="text-white leading-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              }}
            >
              Four reasons people stay
            </h2>
          </Reveal>
        </div>
        <motion.div style={{ x: pillarsX }} className="flex gap-5 px-6 sm:px-10 w-max">
          {PILLARS.map((pillar, i) => (
            <motion.article
              key={pillar.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8 }}
              className="w-[280px] sm:w-[320px] rounded-[2rem] p-7 sm:p-8 border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              <span className="text-xs font-bold tracking-[0.25em]" style={{ color: pillar.accent }}>
                {pillar.n}
              </span>
              <h3
                className="text-white mt-4 mb-3 leading-tight"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.85rem' }}
              >
                {pillar.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{pillar.body}</p>
              <div className="mt-8 h-1 w-16 rounded-full" style={{ backgroundColor: pillar.accent }} />
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ── PROOF / CHECKLIST ── */}
      <section id="why-proof" className="px-6 sm:px-10 lg:px-16 py-24 md:py-32 bg-[#fbfcf4]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[#FF8C69] text-xs font-bold tracking-[0.3em] uppercase mb-4">How verification works</p>
              <h2
                className="text-[#1a1a1a] leading-[1.05] mb-5"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
                }}
              >
                Nothing lists
                <br />
                <span className="italic">until it passes.</span>
              </h2>
              <p className="text-[#696a67] leading-relaxed mb-8">
                Sellers upload licenses, certifications, and lab reports. Our team completes a structured checklist
                before a store can go active on CareCraftz.
              </p>
              <button
                onClick={() => navigate('/partners')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] underline underline-offset-4 decoration-[#FF8C69] hover:decoration-2"
              >
                Become a verified seller <ArrowRight className="w-4 h-4" />
              </button>
            </Reveal>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {CHECKLIST.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-center gap-4 rounded-2xl bg-white border border-[#1a1a1a]/08 px-5 py-4 shadow-[4px_4px_0_0_#1a1a1a14] hover:shadow-[6px_6px_0_0_#FF8C6933] hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] text-[#8DEBD1] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF8C69] group-hover:text-[#1a1a1a] transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1a1a1a] font-semibold text-sm sm:text-base">{item.label}</p>
                    <p className="text-[#696a67] text-xs mt-0.5">Required before approval</p>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + i * 0.1, type: 'spring', stiffness: 260, damping: 16 }}
                    className="text-[#1db954] font-bold text-lg"
                  >
                    ✓
                  </motion.span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CONTRAST ── */}
      <section className="px-6 sm:px-10 lg:px-16 py-24 md:py-28 bg-[#FF8C69]">
        <Reveal>
          <h2
            className="text-[#1a1a1a] text-center mb-14 leading-tight"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            }}
          >
            Elsewhere vs CareCraftz
          </h2>
        </Reveal>
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="hidden sm:grid grid-cols-2 gap-3 mb-2 px-2">
            <p className="text-[#1a1a1a]/60 text-xs font-bold uppercase tracking-widest">Typical store</p>
            <p className="text-[#1a1a1a] text-xs font-bold uppercase tracking-widest">CareCraftz</p>
          </div>
          {CONTRAST.map((row, i) => (
            <motion.div
              key={row.ours}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div className="rounded-2xl bg-[#1a1a1a]/10 px-5 py-4 text-[#1a1a1a]/70 text-sm line-through decoration-[#1a1a1a]/40">
                {row.skip}
              </div>
              <div className="rounded-2xl bg-[#1a1a1a] px-5 py-4 text-[#8DEBD1] text-sm font-medium">
                {row.ours}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── VISUAL BREAK ── */}
      <section className="relative min-h-[55vh] overflow-hidden">
        <img src="/herosec.png" alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#0f1410]/70" />
        <div className="relative z-10 min-h-[55vh] flex flex-col items-center justify-center text-center px-6">
          <Reveal>
            <p
              className="text-white max-w-3xl leading-[1.1]"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2rem, 5vw, 3.75rem)',
              }}
            >
              Your skin deserves a marketplace that did the homework.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 sm:px-10 lg:px-16 py-24 md:py-32 bg-[#fbfcf4]">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2
              className="text-[#1a1a1a] leading-[1.05] mb-5"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              }}
            >
              Ready to shop with certainty?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[#696a67] text-lg mb-10 max-w-xl mx-auto">
              Browse curated skincare from verified sellers — including CareCraftz Official.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/shop')}
                className="group inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
              >
                Enter the shop
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2 border border-[#1a1a1a]/20 text-[#1a1a1a] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#1a1a1a]/5 transition-colors"
              >
                Our story
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default function WhyUs() {
  return (
    <PageFrame frameColor="#1F2A24">
      <WhyUsInner />
    </PageFrame>
  )
}
