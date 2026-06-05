import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check, Star } from 'lucide-react'

const trustSignals = [
  'Handmade in small batches',
  'Natural ingredients',
  'No harsh chemicals',
  'Cruelty-free',
]

export default function ShopSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <section
      id="shop"
      ref={ref}
      className="relative min-h-screen flex items-center bg-cream py-32 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
      
      <div className="absolute inset-0">
        <img
          src="/sec4.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-cream/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-sage-dark mb-6"
          >
            Bring It Home
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="font-serif text-4xl md:text-5xl font-medium text-charcoal leading-tight mb-6"
          >
            Your daily moment
            <br />
            <span className="italic">of calm.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-charcoal/60 leading-relaxed"
          >
            One perfect bar. No overwhelming choices. Just the care your skin deserves.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-ivory rounded-3xl p-8 md:p-12 shadow-[0_4px_60px_rgba(31,42,31,0.08)] border border-warm/30">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-1/2">
                <motion.div
                  whileHover={{ scale: 1.03, rotateY: 5 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="perspective-1000"
                >
                  <img
                    src="/1.png"
                    alt="CareCraftz Moringa Soap"
                    className="w-full h-auto max-w-[280px] mx-auto drop-shadow-xl"
                  />
                </motion.div>
              </div>

              <div className="w-full md:w-1/2 text-center md:text-left">
                <div className="flex items-center gap-1 justify-center md:justify-start mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-sage-dark text-sage-dark" />
                  ))}
                  <span className="text-xs text-charcoal/40 ml-2">127 reviews</span>
                </div>

                <h3 className="font-serif text-2xl font-medium text-charcoal mb-2">
                  Moringa Handmade Soap
                </h3>
                <p className="text-sm text-charcoal/50 mb-6">
                  50g
                </p>

                <div className="flex items-baseline gap-3 justify-center md:justify-start mb-8">
                  <span className="font-serif text-4xl font-medium text-charcoal">$14</span>
                  <span className="text-charcoal/30 line-through">$18</span>
                </div>

                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-sage-dark text-ivory'
                      : 'bg-forest text-ivory hover:bg-forest-dark hover:shadow-lg hover:shadow-forest/20'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Added to Cart
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-warm/30">
              <div className="grid grid-cols-2 gap-4">
                {trustSignals.map((signal, index) => (
                  <motion.div
                    key={signal}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2 text-sm text-charcoal/60"
                  >
                    <Check className="w-4 h-4 text-sage-dark shrink-0" />
                    {signal}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
