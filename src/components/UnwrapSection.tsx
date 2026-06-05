import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const FRAMES = 92
const START_FRAME = 86

export default function UnwrapSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAMES - 1])
  const textOpacity1 = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const textOpacity2 = useTransform(scrollYProgress, [0.5, 1], [0, 1])
  const textY1 = useTransform(scrollYProgress, [0, 0.5], [0, -20])
  const textY2 = useTransform(scrollYProgress, [0.5, 1], [20, 0])

  const [currentFrame, setCurrentFrame] = useState(0)

  useEffect(() => {
    const unsubscribe = frameIndex.on('change', (latest) => {
      setCurrentFrame(Math.round(latest))
    })
    return unsubscribe
  }, [frameIndex])

  const getImagePath = (index: number) => {
    const frameNumber = START_FRAME + index
    return `/Unwrappingsoap/ezgif-frame-${String(frameNumber).padStart(3, '0')}.jpg`
  }

  return (
    <section ref={containerRef} className="relative h-[30vh] bg-cream overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.img
          src={getImagePath(currentFrame)}
          alt="Unwrapping soap"
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="text-center px-6">
          <motion.p
            style={{ 
              opacity: textOpacity1,
              y: textY1,
              fontFamily: "'Urbanist', sans-serif"
            }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Unwrap to see what's inside
          </motion.p>
          <motion.p
            style={{ 
              opacity: textOpacity2,
              y: textY2,
              fontFamily: "'Poppins', sans-serif"
            }}
            className="text-2xl md:text-3xl font-medium text-white"
          >
            only for you and your gentle skin
          </motion.p>
        </div>
      </div>
    </section>
  )
}
