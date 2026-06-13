import { Link } from 'react-router-dom'
import { Leaf, Instagram, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-forest-dark text-ivory/80 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Leaf className="w-5 h-5 text-sage" />
              <span className="font-['ABeeZee',sans-serif] text-xl text-ivory">Care<span className="font-bold">Craftz</span></span>
            </div>
            <p className="text-sm leading-relaxed text-ivory/50 max-w-xs">
              Small-batch handmade soaps, crafted with intention and respect for nature.
            </p>
          </div>

          <div>
            <h4 className="font-['ABeeZee',sans-serif] text-xs font-semibold tracking-[0.2em] uppercase text-ivory/40 mb-4">
              Navigate
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                Home
              </Link>
              <Link to="/about-us" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                About Us
              </Link>
              <Link to="/seoul-beauty" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                Seoul Beauty
              </Link>
              <Link to="/shop" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                Shop
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-['ABeeZee',sans-serif] text-xs font-semibold tracking-[0.2em] uppercase text-ivory/40 mb-4">
              Legal
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/privacy" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="font-['ABeeZee',sans-serif] text-sm text-ivory/60 hover:text-ivory transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-['ABeeZee',sans-serif] text-xs font-semibold tracking-[0.2em] uppercase text-ivory/40 mb-4">
              Connect
            </h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-ivory/10 flex items-center justify-center hover:bg-ivory/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-ivory/10 flex items-center justify-center hover:bg-ivory/20 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-ivory/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-['ABeeZee',sans-serif] text-xs text-ivory/30">
            © 2025 CareCraftz. All rights reserved.
          </p>
          <p className="font-['ABeeZee',sans-serif] text-xs text-ivory/30">
            Handmade with care, always.
          </p>
        </div>
      </div>
    </footer>
  )
}
