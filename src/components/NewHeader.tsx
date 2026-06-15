import { useState } from 'react'
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

export default function NewHeader() {
  const navigate = useNavigate()
  const { items } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Shop', path: '/shop' },
    { label: 'Who We Are', path: '/craft' },
    { label: 'Blog', path: '/blog' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Refill Program', path: '/refill' },
    { label: 'Rewards Program', path: '/rewards' },
  ]

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="flex items-center justify-between gap-4">
        {/* Main Nav - Lavender Pill */}
        <nav className="flex-1 bg-[#eeecfe] rounded-full px-6 py-3 flex items-center justify-between">
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="text-sm font-medium text-[#2b2b2b] hover:text-[#ff9570] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Utility Icons - Green Pill */}
        <div className="bg-[#d4f5d4] rounded-full px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="p-1.5 hover:bg-white/50 rounded-full transition-colors"
          >
            <User className="w-5 h-5 text-[#2b2b2b]" />
          </button>
          <button className="p-1.5 hover:bg-white/50 rounded-full transition-colors">
            <Search className="w-5 h-5 text-[#2b2b2b]" />
          </button>
          <button 
            onClick={() => navigate('/cart')}
            className="p-1.5 hover:bg-white/50 rounded-full transition-colors relative"
          >
            <ShoppingBag className="w-5 h-5 text-[#2b2b2b]" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff6b6b] text-white text-xs rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-[#eeecfe] rounded-2xl p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left py-2 px-3 text-sm font-medium text-[#2b2b2b] hover:bg-white/50 rounded-lg transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
