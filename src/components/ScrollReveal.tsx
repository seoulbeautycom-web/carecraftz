import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  children: string
  scrollContainerRef?: React.RefObject<HTMLElement>
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
  rotationEnd?: string
  wordAnimationEnd?: string
}

export default function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null)

  const splitText = useMemo(() => {
    return children.split(/\s+/).map((word, index) => (
      <span key={`${word}-${index}`} className="word">
        {word}
      </span>
    ))
  }, [children])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const words = container.querySelectorAll('.word')

    // Rotation animation
    const rotationTl = gsap.fromTo(
      container,
      { rotation: baseRotation },
      {
        rotation: 0,
        transformOrigin: '0% 50%',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: rotationEnd,
          scrub: true,
        },
      }
    )

    // Opacity animation
    const opacityTl = gsap.fromTo(
      words,
      { opacity: baseOpacity },
      {
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: container,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: true,
        },
      }
    )

    // Blur animation
    let blurTl: gsap.core.Tween | null = null
    if (enableBlur) {
      blurTl = gsap.fromTo(
        words,
        { filter: `blur(${blurStrength}px)` },
        {
          filter: 'blur(0px)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: container,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
          },
        }
      )
    }

    return () => {
      rotationTl.kill()
      opacityTl.kill()
      if (blurTl) blurTl.kill()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [baseOpacity, baseRotation, blurStrength, enableBlur, rotationEnd, wordAnimationEnd])

  return (
    <h2 ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
    </h2>
  )
}
