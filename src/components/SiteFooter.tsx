import { useStorefrontIdentity } from '../contexts/StorefrontIdentityContext'
import { LOCATION_META } from '../lib/storeSettings'

export default function SiteFooter() {
  const { store, socialLinks, emailDisplay, phoneDisplay } = useStorefrontIdentity()
  const locationLabel = LOCATION_META[store.location_code].label
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#eeecfe] px-6 sm:px-8 lg:px-10 py-10 mt-0 flex-shrink-0 w-full">
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-bold text-[#2b2b2b] text-base mb-2">{store.name}</h3>
          <p className="text-[#696a67] text-sm">{store.tagline}</p>
          <div className="mt-3 space-y-1 text-sm text-[#696a67]">
            {emailDisplay ? <p>{emailDisplay}</p> : null}
            {phoneDisplay ? <p>{phoneDisplay}</p> : null}
            <p>{locationLabel}</p>
          </div>
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#2b2b2b] hover:underline capitalize"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          ) : null}
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
            <li><a href="/why-us" className="hover:text-[#2b2b2b] transition-colors">Why Us</a></li>
            <li><a href="/partners" className="hover:text-[#2b2b2b] transition-colors">Partners</a></li>
            <li><a href="/privacy" className="hover:text-[#2b2b2b] transition-colors">Privacy</a></li>
            <li><a href="/terms" className="hover:text-[#2b2b2b] transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-[#2b2b2b]/10 text-center text-xs text-[#696a67]">
        © {year} {store.name}. All rights reserved.
      </div>
    </footer>
  )
}
