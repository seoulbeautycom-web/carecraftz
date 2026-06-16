export default function SiteFooter() {
  return (
    <footer className="bg-[#eeecfe] px-6 py-10 mt-8 flex-shrink-0">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-bold text-[#2b2b2b] text-base mb-2">CareCraftz</h3>
          <p className="text-[#696a67] text-sm">Premium handmade and Korean-inspired skincare, crafted with care in Dubai.</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#2b2b2b] text-sm mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-[#696a67]">
            <li><a href="/shop" className="hover:text-[#2b2b2b] transition-colors">All Products</a></li>
            <li><a href="/shop" className="hover:text-[#2b2b2b] transition-colors">Bestsellers</a></li>
            <li><a href="/blog" className="hover:text-[#2b2b2b] transition-colors">Journal</a></li>
            <li><a href="/future-launches" className="hover:text-[#2b2b2b] transition-colors">Future Launches</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[#2b2b2b] text-sm mb-3">Help</h4>
          <ul className="space-y-2 text-sm text-[#696a67]">
            <li><a href="/refill" className="hover:text-[#2b2b2b] transition-colors">Refill Program</a></li>
            <li><a href="/partners" className="hover:text-[#2b2b2b] transition-colors">Partners</a></li>
            <li><a href="/privacy" className="hover:text-[#2b2b2b] transition-colors">Privacy</a></li>
            <li><a href="/terms" className="hover:text-[#2b2b2b] transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-[#2b2b2b]/10 text-center text-xs text-[#696a67]">
        © 2025 CareCraftz. All rights reserved.
      </div>
    </footer>
  )
}
