import type { CSSProperties } from 'react'

const TEXT_COLOR = '#000000'
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function anim(visible: boolean, delay: number, opts: { y?: number; x?: number; duration?: number } = {}) {
  const { y = 20, x = 0, duration = 1600 } = opts
  const translateFrom = y !== 0 ? `translateY(${y}px)` : x !== 0 ? `translateX(${x}px)` : 'none'
  return {
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0,0)' : translateFrom,
      transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
    } as CSSProperties,
  }
}

interface Note {
  label: string
  ingredient: string
}

interface Product {
  name: string
  size: string
  image: string
}

interface ProductPanelProps {
  bg: string
  product: Product
  notes: Note[]
  visible: boolean
  noteStyle?: 'normal' | 'bold'
}

export default function ProductPanel({ bg, product, notes, visible, noteStyle = 'normal' }: ProductPanelProps) {
  return (
    <div className="relative flex flex-col px-6 md:px-8 pt-6 md:pt-8 pb-8 md:pb-10" style={{ backgroundColor: bg, minHeight: '100%' }}>
      <div className="flex items-start justify-between mb-auto" {...anim(visible, 0, { y: 12, duration: 1400 })}>
        <span className="text-xs font-normal" style={{ color: TEXT_COLOR }}>
          {noteStyle === 'bold' ? 'Gel Cleanser' : 'Extensive Research'}
        </span>
        <span className="text-xs font-normal" style={{ color: TEXT_COLOR }}>
          {noteStyle === 'bold' ? 'Exfoliating' : 'Gentle'}
        </span>
      </div>

      <div className="flex flex-col items-center py-8" style={{ flex: 1, justifyContent: 'center', ...anim(visible, 300, { y: 40, duration: 1800 }).style }}>
        <div className="overflow-hidden" style={{ width: 'clamp(140px,40%,220px)', aspectRatio: '220/340', backgroundColor: '#D9D9D9', borderRadius: '2px', flexShrink: 0 }}>
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div className="text-center mt-4" {...anim(visible, 600, { y: 10, duration: 1400 })}>
          <p className="text-sm font-normal" style={{ color: TEXT_COLOR }}>{product.name}</p>
          <p className="text-xs font-normal mt-1" style={{ color: TEXT_COLOR }}>{product.size}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-0.5" {...anim(visible, 900, { y: 16, duration: 1400 })}>
          {notes.map((note, index) => (
            <div key={index}>
              <p className="text-xs leading-snug" style={{ color: TEXT_COLOR, fontWeight: noteStyle === 'bold' ? 700 : 400 }}>
                {note.label}
              </p>
              <p className="text-xs font-bold tracking-widest uppercase leading-snug" style={{ color: TEXT_COLOR }}>
                {note.ingredient}
              </p>
            </div>
          ))}
        </div>
        <button className="text-xs font-bold tracking-widest uppercase border px-6 py-3 relative group shrink-0" style={{ color: TEXT_COLOR, borderColor: TEXT_COLOR, backgroundColor: 'transparent', ...anim(visible, 1150, { y: 16, duration: 1400 }).style }}>
          <span className="relative z-10 group-hover:text-black transition-colors duration-500">SHOP NOW</span>
          <span className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" style={{ backgroundColor: '#ffffff' }} />
        </button>
      </div>
    </div>
  )
}
