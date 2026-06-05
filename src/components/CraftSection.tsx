import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Droplets, ThermometerSun, Clock, Heart } from 'lucide-react'

const processSteps = [
  {
    icon: Droplets,
    title: 'Cold-Pressed Oils',
    description: 'Premium coconut and olive oils, carefully sourced and cold-pressed to retain every nutrient.',
  },
  {
    icon: ThermometerSun,
    title: 'Gentle Saponification',
    description: 'Low-temperature process that preserves the delicate Moringa properties.',
  },
  {
    icon: Clock,
    title: 'Six-Week Cure',
    description: 'Each bar rests for 42 days, allowing water to evaporate and the soap to harden naturally.',
  },
  {
    icon: Heart,
    title: 'Hand-Finished',
    description: 'Every bar is beveled, stamped, and inspected by hand before it reaches you.',
  },
]

export default function CraftSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="craft"
      ref={ref}
      className="relative min-h-screen flex items-center bg-cream py-32 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="hidden lg:block" />

          <div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-sage-dark mb-6"
            >
              The Craft
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 1, ease: [0.4, 0, 0.2, 1] }}
              className="font-serif text-4xl md:text-5xl font-medium text-charcoal leading-tight mb-8"
            >
              Made slowly,
              <br />
              <span className="italic">with intention.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg text-charcoal/60 leading-relaxed mb-16 max-w-lg"
            >
              We believe the best things cannot be rushed. Each batch is small,
              deliberate, and guided by the rhythm of natural ingredients.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    delay: 0.6 + index * 0.15,
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sage-light/50 flex items-center justify-center group-hover:bg-sage-light transition-colors duration-300">
                      <step.icon className="w-5 h-5 text-forest" />
                    </div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-sage-dark">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-medium text-charcoal text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-charcoal/50 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
