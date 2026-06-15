import { Truck, Heart } from 'lucide-react'

export default function AnnouncementBar() {
  return (
    <div className="bg-[#7B68EE] text-white py-2.5 px-4 overflow-hidden">
      <div className="flex items-center justify-center gap-8 text-xs font-medium whitespace-nowrap">
        {/* Marquee container */}
        <div className="flex items-center gap-8 animate-marquee">
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" />
            Free domestic shipping on orders over $45
          </span>
          <span className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5" />
            We&apos;ve updated our packaging! Read more about it here
          </span>
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" />
            Spend $45 USD more for free shipping
          </span>
          <span className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5" />
            We&apos;ve updated our packaging! Read more about it here
          </span>
        </div>
      </div>
    </div>
  )
}
