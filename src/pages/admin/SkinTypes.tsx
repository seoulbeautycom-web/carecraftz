import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  Droplets,
  LogOut,
  Pencil,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface SkinTypeProduct {
  id: string
  name: string
  images: string[]
  skin_type: string | null
}

interface HeaderOrder {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

const SKIN_TYPES = [
  { label: 'Oily', color: 'bg-lime-50 text-lime-700 border-lime-200', desc: 'Excess sebum, enlarged pores, acne-prone' },
  { label: 'Dry', color: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'Tight, flaky, or rough — needs moisture' },
  { label: 'Combo', color: 'bg-teal-50 text-teal-700 border-teal-200', desc: 'Oily T-zone with normal or dry cheeks' },
  { label: 'Sensitive', color: 'bg-sky-50 text-sky-700 border-sky-200', desc: 'Reactive, easily irritated, redness-prone' },
] as const

type SkinTypeLabel = (typeof SKIN_TYPES)[number]['label']

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

export default function SkinTypes() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  const [activeType, setActiveType] = useState<SkinTypeLabel>('Oily')
  const [allProducts, setAllProducts] = useState<SkinTypeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [newSkinType, setNewSkinType] = useState<SkinTypeLabel>('Oily')
  const [saving, setSaving] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<HeaderOrder[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const part = session.user.email.split('@')[0]
      setUserName(part.charAt(0).toUpperCase() + part.slice(1))
    }
  }, [])

  const fetchOrdersForNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_code, customer_email, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setAllOrders(data.map((order: HeaderOrder) => ({ ...order, time_ago: getTimeAgo(order.created_at) })))
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNewOrdersCount(data.filter((order: HeaderOrder) => new Date(order.created_at) > last24h).length)
    }
  }, [])

  const fetchAllProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('id, name, images, skin_type').order('name')
    if (data) setAllProducts(data as SkinTypeProduct[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchUserName()
    void fetchOrdersForNotifications()
    void fetchAllProducts()
  }, [fetchUserName, fetchOrdersForNotifications, fetchAllProducts])

  const products = useMemo(
    () => allProducts.filter((product) => product.skin_type === activeType),
    [allProducts, activeType],
  )
  const unassignedProducts = useMemo(
    () => allProducts.filter((product) => !product.skin_type),
    [allProducts],
  )

  const handleAssignSkinType = async (productId: string, skinType: string) => {
    setSaving(true)
    const { error } = await supabase.from('products').update({ skin_type: skinType }).eq('id', productId)
    if (error) {
      showToast('Failed to update skin type', 'error')
    } else {
      setAllProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, skin_type: skinType } : p)))
      setEditingProduct(null)
      showToast(`Assigned to ${skinType}`)
    }
    setSaving(false)
  }

  const handleRemoveSkinType = async (productId: string) => {
    setSaving(true)
    const { error } = await supabase.from('products').update({ skin_type: null }).eq('id', productId)
    if (error) {
      showToast('Failed to remove skin type', 'error')
    } else {
      setAllProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, skin_type: null } : p)))
      showToast('Skin type removed')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[100] rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Skin Types</h1>
              <p className="text-[11px] text-gray-500">Assign products to skin type categories for the homepage.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                  }}
                  className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {newOrdersCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E8E0D4] flex items-center justify-between bg-[#F7F2E8]">
                      <h3 className="text-xs font-semibold text-gray-900">New orders</h3>
                      <button type="button" onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        allOrders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => { setShowNotifications(false); navigate('/orders') }}
                            className="w-full text-left px-3 py-2.5 border-b border-[#F0E9DC] hover:bg-[#F7F2E8] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-[10px] text-gray-400">{order.time_ago}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 truncate">
                              {order.shipping_address?.full_name || order.customer_email}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu)
                    setShowNotifications(false)
                  }}
                  className="flex items-center gap-1.5 p-1 pr-2 hover:bg-white rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]">
                      <p className="text-xs font-semibold text-gray-900">{userName}</p>
                      <p className="text-[10px] text-gray-500">Staff access</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => { setShowProfileMenu(false); navigate('/settings') }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-700 hover:bg-[#F7F2E8] rounded-lg"
                      >
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SKIN_TYPES.map((type) => {
              const count = allProducts.filter((p) => p.skin_type === type.label).length
              const isActive = activeType === type.label
              return (
                <button
                  key={type.label}
                  type="button"
                  onClick={() => setActiveType(type.label)}
                  className={`rounded-xl border bg-white p-3.5 text-left transition-all ${
                    isActive
                      ? 'border-indigo-400 ring-1 ring-indigo-500/20 shadow-sm'
                      : 'border-[#D9D0C2] hover:border-indigo-300'
                  }`}
                >
                  <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border ${type.color}`}>
                    <Droplets className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs font-semibold text-gray-800">{type.label}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">{type.desc}</p>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#FBF8F2] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {SKIN_TYPES.map((type) => (
                    <button
                      key={type.label}
                      type="button"
                      onClick={() => setActiveType(type.label)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        activeType === type.label
                          ? `${type.color}`
                          : 'border-[#E8E0D4] bg-white text-gray-500 hover:bg-[#F7F2E8]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500">{products.length} products</span>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-gray-500">Loading products…</div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center">
                  <Droplets className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No products for {activeType}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Assign from the unassigned list.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#F0E9DC]">
                  {products.map((product) => (
                    <li key={product.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Droplets className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        {editingProduct === product.id ? (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <select
                              value={newSkinType}
                              onChange={(e) => setNewSkinType(e.target.value as SkinTypeLabel)}
                              className="rounded-md border border-[#D9D0C2] bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {SKIN_TYPES.map((type) => (
                                <option key={type.label} value={type.label}>{type.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void handleAssignSkinType(product.id, newSkinType)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(null)}
                              className="p-1 text-gray-400 hover:bg-[#F7F2E8] rounded-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                              SKIN_TYPES.find((t) => t.label === product.skin_type)?.color || ''
                            }`}
                          >
                            {product.skin_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product.id)
                            setNewSkinType((product.skin_type as SkinTypeLabel) || 'Oily')
                          }}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-[#F7F2E8] rounded-lg"
                          title="Change type"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemoveSkinType(product.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#FBF8F2]">
                <p className="text-xs font-semibold text-gray-800">Unassigned</p>
                <p className="text-[11px] text-gray-500">{unassignedProducts.length} products need a skin type</p>
              </div>
              <div className="max-h-[32rem] overflow-y-auto divide-y divide-[#F0E9DC]">
                {unassignedProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[11px] text-gray-500">All products are assigned.</p>
                  </div>
                ) : (
                  unassignedProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Droplets className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-xs text-gray-800">{product.name}</p>
                      <div className="flex gap-1 shrink-0">
                        {SKIN_TYPES.map((type) => (
                          <button
                            key={type.label}
                            type="button"
                            disabled={saving}
                            onClick={() => void handleAssignSkinType(product.id, type.label)}
                            title={`Assign to ${type.label}`}
                            className={`h-6 w-6 rounded-full border text-[10px] font-bold transition-transform hover:scale-110 ${type.color}`}
                          >
                            {type.label[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
