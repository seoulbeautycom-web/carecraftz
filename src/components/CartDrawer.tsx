import { useCart } from '../contexts/CartContext'
import { usePageShellOptional } from '../contexts/PageShellContext'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalPriceByCurrency,
    deliveryChargesByCurrency,
    grandTotalByCurrency,
    clearCart,
  } = useCart()
  const navigate = useNavigate()
  const pageShell = usePageShellOptional()
  const accent = pageShell?.frameColor || '#B0E4FF'

  const formatCurrency = (amount: number, currency: 'PKR' | 'AED') =>
    currency === 'PKR'
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`

  if (!isCartOpen) return null

  return (
    <>
      {/* Dim the cream stage only — stay inside PageFrame */}
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 z-[70] bg-[#1F331F]/25 backdrop-blur-[2px]"
        onClick={() => setIsCartOpen(false)}
      />

      <aside
        className="absolute top-0 right-0 bottom-0 z-[80] w-full max-w-[22rem] sm:max-w-md flex flex-col overflow-hidden rounded-l-2xl sm:rounded-l-3xl border-l border-[#2b2b2b]/08"
        style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#fbfcf4' }}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 border-b border-[#2b2b2b]/08"
          style={{ backgroundColor: `${accent}55` }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67]">CareCraftz</p>
            <h2
              className="text-[#2b2b2b] leading-tight truncate"
              style={{ fontWeight: 600, fontSize: '1.05rem' }}
            >
              Your bag
              <span className="ml-1.5 text-sm font-medium text-[#696a67]">
                ({items.length})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full bg-white/80 border border-[#2b2b2b]/08 hover:bg-white transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-[#2b2b2b]" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-14 px-2">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-[#2b2b2b]/08"
                style={{ backgroundColor: `${accent}40` }}
              >
                <ShoppingBag className="w-7 h-7 text-[#2b2b2b]/45" />
              </div>
              <p className="text-sm font-semibold text-[#2b2b2b] mb-1">Your bag is empty</p>
              <p className="text-[11px] text-[#696a67] mb-5 max-w-[14rem] mx-auto">
                Add something from the shop — it will show up here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false)
                  navigate('/shop')
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
              >
                Browse shop <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-2xl bg-white border border-[#2b2b2b]/08"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f0ece0] shrink-0">
                    <img
                      src={item.image || '/placeholder-product.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-[#2b2b2b] leading-snug truncate">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-[#696a67] mt-0.5">
                          {item.location} · {item.currency}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-lg text-[#696a67] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2.5">
                      <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-[#f0ece0] border border-[#2b2b2b]/06">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-[#fbfcf4] transition-colors"
                        >
                          <Minus className="w-3 h-3 text-[#2b2b2b]" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-[#2b2b2b]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-[#fbfcf4] transition-colors"
                        >
                          <Plus className="w-3 h-3 text-[#2b2b2b]" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-[#2b2b2b] shrink-0">
                        {formatCurrency(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={clearCart}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-[#696a67] hover:text-rose-600 transition-colors"
              >
                Clear bag
              </button>
            </>
          )}
        </div>

        {/* Footer totals */}
        {items.length > 0 && (
          <div className="border-t border-[#2b2b2b]/08 bg-white px-4 py-4 sm:px-5 space-y-3">
            <div className="space-y-1 text-xs">
              {grandTotalByCurrency.PKR > 0 && (
                <>
                  <div className="flex justify-between text-[#696a67]">
                    <span>Subtotal (PKR)</span>
                    <span>{formatCurrency(totalPriceByCurrency.PKR, 'PKR')}</span>
                  </div>
                  <div className="flex justify-between text-[#696a67]">
                    <span>Delivery (PKR)</span>
                    <span>{formatCurrency(deliveryChargesByCurrency.PKR, 'PKR')}</span>
                  </div>
                </>
              )}
              {grandTotalByCurrency.AED > 0 && (
                <>
                  <div className="flex justify-between text-[#696a67]">
                    <span>Subtotal (AED)</span>
                    <span>{formatCurrency(totalPriceByCurrency.AED, 'AED')}</span>
                  </div>
                  <div className="flex justify-between text-[#696a67]">
                    <span>Delivery (AED)</span>
                    <span>{formatCurrency(deliveryChargesByCurrency.AED, 'AED')}</span>
                  </div>
                </>
              )}
              <div className="border-t border-[#2b2b2b]/08 pt-2 mt-1 space-y-1">
                {grandTotalByCurrency.PKR > 0 && (
                  <div className="flex justify-between font-semibold text-[#2b2b2b]">
                    <span>Total (PKR)</span>
                    <span>{formatCurrency(grandTotalByCurrency.PKR, 'PKR')}</span>
                  </div>
                )}
                {grandTotalByCurrency.AED > 0 && (
                  <div className="flex justify-between font-semibold text-[#2b2b2b]">
                    <span>Total (AED)</span>
                    <span>{formatCurrency(grandTotalByCurrency.AED, 'AED')}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false)
                navigate('/checkout')
              }}
              className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              Checkout <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false)
                navigate('/cart')
              }}
              className="w-full py-2.5 rounded-full border border-[#2b2b2b]/12 text-[#2b2b2b] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#fbfcf4] transition-colors"
            >
              View full cart
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
