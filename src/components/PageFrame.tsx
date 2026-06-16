import NewHeader from './NewHeader'
import SiteFooter from './SiteFooter'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'

interface PageFrameProps {
  children: React.ReactNode
  frameColor: string
  showFooter?: boolean
  /**
   * scrollDriven: page manages its own scroll (Craft, Shop, FutureLaunches).
   * A fixed border overlay paints the colored frame + rounded inner corners
   * without clipping the page's native scroll behaviour.
   */
  scrollDriven?: boolean
}

export default function PageFrame({ children, frameColor, showFooter = true, scrollDriven = false }: PageFrameProps) {
  if (scrollDriven) {
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/*
          Fixed border overlay — 12px colored border with 24px inner radius
          paints the outer frame + curved corners on top of the page.
          pointer-events: none so all clicks/scroll pass through.
        */}
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ border: `12px solid ${frameColor}`, borderRadius: '24px' }}
        />
        <NewHeader />
        {children}
        {showFooter && <SiteFooter />}
        <WhatsAppButton />
        <CartDrawer />
      </div>
    )
  }

  // Standard pages:
  // - h-screen outer colored background (fills corners with frameColor)
  // - p-3 padding → cream inner container sits 12px from edges
  // - rounded-3xl on inner → curved inner corners, rectangle outer corners filled with frameColor
  // - overflow-y-auto on the scroll area → scrollbar sits INSIDE the cream box
  // - scrollbar-color styled to frameColor so it matches the frame
  return (
    <div
      className="h-screen w-screen p-3 overflow-hidden"
      style={{ backgroundColor: frameColor, fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden relative">
        <NewHeader />
        <div
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${frameColor} transparent`,
          }}
        >
          {children}
          {showFooter && <SiteFooter />}
        </div>
        <WhatsAppButton />
        <CartDrawer />
      </div>
    </div>
  )
}
