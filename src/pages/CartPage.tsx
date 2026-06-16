import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react'
import PageFrame from '../components/PageFrame'

function CartInner() {
  const navigate = useNavigate()
  const { items, removeFromCart, updateQuantity, grandTotalByCurrency, clearCart } = useCart()

  const formatCurrency = (amount: number, currency: 'PKR' | 'AED') =>
    currency === 'PKR'
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`

  const pkrItems = items.filter(i => i.currency === 'PKR')
  const aedItems = items.filter(i => i.currency === 'AED')

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="w-24 h-24 rounded-full bg-[#B0E4FF]/30 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#2b2b2b]/40" />
        </div>
        <h2 className="text-2xl font-light text-[#2b2b2b] mb-2">Your cart is empty</h2>
        <p className="text-sm text-[#696a67] mb-8 max-w-xs">Looks like you haven't added anything yet. Explore our handcrafted collection.</p>
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 px-8 py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black transition-all"
        >
          Shop Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-[#2b2b2b]">Your Cart <span className="text-lg text-[#696a67]">({items.length} {items.length === 1 ? 'item' : 'items'})</span></h1>
        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#2b2b2b] text-sm leading-snug mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-[#696a67] mb-3">{item.location} · {item.currency}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-[#2b2b2b]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#2b2b2b]">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-[#2b2b2b] mb-4">Order Summary</h3>
            <div className="space-y-3">
              {pkrItems.length > 0 && (
                <div className="p-3 bg-[#f0fdf4] rounded-xl">
                  <p className="text-xs text-[#696a67] mb-1 font-medium uppercase tracking-wide">Pakistan (PKR)</p>
                  <p className="text-lg font-semibold text-[#2b2b2b]">
                    {formatCurrency(grandTotalByCurrency.PKR, 'PKR')}
                  </p>
                  <p className="text-xs text-[#696a67] mt-0.5">{pkrItems.length} item{pkrItems.length !== 1 ? 's' : ''}</p>
                </div>
              )}
              {aedItems.length > 0 && (
                <div className="p-3 bg-[#eff6ff] rounded-xl">
                  <p className="text-xs text-[#696a67] mb-1 font-medium uppercase tracking-wide">UAE (AED)</p>
                  <p className="text-lg font-semibold text-[#2b2b2b]">
                    {formatCurrency(grandTotalByCurrency.AED, 'AED')}
                  </p>
                  <p className="text-xs text-[#696a67] mt-0.5">{aedItems.length} item{aedItems.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="mt-5 w-full py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="mt-2 w-full py-3 text-sm text-[#696a67] hover:text-[#2b2b2b] transition-colors"
            >
              ← Continue Shopping
            </button>
          </div>

          {/* Free delivery nudge */}
          <div className="bg-[#B0E4FF]/20 rounded-2xl p-4 border border-[#B0E4FF]/40">
            <p className="text-xs text-[#2b2b2b] font-medium mb-1">🌿 Eco-Friendly Packaging</p>
            <p className="text-xs text-[#696a67]">All orders ship in 100% recyclable packaging. Part of our zero-waste commitment.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <PageFrame frameColor="#B0E4FF" showFooter={false}>
      <CartInner />
    </PageFrame>
  )
}
