import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Menu, X, ShoppingCart } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Craft', href: '#craft' },
    { label: 'Experience', href: '#hands' },
    { label: 'Shop', href: '#shop' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-[0_1px_0_rgba(31,42,31,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/cclogo.png" alt="CareCraftz" className="w-10 h-10 transition-transform duration-300 group-hover:rotate-12" />
            <span className="font-['Poppins',sans-serif] text-xl text-charcoal tracking-wide font-bold">
              Care<span className="font-bold">Craftz</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-['Poppins',sans-serif] text-sm font-bold transition-colors duration-300 relative group ${scrolled ? 'text-charcoal/70 hover:text-charcoal' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-sage-dark transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <Link
              to="/seoul-beauty"
              className={`font-['Poppins',sans-serif] text-sm font-bold transition-colors duration-300 ${scrolled ? 'text-rose-500 hover:text-rose-600' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
            >
              Seoul Beauty
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="font-['Poppins',sans-serif] inline-flex items-center justify-center p-2.5 text-charcoal hover:text-forest transition-colors duration-300">
              <ShoppingCart className="w-5 h-5" />
            </button>
            <a
              href="#shop"
              className="font-['Poppins',sans-serif] inline-flex items-center px-5 py-2 bg-forest text-ivory text-sm font-bold rounded-full hover:bg-forest-dark transition-colors duration-300"
            >
              Shop Now
            </a>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-cream/95 backdrop-blur-md border-t border-warm/50"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-['Poppins',sans-serif] text-base font-bold py-2 ${scrolled ? 'text-charcoal/80 hover:text-charcoal' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/seoul-beauty"
              onClick={() => setMobileOpen(false)}
              className={`font-['Poppins',sans-serif] text-base font-bold py-2 ${scrolled ? 'text-rose-500 hover:text-rose-600' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
            >
              Seoul Beauty
            </Link>
            <a
              href="#shop"
              onClick={() => setMobileOpen(false)}
              className="font-['Poppins',sans-serif] inline-flex items-center justify-center px-6 py-3 bg-forest text-ivory text-sm font-bold rounded-full mt-2"
            >
              Shop Now
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
