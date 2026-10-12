import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react'
import PageFrame from '../components/PageFrame'

function CartInner() {
  const navigate = useNavigate()
  const {
    items,
    removeFromCart,
    updateQuantity,
    totalPriceByCurrency,
    deliveryChargesByCurrency,
    grandTotalByCurrency,
    clearCart,
  } = useCart()

  const formatCurrency = (amount: number, currency: 'PKR' | 'AED') =>
    currency === 'PKR'
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`

  const pkrItems = items.filter((i) => i.currency === 'PKR')
  const aedItems = items.filter((i) => i.currency === 'AED' || !i.currency)

  if (items.length === 0) {
    return (
      <div
        className="pt-24 pb-16 px-4 flex flex-col items-center justify-center text-center min-h-[60vh]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="w-20 h-20 rounded-full bg-[#B0E4FF]/35 border border-[#2b2b2b]/08 flex items-center justify-center mb-5">
          <ShoppingBag className="w-8 h-8 text-[#2b2b2b]/40" />
        </div>
        <h1
          className="text-[#2b2b2b] mb-2"
          style={{ fontWeight: 600, fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)' }}
        >
          Your bag is empty
        </h1>
        <p className="text-sm text-[#696a67] mb-7 max-w-xs">
          Explore the shop and add something you love — it will land here.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
        >
          Shop now <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="pt-20 pb-10 px-4 sm:px-5 lg:px-6 max-w-6xl mx-auto"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1">Bag</p>
          <h1
            className="text-[#2b2b2b] leading-tight"
            style={{ fontWeight: 600, fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)' }}
          >
            Your cart
            <span className="ml-2 text-base font-medium text-[#696a67]">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] hover:text-rose-600 transition-colors shrink-0"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Items */}
        <div className="lg:col-span-3 space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-3.5 py-3.5 flex gap-3.5"
            >
              <div className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden flex-shrink-0 bg-[#f0ece0]">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-7 h-7 text-[#2b2b2b]/25" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#2b2b2b] leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-[#696a67] mt-0.5">
                      {item.location} · {item.currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 rounded-lg text-[#696a67] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 mt-3">
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
                  <span className="text-sm font-semibold text-[#2b2b2b]">
                    {formatCurrency(item.price * item.quantity, item.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-4">
            <h2
              className="text-[#2b2b2b] leading-tight mb-3"
              style={{ fontWeight: 600, fontSize: '1.05rem' }}
            >
              Order summary
            </h2>

            {pkrItems.length > 0 && (
              <div className="mb-3 pb-3 border-b border-[#2b2b2b]/08">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-2">
                  Pakistan · PKR · {pkrItems.length} item{pkrItems.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1 text-xs text-[#696a67]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPriceByCurrency.PKR, 'PKR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{formatCurrency(deliveryChargesByCurrency.PKR, 'PKR')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#2b2b2b] pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotalByCurrency.PKR, 'PKR')}</span>
                  </div>
                </div>
              </div>
            )}

            {aedItems.length > 0 && (
              <div className={pkrItems.length > 0 ? '' : 'mb-1'}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-2">
                  UAE · AED · {aedItems.length} item{aedItems.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1 text-xs text-[#696a67]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPriceByCurrency.AED, 'AED')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{formatCurrency(deliveryChargesByCurrency.AED, 'AED')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#2b2b2b] pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotalByCurrency.AED, 'AED')}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-4 w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              Proceed to checkout <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-2 w-full py-2.5 rounded-full border border-[#2b2b2b]/12 text-[#2b2b2b] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#fbfcf4] transition-colors"
            >
              Continue shopping
            </button>
          </div>

          <div className="rounded-2xl bg-[#B0E4FF]/25 border border-[#2b2b2b]/08 px-4 py-3.5">
            <p className="text-xs font-semibold text-[#2b2b2b] mb-1">Verified sellers</p>
            <p className="text-[11px] text-[#696a67] leading-relaxed">
              Every product on CareCraftz ships from a verified partner. Delivery is calculated per
              currency from live store settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <PageFrame frameColor="#B0E4FF">
      <CartInner />
    </PageFrame>
  )
}
