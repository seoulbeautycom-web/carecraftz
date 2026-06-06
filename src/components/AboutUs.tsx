import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260521_064421_279656fd-e76f-40a0-8fed-7456d4f7715a.mp4'

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function AboutUs() {
  const [arrowCycle, _setArrowCycle] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="relative min-h-screen bg-black">
      {/* Fixed video background */}
      <div className="fixed inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          onError={() => console.log('Video error')}
        />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 pointer-events-auto pt-16">
        {/* Section 1: Hero */}
        <section className="w-[90%] mx-auto h-screen flex flex-col py-8 md:py-12 lg:py-16 pb-12 pointer-events-auto">
          <div className="flex-1 w-full flex flex-col md:grid md:grid-cols-12 md:grid-rows-[1fr_auto] gap-y-8 md:gap-y-0 md:gap-x-8">
            <Reveal delay={0.2} className="md:row-start-2 md:col-start-1 md:col-span-8 flex items-end">
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] font-medium tracking-tight text-white whitespace-nowrap">
                We Do The
                <br />
                Heavy Lifting
              </h1>
            </Reveal>

            <Reveal delay={0.3} className="md:row-start-1 md:col-start-8 md:col-span-5 flex flex-col justify-center items-start md:items-end text-left md:text-right">
              <p className="text-[clamp(1rem,1.6vw,1.375rem)] text-white/64 leading-[1.3] font-normal max-w-[460px] relative -top-[90px]">
                Extensive research into natural skincare, healing formulations, and ingredients that actually work.{' '}
                <span className="font-semibold text-white">So you don't have to.</span>
              </p>
            </Reveal>

            <Reveal delay={0.4} className="md:row-start-2 md:col-start-8 md:col-span-5 flex items-end justify-start md:justify-end">
              <div className="flex items-stretch gap-1 group cursor-pointer">
                <div className="px-8 py-5 bg-white/8 backdrop-blur-[80px] group-hover:bg-white transition-colors">
                  <span className="font-mono text-[12px] tracking-[-0.01em] text-white/90 group-hover:text-black transition-colors">
                    EXPLORE OUR COLLECTION
                  </span>
                </div>
                <div className="px-6 bg-white/8 backdrop-blur-[80px] group-hover:bg-white transition-colors flex items-center justify-center">
                  {arrowCycle === 0 ? (
                    <ArrowRight className="w-5 h-5 text-white/90 group-hover:text-black transition-colors" />
                  ) : (
                    <>
                      <ArrowRight key={arrowCycle} className="w-5 h-5 text-white/90 group-hover:text-black animate-fly-out" />
                      <ArrowRight key={arrowCycle + 1} className="w-5 h-5 text-white/90 group-hover:text-black absolute animate-fly-in" />
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-[200px] w-full" />

        {/* Section 2: ScrollReveal + Grid */}
        <section className="w-[90%] mx-auto min-h-screen flex flex-col justify-center py-8 md:py-12 lg:py-16 pointer-events-auto">
          <div className="max-w-[1200px] w-full">
            <ScrollReveal
              baseOpacity={0.1}
              enableBlur={true}
              baseRotation={3}
              blurStrength={4}
              textClassName="text-[clamp(2rem,4.5vw,4rem)] leading-[1.1] font-medium tracking-tight text-white w-full"
            >
              Born in the UAE and Pakistan, we craft skincare that cares. Because your skin deserves the same love we put into ours.
            </ScrollReveal>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
              <Reveal delay={0.1} className="md:col-span-4">
                <div className="flex items-center gap-4 mb-4">
                  <svg width="71" height="43" viewBox="0 0 71 43" fill="none" stroke="white" strokeWidth="1">
                    <ellipse cx="35.5" cy="21.5" rx="35" ry="21" />
                    <line x1="35.5" y1="0.5" x2="35.5" y2="42.5" />
                    <line x1="0.5" y1="21.5" x2="70.5" y2="21.5" />
                  </svg>
                  <svg width="157" height="25" viewBox="0 0 157 25" fill="none" className="h-[18px] w-auto">
                    <path d="M10 5 L20 20 L30 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M40 5 L50 20 L60 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M70 5 L80 20 L90 5" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M100 5 L110 20 L120 5" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <p className="text-[11px] font-mono tracking-widest text-white/60 uppercase leading-relaxed">
                  Research-driven formulations
                </p>
              </Reveal>

              <Reveal delay={0.2} className="md:col-span-4">
                <h3 className="text-xl font-medium text-white mb-4">Natural Ingredients / Science-Backed</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  We blend traditional botanical wisdom with modern scientific research to create products that heal, nourish, and transform your skin naturally.
                </p>
              </Reveal>

              <Reveal delay={0.3} className="md:col-span-4">
                <h3 className="text-xl font-medium text-white mb-4">Crafted With Care / For Your Skin</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">
                  Every product is meticulously formulated and tested to ensure it delivers real results. Because we believe skincare should work as hard as you do.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-[200px] w-full" />
      </div>
    </div>
  )
}
