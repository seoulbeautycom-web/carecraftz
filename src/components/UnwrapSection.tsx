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
  const textOpacity1 = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const textOpacity2 = useTransform(scrollYProgress, [0.2, 1], [0, 1])
  const textY1 = useTransform(scrollYProgress, [0, 0.7], [0, -20])
  const textY2 = useTransform(scrollYProgress, [0.2, 1], [20, 0])

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
      <div className="sticky top-0 h-screen flex items-center justify-center px-6 md:px-12">
        <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-6xl">
          <motion.div
            style={{ 
              opacity: textOpacity1,
              y: textY1,
              fontFamily: "'Urbanist', sans-serif"
            }}
            className="text-2xl md:text-4xl font-bold text-[#1F331F] text-right flex-1"
          >
            Unwrap to see what's inside
          </motion.div>
          
          <div className="relative w-[40vh] h-[40vh] md:w-[50vh] md:h-[50vh] flex-shrink-0">
            <motion.img
              src={getImagePath(currentFrame)}
              alt="Unwrapping soap"
              className="w-full h-full object-cover rounded-lg shadow-2xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
            />
          </div>
          
          <motion.div
            style={{ 
              opacity: textOpacity2,
              y: textY2,
              fontFamily: "'Poppins', sans-serif"
            }}
            className="text-xl md:text-3xl font-medium text-[#1F331F] text-left flex-1"
          >
            only for you and your gentle skin
          </motion.div>
        </div>
      </div>
    </section>
  )
}
