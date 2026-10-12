import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Package,
  LogOut,
  ShoppingBag,
  ChevronRight,
  MapPin,
  CheckCircle,
  AlertCircle,
  Send,
  Home,
} from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { supabase } from '../lib/supabase'
import PageFrame from '../components/PageFrame'

interface Order {
  id: string
  order_code: string
  status: string
  created_at: string
  items: Array<{
    name: string
    quantity: number
    price: number
    currency: string
  }>
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
  shipping_address: {
    full_name: string
    city: string
    country: string
  }
}

interface ProfileRow {
  full_name: string
  phone: string
  address: string
  city: string
  country: string
  postal_code: string
}

const ORDER_STEPS = [
  { id: 1, name: 'Order Received', icon: CheckCircle },
  { id: 2, name: 'Order Confirmed', icon: AlertCircle },
  { id: 3, name: 'Being Packaged', icon: Package },
  { id: 4, name: 'Dispatched', icon: Send },
  { id: 5, name: 'Delivered', icon: Home },
]

const emptyProfile: ProfileRow = {
  full_name: '',
  phone: '',
  address: '',
  city: '',
  country: 'UAE',
  postal_code: '',
}

function ProfileInner() {
  const navigate = useNavigate()
  const { user, signOut, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses'>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow>(emptyProfile)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/signin')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user?.id) return
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile({
        full_name: data?.full_name || user.full_name || '',
        phone: data?.phone || user.phone || '',
        address: data?.address || '',
        city: data?.city || '',
        country: data?.country || 'UAE',
        postal_code: data?.postal_code || '',
      })
    }
    void loadProfile()
  }, [user])

  useEffect(() => {
    if (user && activeTab === 'orders') void fetchOrders()
  }, [user, activeTab])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching orders:', error)
    else setOrders((data || []) as Order[])
    setOrdersLoading(false)
  }

  const saveProfile = async (mode: 'overview' | 'addresses') => {
    if (!user?.id) return
    setProfileSaving(true)
    setProfileMessage('')
    setProfileError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name.trim() || null,
      phone: profile.phone.trim() || null,
      address: profile.address.trim() || null,
      city: profile.city.trim() || null,
      country: profile.country.trim() || null,
      postal_code: profile.postal_code.trim() || null,
      updated_at: new Date().toISOString(),
    })
    if (error) setProfileError(error.message)
    else setProfileMessage(mode === 'addresses' ? 'Address saved' : 'Profile saved')
    setProfileSaving(false)
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount) return '-'
    return currency === 'PKR'
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const getOrderProgress = (status: string) => {
    const index = ORDER_STEPS.findIndex((step) => step.name === status)
    return index >= 0 ? ((index + 1) / ORDER_STEPS.length) * 100 : 0
  }

  const getCurrentStepIndex = (status: string) =>
    ORDER_STEPS.findIndex((step) => step.name === status)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = profile.full_name || user?.full_name || 'User'
  const displayEmail = user?.email || 'Phone account'
  const avatarLetter = (displayName || displayEmail || 'U').charAt(0).toUpperCase()

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD6B0] border-t-[#2b2b2b] rounded-full animate-spin" />
      </div>
    )
  }

  const fieldClass =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-[#2b2b2b]/10 bg-[#fbfcf4] focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15'
  const labelClass = 'block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5'

  return (
    <div className="pt-20 pb-10 px-4 sm:px-5 lg:px-6 max-w-5xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#1F331F] rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {avatarLetter}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-[#2b2b2b] truncate">{displayName}</h2>
                <p className="text-xs text-[#696a67] truncate">{displayEmail}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {(
                [
                  ['overview', 'Overview', User],
                  ['orders', 'Orders', Package],
                  ['addresses', 'Addresses', MapPin],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-[#1F331F] text-white'
                      : 'text-[#2b2b2b] hover:bg-[#fbfcf4]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          {activeTab === 'overview' && (
            <>
              <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-4 space-y-3">
                <h3 className="text-base font-semibold text-[#2b2b2b]">Account information</h3>
                {profileError ? <p className="text-xs text-rose-600">{profileError}</p> : null}
                {profileMessage ? <p className="text-xs text-emerald-700">{profileMessage}</p> : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Full name</label>
                    <input
                      className={fieldClass}
                      value={profile.full_name}
                      onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      className={fieldClass}
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+971…"
                    />
                  </div>
                  <div className="md:col-span-2 p-3 rounded-xl bg-[#fbfcf4] border border-[#2b2b2b]/08">
                    <div className="flex items-center gap-2 text-[#696a67] text-xs mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                    <p className="text-sm font-medium text-[#2b2b2b]">{displayEmail}</p>
                    {!user.email ? (
                      <p className="text-[11px] text-[#696a67] mt-1">Signed in with WhatsApp</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={() => void saveProfile('overview')}
                  className="px-5 py-2.5 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </button>
              </div>

              <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-4">
                <h3 className="text-base font-semibold text-[#2b2b2b] mb-3">Quick actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="flex items-center justify-between p-3 border border-[#2b2b2b]/10 rounded-xl hover:border-[#1F331F]/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-[#2b2b2b]">
                      <ShoppingBag className="w-4 h-4" /> Continue shopping
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#696a67]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center justify-between p-3 border border-[#2b2b2b]/10 rounded-xl hover:border-[#1F331F]/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-[#2b2b2b]">
                      <Package className="w-4 h-4" /> View orders
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#696a67]" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-4">
              <h3 className="text-base font-semibold text-[#2b2b2b] mb-3">Order history</h3>
              {ordersLoading ? (
                <p className="text-sm text-[#696a67] py-8 text-center">Loading orders…</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-12 h-12 text-[#2b2b2b]/20 mx-auto mb-3" />
                  <p className="text-sm text-[#696a67] mb-4">No orders yet</p>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="px-5 py-2.5 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
                  >
                    Start shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const currentStepIndex = getCurrentStepIndex(order.status)
                    return (
                      <div key={order.id} className="border border-[#2b2b2b]/08 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          className="w-full p-3 bg-[#fbfcf4] text-left hover:bg-[#f0ece0] transition-colors"
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-mono font-bold text-sm text-[#1F331F]">
                                {order.order_code}
                              </p>
                              <p className="text-[11px] text-[#696a67]">{formatDate(order.created_at)}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-[#2b2b2b]/08 text-[#2b2b2b]">
                              {order.status}
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-[#2b2b2b]/10 rounded-full h-1.5">
                            <div
                              className="bg-[#1F331F] h-1.5 rounded-full"
                              style={{ width: `${getOrderProgress(order.status)}%` }}
                            />
                          </div>
                        </button>
                        {expandedOrder === order.id ? (
                          <div className="p-3 space-y-3">
                            <div className="space-y-2">
                              {ORDER_STEPS.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex
                                return (
                                  <div key={step.id} className="flex items-center gap-2">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                        isCompleted
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-[#f0ece0] text-[#696a67]'
                                      }`}
                                    >
                                      <step.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <p
                                      className={`text-xs ${
                                        isCompleted ? 'text-[#2b2b2b] font-medium' : 'text-[#696a67]'
                                      }`}
                                    >
                                      {step.name}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="border-t border-[#2b2b2b]/08 pt-3 space-y-1.5">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-[#2b2b2b]">
                                  <span>
                                    {item.name} ×{item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(item.price * item.quantity, item.currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-4 space-y-3">
              <h3 className="text-base font-semibold text-[#2b2b2b]">Shipping address</h3>
              <p className="text-[11px] text-[#696a67]">
                Saved to your profile and used to autofill checkout.
              </p>
              {profileError ? <p className="text-xs text-rose-600">{profileError}</p> : null}
              {profileMessage ? <p className="text-xs text-emerald-700">{profileMessage}</p> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={labelClass}>Street address</label>
                  <input
                    className={fieldClass}
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={fieldClass}
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <select
                    className={fieldClass}
                    value={profile.country}
                    onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                  >
                    <option value="UAE">UAE</option>
                    <option value="Pakistan">Pakistan</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Postal code</label>
                  <input
                    className={fieldClass}
                    value={profile.postal_code}
                    onChange={(e) => setProfile((p) => ({ ...p, postal_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#696a67]" />
                    <input
                      className={`${fieldClass} pl-9`}
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => void saveProfile('addresses')}
                className="px-5 py-2.5 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save address'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <PageFrame frameColor="#FFD6B0">
      <ProfileInner />
    </PageFrame>
  )
}
