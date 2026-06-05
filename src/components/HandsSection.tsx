import { useRef, useEffect } from 'react'
import { Sparkles, Wind, ShieldCheck } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const benefits = [
  {
    icon: Sparkles,
    title: 'Velvety Lather',
    description: 'Rich, creamy bubbles that glide across your skin, cleansing without stripping natural oils.',
  },
  {
    icon: Wind,
    title: 'Earthy Aroma',
    description: 'A subtle, grounding scent of fresh greens and warm earth — never synthetic, never overpowering.',
  },
  {
    icon: ShieldCheck,
    title: 'Moringa Nourishment',
    description: 'Packed with vitamins A, C, and E. Moringa has been treasured for centuries for its skin-loving properties.',
  },
]

export default function HandsSection() {
  const sectionRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text animations
      gsap.from('.hands-text', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
        },
        opacity: 0,
        y: 50,
        duration: 1,
      })

      // Image animation
      gsap.from(imageRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1,
        },
        opacity: 0,
        scale: 0.8,
        x: 100,
        duration: 1,
      })

      // Benefits stagger animation
      gsap.from('.benefit-item', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
        },
        opacity: 0,
        x: -50,
        stagger: 0.2,
        duration: 0.8,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="hands"
      ref={sectionRef}
      className="relative min-h-screen flex items-center bg-cream py-32 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div ref={textRef} className="hands-text">
            <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-sage-dark mb-6">
              In Your Hands
            </span>

            <h2 className="font-serif text-4xl md:text-5xl font-medium text-charcoal leading-tight mb-8">
              A ritual,
              <br />
              <span className="italic">not a routine.</span>
            </h2>

            <p className="text-lg text-charcoal/60 leading-relaxed mb-16 max-w-lg">
              Hold it. Feel the weight, the coolness, the smooth edges. This is not
              factory-made. It was shaped by human hands, for yours.
            </p>

            <div className="space-y-10">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex gap-5 group benefit-item"
                >
                  <div className="w-12 h-12 rounded-full bg-sage-light/50 flex items-center justify-center shrink-0 group-hover:bg-sage-light transition-colors duration-300">
                    <benefit.icon className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal text-lg mb-1">{benefit.title}</h3>
                    <p className="text-sm text-charcoal/50 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <img
              ref={imageRef}
              src="/sec4.png"
              alt="Hands with soap"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
