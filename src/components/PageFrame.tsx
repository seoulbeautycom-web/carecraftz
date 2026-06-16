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
   * The frame is painted as a fixed ring around the viewport so it never clips sticky/scroll content.
   */
  scrollDriven?: boolean
}

export default function PageFrame({ children, frameColor, showFooter = true, scrollDriven = false }: PageFrameProps) {
  if (scrollDriven) {
    // For pages with scroll-driven animations (Craft, FutureLaunches):
    // Render a fixed 12px colored ring around the viewport that sits on top,
    // while children scroll normally in the document flow.
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/* Fixed colored border ring — purely decorative, never clips content */}
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ boxShadow: `inset 0 0 0 10px ${frameColor}` }}
        />
        <NewHeader />
        {children}
        {showFooter && <Footer />}
        <WhatsAppButton />
        <CartDrawer />
      </div>
    )
  }

  // Standard pages: colored outer frame + cream inner container
  return (
    <div
      className="min-h-screen w-screen p-3"
      style={{ backgroundColor: frameColor, fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="bg-[#fbfcf4] min-h-[calc(100vh-24px)] rounded-3xl overflow-hidden relative">
        <NewHeader />
        {children}
        {showFooter && <Footer />}
        <WhatsAppButton />
        <CartDrawer />
      </div>
    </div>
  )
}
