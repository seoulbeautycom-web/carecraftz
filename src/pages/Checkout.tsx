import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/auth-context'
import { supabase } from '../lib/supabase'
import {
  CreditCard,
  Truck,
  Shield,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle,
  Package,
  Send,
  Home,
  AlertCircle,
} from 'lucide-react'
import PageFrame from '../components/PageFrame'
import { useStorefrontIdentity } from '../contexts/StorefrontIdentityContext'
import { useAuthModal } from '../contexts/auth-modal-context'

interface OrderForm {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  country: 'Pakistan' | 'UAE'
  postalCode: string
  paymentMethod: 'cod' | 'card'
}

function CheckoutInner() {
  const navigate = useNavigate()
  const { items, totalPriceByCurrency, deliveryChargesByCurrency, grandTotalByCurrency, clearCart, replaceItems } =
    useCart()
  const { user, loading: authLoading, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { ops } = useStorefrontIdentity()
  const codEnabled = ops.payments.cod_enabled
  // Card checkout stays blocked until a real payment gateway is wired.
  const cardPaymentsLive = false
  const cardEnabled = ops.payments.card_enabled && cardPaymentsLive

  const hasPKRItems = items.some((item) => item.currency === 'PKR')
  const hasAEDItems = items.some((item) => item.currency === 'AED' || !item.currency)
  const requiredCountry =
    hasPKRItems && !hasAEDItems
      ? 'Pakistan'
      : hasAEDItems && !hasPKRItems
        ? 'UAE'
        : hasPKRItems && hasAEDItems
          ? 'mixed'
          : 'UAE'

  const [form, setForm] = useState<OrderForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: requiredCountry === 'Pakistan' || requiredCountry === 'UAE' ? requiredCountry : 'UAE',
    postalCode: '',
    paymentMethod: 'cod',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  const pkrItems = items.filter((item) => item.currency === 'PKR')
  const aedItems = items.filter((item) => item.currency === 'AED' || !item.currency)

  useEffect(() => {
    setForm((prev) => {
      if (prev.paymentMethod === 'cod' && !codEnabled && cardEnabled) {
        return { ...prev, paymentMethod: 'card' }
      }
      if (prev.paymentMethod === 'card' && !cardEnabled && codEnabled) {
        return { ...prev, paymentMethod: 'cod' }
      }
      return prev
    })
  }, [cardEnabled, codEnabled])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setForm((prev) => ({
        ...prev,
        fullName: data?.full_name || user.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: data?.phone || user.phone || prev.phone,
        address: data?.address || prev.address,
        city: data?.city || prev.city,
        country:
          requiredCountry === 'Pakistan' || requiredCountry === 'UAE'
            ? requiredCountry
            : data?.country || prev.country,
      }))
    }
    void fetchUserProfile()
  }, [user, requiredCountry])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Sign in to continue checkout.')
      return
    }
    if (form.paymentMethod !== 'cod' || !codEnabled) {
      setError('Only cash on delivery is available right now.')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Soft revalidate for cart UI; authoritative stock lock happens in place_checkout_orders.
      const productIds = items.map((item) => item.id)
      const { data: liveProducts, error: liveError } = await supabase
        .from('products')
        .select('id, name, price, price_pkr, price_aed, delivery_charge, location, images, is_active, inventory')
        .in('id', productIds)

      if (liveError) throw liveError

      const liveById = new Map((liveProducts || []).map((row) => [row.id, row]))
      const syncedItems = []
      for (const item of items) {
        const live = liveById.get(item.id)
        if (!live || !live.is_active) {
          setError(`${item.name} is no longer available. Remove it from your cart to continue.`)
          setLoading(false)
          return
        }
        if (Number(live.inventory) < item.quantity) {
          setError(`${item.name} only has ${live.inventory} in stock.`)
          setLoading(false)
          return
        }
        const preferPkr = item.currency === 'PKR'
        const price = preferPkr
          ? Number(live.price_pkr) || Number(live.price) || item.price
          : Number(live.price_aed) || Number(live.price) || item.price
        const location =
          live.location === 'Pakistan' || live.location === 'UAE'
            ? live.location
            : item.location
        syncedItems.push({
          ...item,
          name: live.name || item.name,
          price,
          delivery_charge: Number(live.delivery_charge) || 0,
          location,
          image: Array.isArray(live.images) && live.images[0] ? live.images[0] : item.image,
        })
      }

      replaceItems(syncedItems)

      const { data: placed, error: placeError } = await supabase.rpc('place_checkout_orders', {
        p_customer_email: form.email,
        p_customer_phone: form.phone,
        p_shipping_address: {
          full_name: form.fullName,
          address: form.address,
          city: form.city,
          country: form.country,
          postal_code: form.postalCode,
        },
        p_payment_method: 'cod',
        p_items: syncedItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          currency: item.currency || 'AED',
        })),
      })

      if (placeError) throw placeError

      const orders = (placed as { orders?: Array<{ order_code?: string }> } | null)?.orders || []
      const codes = orders.map((o) => o.order_code).filter(Boolean) as string[]
      setOrderId(codes.length > 0 ? codes.join(', ') : 'placed')
      setOrderSuccess(true)
      clearCart()
    } catch (err) {
      console.error('Order error:', err)
      const message =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Failed to place order. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: 'PKR' | 'AED') =>
    currency === 'PKR' ? `₨ ${amount.toLocaleString('en-PK')}` : `AED ${amount.toLocaleString('en-AE')}`

  const inputClass =
    'w-full px-3 py-2 text-sm border border-[#2b2b2b]/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1F331F]/20 focus:border-[#1F331F]/30'

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="pt-20 pb-10 px-4 sm:px-5 lg:px-6 max-w-lg mx-auto text-center">
        <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-5 py-8">
          <h1
            className="text-[#2b2b2b] mb-1"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.35rem' }}
          >
            Your cart is empty
          </h1>
          <p className="text-[#696a67] text-sm mb-4">Add products before checkout</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full"
          >
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    const orderSteps = [
      { id: 1, name: 'Order Received', icon: CheckCircle, status: 'completed', description: 'Your order has been received' },
      { id: 2, name: 'Order Confirmed', icon: AlertCircle, status: 'pending', description: 'Waiting for confirmation' },
      { id: 3, name: 'Being Packaged', icon: Package, status: 'pending', description: 'Items being prepared' },
      { id: 4, name: 'Dispatched', icon: Send, status: 'pending', description: 'Out for delivery' },
      { id: 5, name: 'Delivered', icon: Home, status: 'pending', description: 'Order completed' },
    ]

    return (
      <div className="pt-20 pb-10 px-4 sm:px-5 lg:px-6 max-w-xl mx-auto">
        <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-5 py-6 text-center mb-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h1
            className="text-[#2b2b2b] mb-1"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.35rem' }}
          >
            Order placed
          </h1>
          <p className="text-sm text-[#696a67]">
            Order ID: <span className="font-mono font-bold text-[#2b2b2b]">{orderId}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-4 mb-3">
          <h2 className="text-sm font-semibold text-[#2b2b2b] mb-3">Order journey</h2>
          <div className="space-y-3">
            {orderSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${step.status === 'completed' ? 'text-[#2b2b2b]' : 'text-gray-500'}`}>
                    {step.name}
                  </p>
                  <p className="text-[11px] text-[#696a67]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/shop')}
            className="flex-1 bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-full"
          >
            Continue shopping
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 border border-[#1F331F] text-[#1F331F] text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-full"
          >
            My orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-8 px-4 sm:px-5 lg:px-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-2 mb-3">
        <h1
          className="text-[#2b2b2b] leading-tight"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)' }}
        >
          Checkout
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Left — account + shipping */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-4">
            <h2
              className="text-[#2b2b2b] leading-tight mb-3"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.05rem' }}
            >
              Account
            </h2>

            {authLoading ? (
              <p className="text-xs text-[#696a67]">Checking session…</p>
            ) : user ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[#fbfcf4] border border-[#2b2b2b]/08 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2b2b2b] truncate">
                    {user.email || user.phone || 'Signed in'}
                  </p>
                  <p className="text-[11px] text-[#696a67]">Shipping details unlocked below</p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] hover:text-[#2b2b2b] shrink-0"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#696a67]">
                  Sign in with your mobile number or email to continue checkout.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({ mode: 'signin', tab: 'phone', next: '/checkout' })
                  }
                  className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
                >
                  Sign in to checkout
                </button>
              </div>
            )}
          </div>

          {/* Shipping — only after auth */}
          {user && (
            <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-4">
              <h2
                className="text-[#2b2b2b] leading-tight mb-3"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.05rem' }}
              >
                Shipping information
              </h2>

              {error && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1">
                    <User className="w-3 h-3" /> Full name
                  </label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleInputChange} required className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1">
                      <Mail className="w-3 h-3" /> Email
                    </label>
                    <input type="email" name="email" value={form.email} onChange={handleInputChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1">
                      <Phone className="w-3 h-3" /> Phone
                    </label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} required className={inputClass} placeholder="+971… / +92…" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <input type="text" name="address" value={form.address} onChange={handleInputChange} required className={inputClass} placeholder="Street, apartment" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1 block">City</label>
                    <input type="text" name="city" value={form.city} onChange={handleInputChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1 block">Country</label>
                    {requiredCountry === 'mixed' ? (
                      <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-2">Order UAE & Pakistan items separately.</p>
                    ) : (
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleInputChange}
                        disabled={requiredCountry === 'Pakistan' || requiredCountry === 'UAE'}
                        className={`${inputClass} ${(requiredCountry === 'Pakistan' || requiredCountry === 'UAE') ? 'bg-gray-50' : ''}`}
                      >
                        <option value="UAE">UAE</option>
                        <option value="Pakistan">Pakistan</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1 block">
                    Postal code <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <input type="text" name="postalCode" value={form.postalCode} onChange={handleInputChange} className={inputClass} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">Payment</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {codEnabled ? (
                      <label
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer ${
                          form.paymentMethod === 'cod' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-[#2b2b2b]/10'
                        }`}
                      >
                        <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={handleInputChange} className="sr-only" />
                        <Truck className="w-3.5 h-3.5 text-[#1F331F] shrink-0" />
                        <span className="text-[11px] font-medium text-[#2b2b2b]">Cash on delivery</span>
                      </label>
                    ) : null}
                    <label
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${
                        cardEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${form.paymentMethod === 'card' ? 'border-[#E8B800] bg-[#fff9e0]' : 'border-[#2b2b2b]/10'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        className="sr-only"
                        disabled={!cardEnabled}
                      />
                      <CreditCard className="w-3.5 h-3.5 text-[#1F331F] shrink-0" />
                      <span className="text-[11px] font-medium text-[#2b2b2b]">Card (gateway soon)</span>
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] text-[#696a67]">
                    Card checkout is disabled until a payment provider is connected. COD only.
                  </p>
                  {!codEnabled ? (
                    <p className="mt-2 text-[11px] text-rose-600">Cash on delivery is disabled. Update Admin → Settings.</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    requiredCountry === 'mixed' ||
                    (!codEnabled && !cardEnabled) ||
                    (form.paymentMethod === 'card' && !cardEnabled) ||
                    (form.paymentMethod === 'cod' && !codEnabled)
                  }
                  className="w-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Placing order…' : 'Place order'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right — summary */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-4">
            <h2
              className="text-[#2b2b2b] leading-tight mb-3"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.05rem' }}
            >
              Order summary
            </h2>

            {pkrItems.length > 0 && (
              <div className="mb-3 pb-3 border-b border-[#2b2b2b]/08">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-2">Pakistan · PKR</p>
                {pkrItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                    <img src={item.image} alt={item.name} className="w-11 h-11 object-cover rounded-lg bg-[#f0ece0]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2b2b2b] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#696a67]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-[#2b2b2b] shrink-0">{formatCurrency(item.price * item.quantity, 'PKR')}</p>
                  </div>
                ))}
              </div>
            )}

            {aedItems.length > 0 && (
              <div className="mb-3 pb-3 border-b border-[#2b2b2b]/08">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-2">UAE · AED</p>
                {aedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                    <img src={item.image} alt={item.name} className="w-11 h-11 object-cover rounded-lg bg-[#f0ece0]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2b2b2b] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#696a67]">Qty {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-[#2b2b2b] shrink-0">{formatCurrency(item.price * item.quantity, 'AED')}</p>
                  </div>
                ))}
              </div>
            )}

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
              <div className="border-t border-[#2b2b2b]/08 pt-2 mt-2 space-y-1">
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
          </div>

          <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 px-4 py-3 flex flex-wrap items-center gap-3 text-[11px] text-[#696a67]">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-600" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#1F331F]" /> Verified sellers
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <PageFrame frameColor="#B5C7EB">
      <CheckoutInner />
    </PageFrame>
  )
}
