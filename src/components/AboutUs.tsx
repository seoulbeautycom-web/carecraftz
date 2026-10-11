import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, MapPin, ShieldCheck } from 'lucide-react'

const VALUES = [
  {
    title: 'Trust first',
    body: 'Every seller on CareCraftz is reviewed before their products appear. Authenticity is not optional — it is the product.',
  },
  {
    title: 'Curated with care',
    body: 'We are selective on purpose. Fewer brands, higher standards, and an assortment you can browse without second-guessing.',
  },
  {
    title: 'Built for real skin',
    body: 'From Dubai research roots to shoppers across the UAE and Pakistan, we design the experience around what skin actually needs.',
  },
]

const MILESTONES = [
  { label: 'Origins', text: 'Born between the UAE and Pakistan with a simple idea: make trusted skincare easier to find.' },
  { label: 'Verification', text: 'We built a seller review process — licenses, testing evidence, and claims checked before approval.' },
  { label: 'Marketplace', text: 'CareCraftz Official sits alongside verified partners under the same quality bar.' },
  { label: 'Today', text: 'A curated storefront where shoppers buy with certainty, and good brands earn a place through proof.' },
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

export default function AboutUs() {
  const navigate = useNavigate()

  return (
    <div className="bg-[#fbfcf4]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Hero — editorial split, typical of premium skincare About pages */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <Fade>
              <p className="text-xs font-semibold tracking-[0.28em] uppercase text-[#5a7a5a] mb-4">Our story</p>
              <h1
                className="text-[#1a1a1a] leading-[1.05] mb-6"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 'clamp(2.75rem, 6vw, 4.75rem)',
                }}
              >
                Skincare you can
                <br />
                <span className="italic text-[#2d4a2d]">trust to shop.</span>
              </h1>
              <p className="text-[#5a5a5a] text-base md:text-lg leading-relaxed max-w-md mb-8">
                CareCraftz is a curated skincare marketplace. We verify sellers, protect authenticity, and make it simple to find products that care for your skin — and your confidence.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/shop')}
                  className="inline-flex items-center gap-2 bg-[#1F331F] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full transition-colors"
                >
                  Shop the collection <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/why-us')}
                  className="inline-flex items-center gap-2 border border-[#1F331F]/20 text-[#1F331F] text-xs font-semibold uppercase tracking-wider px-7 py-3.5 rounded-full hover:bg-[#1F331F]/5 transition-colors"
                >
                  Why CareCraftz
                </button>
              </div>
            </Fade>
          </div>

          <Fade delay={0.12}>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-[#e8efe4]">
                <img
                  src="/bestseller-lifestyle.png"
                  alt="CareCraftz skincare"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -left-3 sm:left-6 bg-white rounded-2xl px-5 py-4 shadow-lg max-w-[220px] border border-black/5">
                <div className="flex items-center gap-2 text-[#1F331F] mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">UAE · Pakistan</span>
                </div>
                <p className="text-sm text-[#696a67] leading-snug">Rooted in two markets. Built for shoppers who want proof, not promises.</p>
              </div>
            </div>
          </Fade>
        </div>
      </section>

      {/* Origin narrative */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 md:py-28 border-t border-[#1a1a1a]/06">
        <div className="max-w-3xl mx-auto text-center">
          <Fade>
            <p className="text-xs font-semibold tracking-[0.28em] uppercase text-[#5a7a5a] mb-4">How we began</p>
            <h2
              className="text-[#1a1a1a] leading-[1.15] mb-8"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
              }}
            >
              Beauty commerce was full of noise. We built a quieter, safer way to buy.
            </h2>
            <p className="text-[#5a5a5a] text-base md:text-lg leading-relaxed mb-6">
              Too many shoppers were left guessing — Is this authentic? Who stands behind this formula? CareCraftz started as an answer to that doubt: a platform where verification happens before the first listing, not after a disappointed return.
            </p>
            <p className="text-[#5a5a5a] text-base md:text-lg leading-relaxed">
              Today we curate trusted skincare for the UAE and Pakistan, with CareCraftz Official as one verified seller among partners who meet the same standards. Our job is the heavy lifting. Yours is simply to choose what feels right for your skin.
            </p>
          </Fade>
        </div>
      </section>

      {/* Image band */}
      <section className="px-6 sm:px-10 lg:px-16 pb-6">
        <Fade>
          <div className="max-w-6xl mx-auto rounded-[2rem] overflow-hidden aspect-[21/9] min-h-[220px] bg-[#e8efe4]">
            <img
              src="/herosec.png"
              alt="CareCraftz products"
              className="w-full h-full object-cover"
            />
          </div>
        </Fade>
      </section>

      {/* Values */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <Fade>
            <p className="text-xs font-semibold tracking-[0.28em] uppercase text-[#5a7a5a] mb-3">What we believe</p>
            <h2
              className="text-[#1a1a1a] mb-12 max-w-xl leading-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(1.85rem, 3.5vw, 2.75rem)',
              }}
            >
              Principles that shape every listing
            </h2>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {VALUES.map((value, i) => (
              <Fade key={value.title} delay={i * 0.08}>
                <div className="border-t border-[#1a1a1a]/15 pt-6">
                  <h3
                    className="text-[#1a1a1a] mb-3"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.65rem' }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-[#5a5a5a] text-sm leading-relaxed">{value.body}</p>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* Split: mission + proof */}
      <section className="px-6 sm:px-10 lg:px-16 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Fade>
            <div className="h-full rounded-[2rem] bg-[#1F331F] text-white p-8 md:p-12 flex flex-col justify-between min-h-[320px]">
              <div>
                <ShieldCheck className="w-8 h-8 text-[#8DEBD1] mb-6" />
                <h2
                  className="leading-tight mb-4"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  }}
                >
                  Our mission
                </h2>
                <p className="text-white/70 leading-relaxed max-w-md">
                  Make authentic skincare the default — by verifying sellers, clarifying who you buy from, and giving good brands a place worthy of their craft.
                </p>
              </div>
              <button
                onClick={() => navigate('/why-us')}
                className="mt-10 self-start inline-flex items-center gap-2 text-sm font-semibold text-[#8DEBD1] hover:text-white transition-colors"
              >
                See how we verify <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Fade>
          <Fade delay={0.1}>
            <div className="h-full rounded-[2rem] bg-[#e8efe4] p-8 md:p-12 flex flex-col justify-between min-h-[320px]">
              <div>
                <Heart className="w-8 h-8 text-[#1F331F] mb-6" />
                <h2
                  className="text-[#1a1a1a] leading-tight mb-4"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  }}
                >
                  Who we serve
                </h2>
                <p className="text-[#5a5a5a] leading-relaxed max-w-md">
                  Shoppers who want natural, researched, and authentic care — and partner brands ready to meet a real quality bar before they sell.
                </p>
              </div>
              <button
                onClick={() => navigate('/partners')}
                className="mt-10 self-start inline-flex items-center gap-2 text-sm font-semibold text-[#1F331F] hover:opacity-70 transition-opacity"
              >
                Partner with us <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Fade>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 md:py-28 bg-[#f0f4ec]">
        <div className="max-w-4xl mx-auto">
          <Fade>
            <p className="text-xs font-semibold tracking-[0.28em] uppercase text-[#5a7a5a] mb-3 text-center">The path</p>
            <h2
              className="text-[#1a1a1a] text-center mb-14 leading-tight"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(1.85rem, 3.5vw, 2.75rem)',
              }}
            >
              From idea to marketplace
            </h2>
          </Fade>
          <div className="space-y-0">
            {MILESTONES.map((item, i) => (
              <Fade key={item.label} delay={i * 0.06}>
                <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[120px_1fr] gap-4 sm:gap-8 py-6 border-t border-[#1a1a1a]/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5a7a5a] pt-1">{item.label}</p>
                  <p className="text-[#1a1a1a] text-base md:text-lg leading-relaxed">{item.text}</p>
                </div>
              </Fade>
            ))}
            <div className="border-t border-[#1a1a1a]/10" />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 md:py-28">
        <Fade>
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-[#1a1a1a] leading-tight mb-5"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              }}
            >
              Ready to meet better skincare?
            </h2>
            <p className="text-[#5a5a5a] text-lg mb-10 max-w-xl mx-auto">
              Explore verified sellers and CareCraftz Official — curated for skin that deserves certainty.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 bg-[#FF8C69] hover:bg-[#ff7a50] text-[#1a1a1a] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
            >
              Shop now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Fade>
      </section>
    </div>
  )
}
