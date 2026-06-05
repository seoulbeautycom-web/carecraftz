import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cream"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="text-center lg:text-left"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-sage-dark mb-8"
          >
            Small-Batch Handmade Soap
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-charcoal leading-[1.1] mb-8"
          >
            Handcrafted.
            <br />
            <span className="italic text-forest">Pure.</span> Yours.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-charcoal/60 max-w-md mx-auto lg:mx-0 leading-relaxed mb-12"
          >
            Each bar is made by hand in small batches, infused with the nourishing
            essence of Moringa — nature's gift to your skin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link
              to="/shop"
              className="relative inline-flex items-center justify-center px-8 py-4 bg-forest text-ivory font-medium rounded-full overflow-hidden group"
            >
              <span className="relative z-10 group-hover:text-forest transition-colors duration-500">Discover the Soap</span>
              <span className="absolute inset-0 bg-forest w-full group-hover:w-0 transition-all duration-600 ease-out left-0" />
              <span className="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-600 ease-out left-0" />
            </Link>
            <a
              href="#craft"
              className="relative inline-flex items-center justify-center px-8 py-4 border border-charcoal/20 text-charcoal font-medium rounded-full overflow-hidden group"
            >
              <span className="relative z-10 group-hover:text-ivory transition-colors duration-500">See the Craft</span>
              <span className="absolute inset-0 bg-white w-full group-hover:w-0 transition-all duration-600 ease-out left-0" />
              <span className="absolute inset-0 bg-forest w-0 group-hover:w-full transition-all duration-600 ease-out left-0" />
            </a>
          </motion.div>
        </motion.div>

        <div className="hidden lg:block" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.a
          href="#craft"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.a>
      </motion.div>

      <style>{`
        .btn-overlay {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 0.6s ease-out;
        }
        .group:hover .btn-overlay {
          clip-path: inset(0 0 0 0);
        }
      `}</style>
    </section>
  )
}
