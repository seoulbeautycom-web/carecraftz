import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { useSoap } from '../context/SoapContext'

export default function FlyingSoap() {
  const { stage, setStage, setScrollProgress } = useSoap()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll()

  const rawProgress = useMotionValue(0)
  const smoothProgress = useSpring(rawProgress, { stiffness: 60, damping: 20 })

  useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      rawProgress.set(v)
      setScrollProgress(v)

      if (v < 0.25) {
        setStage('packaged')
      } else if (v >= 0.25 && v < 0.3) {
        setStage('unwrapping')
      } else if (v >= 0.3 && v < 0.6) {
        setStage('unwrapped')
      } else if (v >= 0.6) {
        setStage('settled')
      }
    })
  }, [scrollYProgress, rawProgress, setStage, setScrollProgress])

  const x = useTransform(smoothProgress, [0, 0.15, 0.35, 0.55, 0.75], ['35vw', '40vw', '20vw', '30vw', '50vw'])
  const y = useTransform(smoothProgress, [0, 0.15, 0.35, 0.55, 0.75], ['30vh', '25vh', '120vh', '220vh', '310vh'])

  const scale = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.75], [1, 1.1, 0.95, 1.05, 1])
  const rotateX = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.75], [5, -8, 12, -5, 0])
  const rotateY = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.75], [-5, 10, -8, 6, 0])
  const rotateZ = useTransform(smoothProgress, [0, 0.4, 0.75], [0, 180, 360])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-30 perspective-1000">
      <motion.div
        style={{ x, y, scale, rotateX, rotateY, rotateZ }}
        animate={{ translateY: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="preserve-3d will-change-transform"
      >
        <AnimatePresence mode="wait">
          {stage === 'packaged' || stage === 'unwrapping' ? (
            <motion.div
              key="packaged"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <motion.img
                src="/1.png"
                alt="CareCraftz Moringa Soap Box"
                className="w-48 h-auto md:w-64 lg:w-80 drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(45,74,45,0.25))' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="unwrapped"
              initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <motion.img
                src="/2.png"
                alt="CareCraftz Unwrapped Moringa Soap"
                className="w-44 h-auto md:w-60 lg:w-72 drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(45,74,45,0.3))' }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-xs font-semibold tracking-[0.3em] text-forest uppercase">
                  100% Hand Made
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
