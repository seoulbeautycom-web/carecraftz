import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useAnimationFrame, animate } from 'framer-motion'
import PageFrame from '../components/PageFrame'

const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_3BA1nJibL92zfZpAJB3BLBU6tQI/hf_20260520_114550_b72cc2b7-2267-4d9e-b19f-f3bb4b0c7084.mp4'
const TARGET_RADIUS = 650

const orbitImagesData = [
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390315/BL1996-Beyond_wild_vetiver_Flakon_100ml_300dpi_a55ie5.webp',
    title: 'Wild Vetiver',
    desc: 'Smoky vetiver wrapped in saffron and leather — a grounded, untamed signature.',
  },
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390315/BL2156_BEYOND_RADIANT_OSMANTHUS_hoc3up.webp',
    title: 'Radiant Osmanthus',
    desc: 'Apricot-tinged osmanthus over soft musks. Quietly luminous, never loud.',
  },
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390315/BL2157_BEYOND_VIBRANT_HIBISCUS_pgiehq.webp',
    title: 'Vibrant Hibiscus',
    desc: 'Bright hibiscus and pink pepper resting on creamy sandalwood.',
  },
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390315/BL2158_BEYOND_MELLOW_HELIOTROPE_agqych.webp',
    title: 'Mellow Heliotrope',
    desc: 'Almond, vanilla and heliotrope petals — a powdery, hushed warmth.',
  },
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390317/BL2371-BL2372-BL2373-Magnetic-Amber_web_2_dbmtpy.webp',
    title: 'Magnetic Amber',
    desc: 'Resinous amber, oud and rich woods. The collection\'s deepest note.',
  },
  {
    src: 'https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780390315/BL2156_BEYOND_RADIANT_OSMANTHUS_1_hlc4v1.webp',
    title: 'Crystal Edition',
    desc: 'A limited cut of the bottle — etched facets, lavender pour, leather collar.',
  },
]

function generateEllipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`
}

interface OrbitItemProps {
  item: React.ReactNode
  title?: string
  desc?: string
  index: number
  totalItems: number
  pathValue: any
  itemSizeValue: any
  rotationValue: any
  progress: any
  fill: boolean
  scaleStrength: any
  focalPoint?: number
}

function OrbitItem({
  item,
  title,
  desc,
  index,
  totalItems,
  pathValue,
  itemSizeValue,
  rotationValue,
  progress,
  fill,
  scaleStrength,
  focalPoint = 50,
}: OrbitItemProps) {
  const itemOffset = fill ? index / totalItems * 100 : 0

  const offsetPercentage = useTransform(progress, (p: number) => {
    return ((p + itemOffset) % 100 + 100) % 100
  })

  const offsetDistance = useTransform(offsetPercentage, (p: number) => `${p}%`)

  const itemScale = useTransform(() => {
    const rawPos = offsetPercentage.get()
    const strength = scaleStrength ? scaleStrength.get() : 0
    let dist = Math.abs(rawPos - focalPoint)
    if (dist > 50) dist = 100 - dist
    let targetScale = 1
    if (dist < 20) {
      const ratio = dist / 20
      const cosCurve = (Math.cos(ratio * Math.PI) + 1) / 2
      targetScale = 0.4 + cosCurve * 0.6
    } else {
      targetScale = 0.4
    }
    return 1 - strength * (1 - targetScale)
  })

  const offsetPath = useMotionTemplate`path("${pathValue}")`
  const zIndexMV = useTransform(itemScale, (s: number) => Math.round(s * 100))
  const counterRotate = useTransform(rotationValue, (r: number) => `rotate(${-r}deg)`)
  const labelOpacity = useTransform(scaleStrength || useMotionValue(0), (s: number) => s)

  return (
    <motion.div
      className="orbit-item"
      style={{
        width: itemSizeValue,
        height: itemSizeValue,
        offsetPath,
        offsetRotate: '0deg',
        offsetAnchor: 'center center',
        offsetDistance,
        scale: itemScale,
        zIndex: zIndexMV,
        pointerEvents: 'auto',
      }}
    >
      <motion.div style={{ transform: counterRotate, width: '100%', height: '100%', position: 'relative' }}>
        {item}
        {(title || desc) && (
          <motion.div
            style={{
              position: 'absolute',
              left: '115%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 'min(360px, 95%)',
              color: '#000',
              opacity: labelOpacity,
              pointerEvents: 'none',
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            }}
          >
            {title && (
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 'clamp(26px, 3vw, 40px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  marginBottom: '14px',
                  whiteSpace: 'normal',
                }}
              >
                {title}
              </div>
            )}
            {desc && (
              <div
                style={{
                  fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(13px, 1vw, 15px)',
                  lineHeight: 1.5,
                  color: 'rgba(0,0,0,0.72)',
                }}
              >
                {desc}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

interface OrbitImagesProps {
  images: (string | { src: string; title?: string; desc?: string })[]
  altPrefix?: string
  baseWidth?: number
  radiusX?: number
  radiusY?: number
  duration?: number
  itemSize?: number
  direction?: 'normal' | 'reverse'
  fill?: boolean
  width?: number | string
  height?: number | string
  className?: string
  showPath?: boolean
  pathColor?: string
  pathWidth?: number
  easing?: string
  paused?: boolean
  centerContent?: React.ReactNode
  responsive?: boolean
  progressOverride?: any
  radiusXOverride?: any
  radiusYOverride?: any
  itemSizeOverride?: any
  rotationOverride?: any
  translateXOverride?: any
  focusStrength?: any
}

function OrbitImages({
  images = [],
  altPrefix = 'Orbiting image',
  baseWidth = 1400,
  radiusX = 700,
  radiusY = 170,
  duration = 40,
  itemSize = 64,
  direction = 'normal',
  fill = true,
  width = 100,
  height = 100,
  className = '',
  showPath = false,
  pathColor = 'rgba(0,0,0,0.1)',
  pathWidth = 2,
  easing = 'linear',
  paused = false,
  centerContent,
  responsive = false,
  progressOverride,
  radiusXOverride,
  radiusYOverride,
  itemSizeOverride,
  rotationOverride,
  translateXOverride,
  focusStrength,
}: OrbitImagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const designCenterX = baseWidth / 2
  const designCenterY = baseWidth / 2

  const currentRadiusX = radiusXOverride || useMotionValue(radiusX)
  const currentRadiusY = radiusYOverride || useMotionValue(radiusY)
  const currentItemSize = itemSizeOverride || useMotionValue(itemSize)
  const currentRotation = rotationOverride || useMotionValue(-8)
  const currentTranslateX = translateXOverride || useMotionValue(0)

  const pathValue = useTransform(currentRadiusX, (rx) => {
    const ry = currentRadiusY.get()
    return generateEllipsePath(designCenterX, designCenterY, rx as number, ry as number)
  })

  useEffect(() => {
    if (!responsive || !containerRef.current) return
    const updateScale = () => {
      if (!containerRef.current) return
      setScale(containerRef.current.clientWidth / baseWidth)
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [responsive, baseWidth])

  const internalProgress = useMotionValue(0)

  useEffect(() => {
    if (paused || progressOverride) return
    const controls = animate(internalProgress, direction === 'reverse' ? -100 : 100, {
      duration,
      ease: easing as any,
      repeat: Infinity,
      repeatType: 'loop',
    })
    return () => controls.stop()
  }, [internalProgress, duration, easing, direction, paused, progressOverride])

  const activeProgress = progressOverride || internalProgress
  const containerWidth = responsive ? '100%' : typeof width === 'number' ? width : '100%'
  const containerHeight = responsive ? 'auto' : typeof height === 'number' ? height : typeof width === 'number' ? width : 'auto'

  const items = images.map((entry, index) => {
    const src = typeof entry === 'string' ? entry : entry.src
    return (
      <motion.img
        key={src}
        src={src}
        alt={`${altPrefix} ${index + 1}`}
        draggable={false}
        className="orbit-image"
        whileHover={{ scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className={`orbit-container ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        aspectRatio: responsive ? '1 / 1' : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className={responsive ? 'orbit-scaling-container orbit-scaling-container--responsive' : 'orbit-scaling-container'}
        style={{
          width: responsive ? baseWidth : '100%',
          height: responsive ? baseWidth : '100%',
          transform: responsive ? `translate(-50%, -50%) scale(${scale})` : undefined,
        }}
      >
        <motion.div className="orbit-rotation-wrapper" style={{ rotate: currentRotation, x: currentTranslateX }}>
          {showPath && (
            <svg width="100%" height="100%" viewBox={`0 0 ${baseWidth} ${baseWidth}`} className="orbit-path-svg">
              <motion.path d={pathValue} fill="none" stroke={pathColor} strokeWidth={pathWidth / scale} />
            </svg>
          )}
          {items.map((item, index) => {
            const entry = images[index]
            const title = typeof entry === 'object' ? entry.title : undefined
            const desc = typeof entry === 'object' ? entry.desc : undefined
            return (
              <OrbitItem
                key={index}
                item={item}
                title={title}
                desc={desc}
                index={index}
                totalItems={items.length}
                pathValue={pathValue}
                itemSizeValue={currentItemSize}
                rotationValue={currentRotation}
                progress={activeProgress}
                fill={fill}
                scaleStrength={focusStrength}
                focalPoint={50}
              />
            )
          })}
        </motion.div>
      </div>
      {centerContent && <div className="orbit-center-content">{centerContent}</div>}
    </div>
  )
}

function StaySection() {
  const blurUp = {
    initial: { opacity: 0, y: 40, filter: 'blur(20px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 1 },
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <img
        src="https://res.cloudinary.com/dsdhxhhqh/image/upload/v1780401858/pasted-1779282335552-1_gmztyi.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none select-none"
        style={{ objectFit: 'cover', objectPosition: 'center bottom' }}
      />

      <div className="relative max-w-[1480px] mx-auto px-8 md:px-16 pt-20 md:pt-24 pb-20 md:pb-24 min-h-screen flex flex-col" style={{ gap: '32px' }}>
        <motion.div {...blurUp}>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(60px, 11vw, 160px)',
              lineHeight: 0.95,
              letterSpacing: '-0.01em',
              color: '#000',
            }}
          >
            Stay <span style={{ fontStyle: 'italic' }}>in</span>
          </div>
          <div
            style={{
              fontFamily: 'Manrope, ui-sans-serif, sans-serif',
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#000',
              fontSize: '64px',
            }}
          >
            the collection
          </div>
        </motion.div>

        <motion.div {...blurUp} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} className="max-w-md">
          <p
            className="mb-6"
            style={{
              fontFamily: 'Manrope, ui-sans-serif, sans-serif',
              fontSize: '15px',
              lineHeight: 1.55,
              color: 'rgba(0,0,0,0.78)',
            }}
          >
            Editions and invitations from the Bentley fragrance studio, sent twice a season.
          </p>
          <form className="flex items-center border-b border-black/40 pb-2 gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="bg-transparent flex-1 outline-none"
              style={{ fontFamily: 'Manrope, ui-sans-serif, sans-serif', fontSize: '15px', color: '#000' }}
            />
            <button
              type="submit"
              style={{
                fontFamily: 'Manrope, ui-sans-serif, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#000',
              }}
            >
              Subscribe →
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

function FutureLaunchesInner() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const rx = useTransform(scrollYProgress, [0, 0.08, 1], ['0%', '55%', '55%'])
  const ry = useTransform(scrollYProgress, [0, 0.08, 1], ['0%', '55%', '55%'])
  const clipPath = useMotionTemplate`ellipse(${rx} ${ry} at 50% 50%)`

  const textOpacity = useTransform(
    scrollYProgress,
    [0.03, 0.08, 0.15, 0.22, 0.9, 0.98, 1],
    [0, 1, 1, 0, 0, 1, 1]
  )
  const textBlurVal = useTransform(
    scrollYProgress,
    [0.03, 0.08, 0.15, 0.22, 0.9, 0.98, 1],
    [15, 0, 0, 15, 15, 0, 0]
  )
  const filterText = useMotionTemplate`blur(${textBlurVal}px)`
  const yElement = useTransform(
    scrollYProgress,
    [0.03, 0.08, 0.15, 0.22, 0.9, 0.98, 1],
    [20, 0, 0, 20, 20, 0, 0]
  )

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.03, 0.08], [1, 1, 0])

  const orbitItemSize = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [80, 360, 360, 80, 80])
  const orbitRx = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [330, TARGET_RADIUS, TARGET_RADIUS, 330, 330])
  const orbitRy = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [140, TARGET_RADIUS, TARGET_RADIUS, 140, 140])
  const orbitRotation = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [-15, 0, 0, -15, -15])
  const orbitTx = useTransform(
    scrollYProgress,
    [0.15, 0.25, 0.85, 0.95, 1],
    [0, -(TARGET_RADIUS + 200), -(TARGET_RADIUS + 200), 0, 0]
  )
  const focusStrength = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95, 1], [0, 1, 1, 0, 0])

  const orbitProgress = useMotionValue(0)
  const prevScroll = useRef(0)

  useAnimationFrame((_time, delta) => {
    const pos = scrollYProgress.get()
    const scrollDelta = pos - prevScroll.current
    prevScroll.current = pos

    let frameSpeed = 0
    if (pos > 0.15 && pos < 0.85) {
      frameSpeed = scrollDelta * 200
    } else {
      frameSpeed = delta / 1000 * 2.5
    }

    orbitProgress.set(orbitProgress.get() + frameSpeed)
  })

  return (
    <>
      <div ref={containerRef} className="relative w-full h-[600vh] bg-black">
        <div className="sticky top-0 w-full h-screen overflow-hidden text-white">
          {/* Video background */}
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>

          {/* Top-left logo text */}
          <div
            className="absolute z-10 flex flex-col items-start text-left text-black select-none leading-[0.95]"
            style={{ top: '120px', left: '96px' }}
          >
            <div className="flex items-baseline">
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 5vw, 64px)' }}>
                Beyond
              </span>
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 5vw, 64px)',
                  marginLeft: '0.05em',
                }}
              >
                The
              </span>
            </div>
            <span
              style={{
                fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(28px, 4.4vw, 56px)',
                letterSpacing: '-0.01em',
                marginTop: '0.05em',
              }}
            >
              Collection
            </span>
          </div>

          {/* Scroll hint arrow */}
          <motion.div
            className="absolute z-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white select-none pointer-events-none"
            style={{ bottom: '40px', opacity: scrollHintOpacity }}
          >
            <div className="relative w-[20px] h-[34px] overflow-hidden">
              <svg
                className="scroll-arrow absolute inset-0"
                width="20"
                height="34"
                viewBox="0 0 20 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M10 4 V28 M3 21 L10 28 L17 21" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.div>

          {/* Clip-path reveal with orbit */}
          <motion.div
            className="absolute z-20 flex items-center justify-center overflow-hidden"
            style={{
              clipPath,
              rotate: -15,
              width: '150vw',
              height: '150vh',
              left: '-25vw',
              top: '-25vh',
            }}
          >
            <div className="absolute inset-0 bg-white" />
            <div
              className="relative flex flex-col items-center justify-center"
              style={{ width: '100vw', height: '100vh', transform: 'rotate(15deg)' }}
            >
              <motion.div className="w-[90vw] max-w-[1200px] aspect-square relative z-0">
                <OrbitImages
                  images={orbitImagesData}
                  direction="normal"
                  duration={40}
                  fill={true}
                  showPath={false}
                  responsive={true}
                  baseWidth={800}
                  progressOverride={orbitProgress}
                  radiusXOverride={orbitRx}
                  radiusYOverride={orbitRy}
                  itemSizeOverride={orbitItemSize}
                  rotationOverride={orbitRotation}
                  translateXOverride={orbitTx}
                  focusStrength={focusStrength}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Text overlays */}
          <div className="absolute inset-0 z-[60] pointer-events-none">
            {/* Center brand text */}
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <motion.div
                className="flex flex-col items-center whitespace-nowrap pointer-events-auto"
                style={{
                  filter: filterText,
                  opacity: textOpacity,
                  WebkitFontSmoothing: 'antialiased',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="flex items-baseline text-black leading-none mb-1">
                  <span className="font-serif text-[45px] md:text-[55px] tracking-tight text-black">Beyond </span>
                  <span className="font-serif text-[45px] md:text-[55px] italic tracking-tight text-black">The</span>
                </div>
                <span className="font-sans text-[28px] md:text-[36px] tracking-tight text-black mt-[-5px]">Collection</span>
              </motion.div>
            </div>

            {/* Top-right info */}
            <motion.div
              className="absolute top-32 right-[calc(6vw+150px)] md:right-[214px] flex flex-col items-start text-left pointer-events-auto cursor-text"
              style={{ y: yElement, filter: filterText, opacity: textOpacity }}
            >
              <span className="font-serif text-[40px] leading-none mb-3 text-black">2K26</span>
              <span className="font-serif text-[16px] uppercase tracking-widest text-black leading-[20px] text-left">
                JOIN AN EXCLUSIVE<br />COMMUNITY
              </span>
            </motion.div>

            {/* Bottom-left number */}
            <motion.div
              className="absolute bottom-8 left-8 md:bottom-16 md:left-16 flex flex-col items-start text-black pointer-events-auto cursor-text"
              style={{ y: yElement, filter: filterText, opacity: textOpacity }}
            >
              <span className="font-serif text-[40px] leading-none mb-1 text-black">0651</span>
              <span className="font-serif text-[16px] uppercase tracking-widest text-black">COLLECTION</span>
            </motion.div>

            {/* Bottom-right CTA */}
            <div className="absolute bottom-16 right-[6vw] md:right-[10vw] flex flex-col items-start z-10 pointer-events-auto">
              <motion.p
                className="font-serif text-[16px] uppercase tracking-widest text-black leading-[20px] mb-6 text-left w-[240px] cursor-text"
                style={{ y: yElement, filter: filterText, opacity: textOpacity }}
              >
                JOIN AN EXCLUSIVE COMMUNITY OF SAILORS. WHETHER YOU CRAVE THE THRILL OF THE OPEN
              </motion.p>
              <motion.div
                className="flex gap-0 pointer-events-auto items-center"
                style={{ y: yElement, filter: filterText, opacity: textOpacity }}
              >
                <button className="bg-black hover:bg-black/90 transition-colors text-white rounded-[40px] px-8 py-3.5 font-serif tracking-[0.1em] uppercase text-[12px] md:text-[14px] z-10">
                  BUY COLLECTION
                </button>
                <button className="bg-black hover:bg-black/90 transition-colors w-[46px] h-[46px] flex items-center justify-center rounded-[50%] text-white -ml-2 z-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <StaySection />
    </>
  )
}

export default function FutureLaunches() {
  return (
    <PageFrame frameColor="#7EC8E3" showFooter={true} disableScroll={true}>
      <FutureLaunchesInner />
    </PageFrame>
  )
}
