import NewHeader from './NewHeader'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'

interface PageFrameProps {
  children: React.ReactNode
  frameColor: string
  showFooter?: boolean
  /**
   * When true, the page manages its own scroll (e.g. scroll-driven animations).
   * A fixed rounded frame overlay is painted on top so the colored border + curves
   * are always visible without clipping the page's scroll content.
   */
  scrollDriven?: boolean
}

export default function PageFrame({ children, frameColor, showFooter = true, scrollDriven = false }: PageFrameProps) {
  if (scrollDriven) {
    // Fixed overlay: colored outer area + rounded inner window — sits on top of everything,
    // pointer-events:none so scroll/clicks pass through. Matches the homepage look exactly.
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/*
          Fixed overlay: a 12px border with borderRadius 24px sits inset from viewport edges.
          The area between the viewport edge and this border is filled by the frameColor background.
          This exactly replicates the homepage p-3 / rounded-3xl look without clipping scroll content.
        */}
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            border: `12px solid ${frameColor}`,
            borderRadius: '24px',
          }}
        />
        <NewHeader />
        {children}
        {showFooter && <Footer />}
        <WhatsAppButton />
        <CartDrawer />
      </div>
    )
  }

  // Standard pages: exactly matches homepage structure —
  // h-screen outer with frameColor, inner cream rounded-3xl with overflow-y-auto
  return (
    <div
      className="h-screen w-screen p-3 overflow-hidden"
      style={{ backgroundColor: frameColor, fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden relative">
        <NewHeader />
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
          {showFooter && <Footer />}
        </div>
        <WhatsAppButton />
        <CartDrawer />
      </div>
    </div>
  )
}
