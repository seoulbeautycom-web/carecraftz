import { Sparkles, Leaf, FlaskConical, Globe } from 'lucide-react'

const items = [
  { icon: Sparkles, text: 'Every seller is verified before products go live' },
  { icon: Leaf, text: 'Authentic skincare — curated for UAE and Pakistan' },
  { icon: FlaskConical, text: 'Business docs, certs, and testing reviewed by our team' },
  { icon: Globe, text: 'CareCraftz Official is one verified seller among many' },
]

export default function AnnouncementBar() {
  const repeated = [...items, ...items, ...items]

  return (
    <div
      className="bg-[#7B68EE] text-white overflow-hidden border-0"
      style={{ fontFamily: "'Poppins', sans-serif", padding: '8px 0' }}
    >
      <div className="flex whitespace-nowrap animate-marquee">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-[11px] font-semibold"
            style={{ paddingLeft: '56px' }}
          >
            <item.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
            {item.text}
            <span className="opacity-40 ml-5">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
