import { useEffect, useRef, useState } from 'react'
import ProductPanel from './ProductPanel'

const BG_LIME = '#BDE84F'

const WILD_PRODUCT = {
  name: 'Deep Clean',
  size: '140ml',
  image: '/deepclean.png',
  notes: [
    { label: 'Purifies Pores', ingredient: 'VITAMIN-C' },
    { label: 'Removes buildup', ingredient: 'SALICYLIC ACID' },
    { label: 'Dirt Extractor', ingredient: 'HYDRATING FORMULA' },
  ],
}

const WILD_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_151818_65bb22c5-33ae-4e23-85ea-0a3dd89957c2.mp4'

export default function WildScentSection() {
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
      <div className="flex flex-col-reverse md:grid md:min-h-screen" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="hidden md:block relative overflow-hidden" style={{ backgroundColor: '#111', minHeight: '100%' }}>
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={WILD_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
        <div className="md:hidden relative overflow-hidden" style={{ height: '75vw', backgroundColor: '#111' }}>
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={WILD_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
        <ProductPanel bg={BG_LIME} product={WILD_PRODUCT} notes={WILD_PRODUCT.notes} visible={visible} noteStyle="bold" />
      </div>
    </section>
  )
}
