import { motion } from 'framer-motion'
import { Heart, Globe, Users, Award } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 via-green-50 to-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-sage-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 rounded-full blur-3xl" />
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
            <Heart className="w-16 h-16 text-sage-600 mx-auto" />
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-sage-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            About Us
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light">
            Our Story, Our Mission
          </p>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Founded with a passion for natural skincare and sustainable living, we're dedicated to bringing you 
            the finest handmade products that nurture both your skin and the planet.
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
          >
            Our Story
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6"
          >
            <p>
              What started as a small kitchen experiment has grown into a passionate mission to create 
              skincare products that are as kind to the earth as they are to your skin. Our founder, 
              inspired by traditional Korean beauty secrets and natural ingredients, began crafting 
              small batches of soap using only the finest organic materials.
            </p>
            <p>
              Every product we create is a labor of love, handcrafted with intention and care. We believe 
              that skincare should be a ritual—a moment of self-care that connects you with nature and 
              nourishes your soul.
            </p>
            <p>
              Today, we continue to honor those original values while expanding our reach to bring 
              premium Korean skincare and handmade soaps to conscious consumers worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-sage-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
          >
            Our Values
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: 'Sustainability',
                description: 'Eco-friendly packaging and responsibly sourced ingredients'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Supporting local artisans and fair trade practices'
              },
              {
                icon: Award,
                title: 'Quality',
                description: 'Premium ingredients and meticulous craftsmanship'
              },
              {
                icon: Heart,
                title: 'Wellness',
                description: 'Products that promote holistic health and self-care'
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-sage-50 to-green-50 hover:shadow-xl transition-shadow"
              >
                <value.icon className="w-12 h-12 text-sage-600 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 bg-sage-600">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-sage-100 mb-8 leading-relaxed">
            To create exceptional skincare products that honor traditional wisdom while embracing 
            modern innovation—always with respect for people, planet, and the power of nature.
          </p>
          <p className="text-lg text-sage-200">
            Every product we make carries this promise: pure ingredients, ethical practices, 
            and genuine care for your well-being.
          </p>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-8 text-gray-800"
          >
            Get In Touch
          </motion.h2>
          <p className="text-lg text-gray-600 mb-12">
            Have questions or want to learn more? We'd love to hear from you.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-sage-600 text-white rounded-full font-semibold text-lg shadow-lg hover:bg-sage-700 transition-colors"
          >
            Contact Us
          </motion.button>
        </div>
      </section>
    </div>
  )
}
