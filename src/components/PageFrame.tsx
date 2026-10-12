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
 * - colored outer frame
 * - cream rounded stage (#fbfcf4)
 * - fixed NewHeader + SiteFooter on every page
 * Only `frameColor` changes between routes.
 *
 * Mobile: use svh (visible viewport with browser chrome) so the bottom frame
 * is not clipped by the URL/toolbar band that classic 100vh includes.
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
        className="w-full overflow-hidden box-border flex flex-col"
        style={{
          backgroundColor: frameColor,
          fontFamily: "'Poppins', sans-serif",
          // svh = visible height on load (browser chrome expanded); classic 100vh
          // is taller on mobile and clips the bottom colored frame.
          height: '100svh',
          maxHeight: '100dvh',
          // Keep ≥12px frame; grow with notch / home-indicator safe areas.
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        }}
      >
        <div className="bg-[#fbfcf4] flex-1 min-h-0 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden relative">
          {/* Header floats over page content (same as homepage) */}
          <NewHeader />

          <div
            ref={scrollRef}
            data-page-shell-scroll
            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain scrollbar-hide relative"
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
