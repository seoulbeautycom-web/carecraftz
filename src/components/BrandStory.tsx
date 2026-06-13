import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FlaskConical, Leaf, Sparkles, Globe } from 'lucide-react'

export default function BrandStory() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="py-24 bg-cream relative overflow-hidden"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Main Brand Story */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-sage-dark mb-4">
            Our Story
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-charcoal mb-6">
            Crafted with Purpose, <span className="italic text-forest">Powered by Nature</span>
          </h2>
        </motion.div>

        {/* Brand Description for Google Verification */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16 border border-sage/10"
        >
          <p className="text-lg text-charcoal/80 leading-relaxed mb-6">
            <strong>CareCraftz</strong> is a premium e-commerce skincare platform dedicated to bringing you 
            the finest handmade and Korean-inspired beauty products. Founded on decades of expertise in 
            skincare formulation, health, and wellness, our mission is to help people achieve healthy, 
            radiant skin through the power of natural ingredients.
          </p>
          <p className="text-lg text-charcoal/80 leading-relaxed">
            Our secure online shopping platform allows customers to browse our curated collection, 
            add products to their cart, create personalized accounts to track orders and save preferences, 
            and complete purchases through our encrypted checkout system. We use Google Sign-In to provide 
            a seamless, secure authentication experience for our users.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal mb-2">Research Excellence</h3>
            <p className="text-charcoal/60 text-sm leading-relaxed">
              Our skincare research is conducted in Dubai by a team of dedicated experts 
              with decades of experience in dermatology, cosmetic chemistry, and skincare formulation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal mb-2">Natural Ingredients</h3>
            <p className="text-charcoal/60 text-sm leading-relaxed">
              We harness the power of nature's finest ingredients, including Moringa, 
              herbal extracts, and plant-based actives that nourish and protect your skin.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal mb-2">Korean Beauty</h3>
            <p className="text-charcoal/60 text-sm leading-relaxed">
              Inspired by Korean skincare innovations, we combine traditional wisdom 
              with modern science to create effective, gentle formulations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-forest" />
            </div>
            <h3 className="font-serif text-xl font-medium text-charcoal mb-2">Global Standards</h3>
            <p className="text-charcoal/60 text-sm leading-relaxed">
              Our products meet international quality standards, ensuring safety 
              and efficacy for all skin types and concerns.
            </p>
          </motion.div>
        </div>

        {/* Platform Features - For Google Verification */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 pt-16 border-t border-sage/20"
        >
          <h3 className="text-center font-serif text-2xl font-medium text-charcoal mb-8">
            Platform Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-sage/5 rounded-xl">
              <p className="text-charcoal/70 text-sm">
                <strong className="text-charcoal">Secure Authentication:</strong> Sign up and log in 
                securely with email, phone, or your Google account for a seamless shopping experience.
              </p>
            </div>
            <div className="p-6 bg-sage/5 rounded-xl">
              <p className="text-charcoal/70 text-sm">
                <strong className="text-charcoal">Shopping Cart:</strong> Browse our collection, 
                add products to your cart, and manage quantities before checkout.
              </p>
            </div>
            <div className="p-6 bg-sage/5 rounded-xl">
              <p className="text-charcoal/70 text-sm">
                <strong className="text-charcoal">Order Management:</strong> Track your orders, 
                view purchase history, and manage your account preferences securely.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
