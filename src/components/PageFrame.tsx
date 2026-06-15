import NewHeader from './NewHeader'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'

interface PageFrameProps {
  children: React.ReactNode
  frameColor: string
  showFooter?: boolean
  disableScroll?: boolean
}

export default function PageFrame({ children, frameColor, showFooter = true, disableScroll = false }: PageFrameProps) {
  return (
    <div className="min-h-screen w-screen p-3 overflow-x-hidden" style={{ backgroundColor: frameColor, fontFamily: "'Poppins', sans-serif" }}>
      <div className="bg-[#fbfcf4] min-h-[calc(100vh-24px)] rounded-3xl overflow-hidden relative">
        <NewHeader />
        {disableScroll ? (
          <>{children}</>
        ) : (
          <div className="overflow-y-auto">
            {children}
          </div>
        )}
        {showFooter && <Footer />}
        <WhatsAppButton />
        <CartDrawer />
      </div>
    </div>
  )
}
