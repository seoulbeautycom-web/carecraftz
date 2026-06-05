import { motion } from 'framer-motion'
import { Sparkles, Droplet, Shield, Heart } from 'lucide-react'

export default function SeoulBeauty() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-pink-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-200 rounded-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8 inline-block"
          >
            <Sparkles className="w-16 h-16 text-rose-400 mx-auto" />
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Seoul Beauty
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light">
            Premium Korean Skincare
          </p>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover the secret to flawless skin with our curated collection of authentic Korean beauty products. 
            Transform your routine with nature-inspired formulas backed by centuries of skincare wisdom.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            Explore Collection
          </motion.button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
          >
            Why Choose Seoul Beauty?
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Droplet,
                title: 'Deep Hydration',
                description: 'Formulas designed to penetrate deep into skin layers for lasting moisture'
              },
              {
                icon: Shield,
                title: 'Natural Protection',
                description: 'Antioxidant-rich ingredients that shield your skin from environmental stress'
              },
              {
                icon: Heart,
                title: 'Gentle Care',
                description: 'pH-balanced products perfect for even the most sensitive skin types'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 hover:shadow-xl transition-shadow"
              >
                <feature.icon className="w-12 h-12 text-rose-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-rose-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
          >
            Featured Products
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Essence Serum', price: '$45', tag: 'Bestseller' },
              { name: 'Hydrating Toner', price: '$32', tag: 'New' },
              { name: 'Night Cream', price: '$58', tag: 'Popular' },
              { name: 'Sheet Mask Set', price: '$28', tag: 'Value' }
            ].map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="aspect-square bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl mb-4 flex items-center justify-center">
                  <Droplet className="w-16 h-16 text-rose-300" />
                </div>
                <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded-full mb-2">
                  {product.tag}
                </span>
                <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                <p className="text-rose-600 font-bold">{product.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-rose-500 to-pink-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your K-Beauty Journey Today
          </h2>
          <p className="text-xl text-rose-100 mb-8">
            Join thousands who have transformed their skincare routine with Seoul Beauty
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-rose-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            Shop Now
          </motion.button>
        </motion.div>
      </section>
    </div>
  )
}
