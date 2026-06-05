import { useEffect, useRef, useState } from 'react'
import ProductPanel from './ProductPanel'

const BG_BLUE = '#4BB3ED'

const SCENT_PRODUCT = {
  name: 'Delicate Zone',
  size: '50ml',
  image: '/delicatezone.png',
  notes: [
    { label: 'Even Skin Tone', ingredient: 'GLUTATHIONE' },
    { label: 'Lightens Dark Spots', ingredient: 'NIACINAMIDE' },
    { label: 'For Private Parts', ingredient: 'ALPHA ARBUTIN' },
  ],
}

const SCENT_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_151802_1bbf9a81-a7cb-4be1-b858-f1cd92b62b96.mp4'

export default function ScentFinderSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <section ref={ref as any} className="relative w-full">
      <div className="flex flex-col md:grid md:min-h-screen" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <ProductPanel bg={BG_BLUE} product={SCENT_PRODUCT} notes={SCENT_PRODUCT.notes} visible={visible} />
        <div className="hidden md:block relative overflow-hidden" style={{ backgroundColor: '#111', minHeight: '100%' }}>
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={SCENT_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
        <div className="md:hidden relative overflow-hidden" style={{ height: '75vw', backgroundColor: '#111' }}>
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={SCENT_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
