import { useState, useEffect } from 'react'
import { User, ShoppingBag, Menu, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

const NAV_ITEMS = [
  { label: 'Shop',            path: '/shop',           activeColor: 'bg-[#ffb347] text-white',  hoverColor: 'hover:bg-[#ffb347]/20' },
  { label: 'Who We Are',      path: '/craft',          activeColor: 'bg-[#a78bfa] text-white',  hoverColor: 'hover:bg-[#a78bfa]/20' },
  { label: 'Blog',            path: '/blog',           activeColor: 'bg-[#34d399] text-white',  hoverColor: 'hover:bg-[#34d399]/20' },
  { label: 'Future Launches', path: '/future-launches', activeColor: 'bg-[#f87171] text-white',  hoverColor: 'hover:bg-[#f87171]/20' },
  { label: 'Refill Program',  path: '/refill',         activeColor: 'bg-[#60a5fa] text-white',  hoverColor: 'hover:bg-[#60a5fa]/20' },
  { label: 'Partners',        path: '/partners',       activeColor: 'bg-[#f472b6] text-white',  hoverColor: 'hover:bg-[#f472b6]/20' },
]

export default function NewHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const pillBase = scrolled
    ? 'bg-white/50 backdrop-blur-md border border-white/30 shadow-sm'
    : 'bg-white border border-gray-200 shadow-md'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 font-['Poppins'] transition-all duration-300">
      <div className="flex items-center justify-between gap-3 mx-auto max-w-[92%] mt-4">

        {/* Logo Pill */}
        <button
          onClick={() => navigate('/')}
          className={`flex-shrink-0 ${pillBase} rounded-full px-4 py-2 flex items-center gap-2.5 transition-all duration-300`}
        >
          <img src="/logo-icon.png" alt="CareCraftz" className="h-7 w-auto" />
          <span className="text-sm font-semibold text-[#2b2b2b] whitespace-nowrap">Care Craftz</span>
        </button>

        {/* Main Nav Outer Pill — desktop only */}
        <nav className={`hidden md:flex ${pillBase} rounded-full px-2 py-2 items-center justify-between gap-1 transition-all duration-300`} style={{width: 'min(640px, 55%)'}}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 text-center text-sm font-medium rounded-full px-3 py-1.5 transition-all whitespace-nowrap ${
                  active
                    ? item.activeColor + ' shadow-sm'
                    : 'text-[#2b2b2b] ' + item.hoverColor
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Utility Icons Pill */}
        <div className={`flex-shrink-0 ${pillBase} rounded-full px-3 py-2 flex items-center gap-1 transition-all duration-300`}>
          <button
            onClick={() => navigate('/profile')}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
          >
            <User className="w-5 h-5 text-[#2b2b2b]" />
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors relative"
          >
            <ShoppingBag className="w-5 h-5 text-[#2b2b2b]" />
            {items.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff6b6b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 hover:bg-black/5 rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden mt-2 ${pillBase} rounded-2xl p-3 space-y-1`}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false) }}
                className={`block w-full text-left py-2 px-4 text-sm font-medium rounded-full transition-colors ${
                  active ? item.activeColor : 'text-[#2b2b2b] hover:bg-black/5'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
