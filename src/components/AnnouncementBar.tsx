import { Sparkles } from 'lucide-react'
import { useStorefrontIdentity } from '../contexts/StorefrontIdentityContext'

export default function AnnouncementBar() {
  const { announcements, announcementBg } = useStorefrontIdentity()
  const messages = announcements.length > 0 ? announcements : ['Welcome to CareCraftz']
  const repeated = [...messages, ...messages, ...messages]

  return (
    <div
      className="text-white overflow-hidden border-0"
      style={{ fontFamily: "'Poppins', sans-serif", padding: '8px 0', backgroundColor: announcementBg }}
    >
      <div className="flex whitespace-nowrap animate-marquee">
        {repeated.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-flex items-center gap-2 text-[11px] font-semibold"
            style={{ paddingLeft: '56px' }}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
            {text}
            <span className="opacity-40 ml-5">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
