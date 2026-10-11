import { useMemo, useRef } from 'react'
import NewHeader from './NewHeader'
import SiteFooter from './SiteFooter'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'
import { PageShellProvider } from '../contexts/PageShellContext'

interface PageFrameProps {
  children: React.ReactNode
  /** Outer frame color — the only per-page shell difference */
  frameColor: string
  /**
   * @deprecated Footer is always shown for a consistent CareCraftz.com shell.
   * Kept for call-site compatibility; ignored.
   */
  showFooter?: boolean
  /**
   * @deprecated All pages use the same home-page shell (padded colored frame + cream rounded stage).
   * Kept for call-site compatibility; ignored.
   */
  scrollDriven?: boolean
}

/**
 * Global CareCraftz.com shell — matches the main homepage:
 * - colored outer frame (p-3 / 12px)
 * - cream rounded stage (#fbfcf4, rounded-3xl)
 * - fixed NewHeader + SiteFooter on every page
 * Only `frameColor` changes between routes.
 */
export default function PageFrame({ children, frameColor }: PageFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shellValue = useMemo(
    () => ({ scrollRef, frameColor }),
    [frameColor],
  )

  return (
    <PageShellProvider value={shellValue}>
      <div
        className="h-screen w-screen p-3 overflow-hidden"
        style={{ backgroundColor: frameColor, fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="bg-[#fbfcf4] h-[calc(100vh-24px)] rounded-3xl flex flex-col overflow-hidden relative">
          {/* Header floats over page content (same as homepage) */}
          <NewHeader />

          <div
            ref={scrollRef}
            data-page-shell-scroll
            className="flex-1 overflow-y-auto scrollbar-hide relative"
          >
            {children}
            <SiteFooter />
          </div>

          <WhatsAppButton />
          <CartDrawer />
        </div>
      </div>
    </PageShellProvider>
  )
}
