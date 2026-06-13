import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { totalItems, setIsCartOpen } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isAboutPage = location.pathname === '/about' || location.pathname === '/about-us'
  const isCraftPage = location.pathname === '/craft'

  const navLinks = [
    { label: 'Craft', href: '/craft', isLink: true },
    { label: 'Experience', href: '#hands' },
    { label: 'About', href: '/about', isLink: true },
    { label: 'Future Launches', href: '/future-launches', isLink: true },
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
            <img src="/cclogo.png" alt="CareCraftz" className="w-[68px] h-12 transition-transform duration-300 group-hover:rotate-12" />
            <span className={`font-['Poppins',sans-serif] text-xl tracking-wide font-bold ${scrolled ? 'text-charcoal' : isAboutPage || isCraftPage ? 'text-white' : 'text-charcoal'}`}>
              Care<span className="font-bold">Craftz</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => {
              if (link.isLink) {
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`font-['Poppins',sans-serif] text-sm font-bold transition-colors duration-300 relative group ${scrolled ? 'text-charcoal/70 hover:text-charcoal' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-sage-dark transition-all duration-300 group-hover:w-full" />
                  </Link>
                )
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`font-['Poppins',sans-serif] text-sm font-bold transition-colors duration-300 relative group ${scrolled ? 'text-charcoal/70 hover:text-charcoal' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-sage-dark transition-all duration-300 group-hover:w-full" />
                </a>
              )
            })}
            <Link
              to="/seoul-beauty"
              className={`font-['Poppins',sans-serif] text-sm font-bold transition-colors duration-300 ${scrolled ? 'text-rose-500 hover:text-rose-600' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
            >
              Seoul Beauty
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative font-['Poppins',sans-serif] inline-flex items-center justify-center p-2.5 transition-colors duration-300 ${scrolled ? 'text-charcoal hover:text-forest' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-charcoal hover:text-forest'}`}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Profile / Sign In Button */}
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className={`font-['Poppins',sans-serif] inline-flex items-center justify-center p-2.5 transition-colors duration-300 ${scrolled ? 'text-charcoal hover:text-forest' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-charcoal hover:text-forest'}`}
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/signin')}
                className={`font-['Poppins',sans-serif] text-sm font-bold px-4 py-2 rounded-full transition-colors duration-300 ${scrolled ? 'bg-black text-white hover:bg-gray-800' : isAboutPage || isCraftPage ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                Sign In
              </button>
            )}

            <Link
              to="/shop"
              className="relative inline-flex items-center justify-center px-5 py-2 bg-forest text-ivory text-sm font-bold rounded-full overflow-hidden group"
            >
              <span className="relative z-10 group-hover:text-forest transition-colors duration-500">Shop Now</span>
              <span className="absolute inset-0 bg-forest w-full group-hover:w-0 transition-all duration-600 ease-out left-0" />
              <span className="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-600 ease-out left-0" />
            </Link>
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
            {navLinks.map((link) => {
              if (link.isLink) {
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`font-['Poppins',sans-serif] text-base font-bold py-2 ${scrolled ? 'text-charcoal/80 hover:text-charcoal' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
                  >
                    {link.label}
                  </Link>
                )
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-['Poppins',sans-serif] text-base font-bold py-2 ${scrolled ? 'text-charcoal/80 hover:text-charcoal' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
                >
                  {link.label}
                </a>
              )
            })}
            <Link
              to="/seoul-beauty"
              onClick={() => setMobileOpen(false)}
              className={`font-['Poppins',sans-serif] text-base font-bold py-2 ${scrolled ? 'text-rose-500 hover:text-rose-600' : isAboutPage || isCraftPage ? 'text-white hover:text-white/80' : 'text-[#1F331F] hover:text-[#1F331F]/80'}`}
            >
              Seoul Beauty
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileOpen(false)}
              className="font-['Poppins',sans-serif] inline-flex items-center justify-center px-6 py-3 bg-forest text-ivory text-sm font-bold rounded-full mt-2"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
