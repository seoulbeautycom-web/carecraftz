import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Pencil, Trash2, Save, X, Bell, ChevronDown, Settings, LogOut, Eye } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface SkinTypeProduct {
  id: string
  name: string
  images: string[]
  skin_type: string | null
}

interface Order {
  id: string
  order_code: string
  customer_email: string
  status: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

const SKIN_TYPES = [
  { label: 'Oily',      color: 'bg-lime-100 text-lime-700 border-lime-200',      pill: 'bg-lime-400',   desc: 'Excess sebum production, enlarged pores, prone to acne' },
  { label: 'Dry',       color: 'bg-orange-100 text-orange-700 border-orange-200', pill: 'bg-orange-300', desc: 'Tight, flaky or rough texture, lacks moisture' },
  { label: 'Combo',     color: 'bg-teal-100 text-teal-700 border-teal-200',       pill: 'bg-teal-300',   desc: 'Oily T-zone, normal or dry cheeks' },
  { label: 'Sensitive', color: 'bg-blue-100 text-blue-700 border-blue-200',       pill: 'bg-blue-300',   desc: 'Reactive, easily irritated, redness-prone' },
]

export default function SkinTypes() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  const [activeType, setActiveType] = useState('Oily')
  const [products, setProducts] = useState<SkinTypeProduct[]>([])
  const [allProducts, setAllProducts] = useState<SkinTypeProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [newSkinType, setNewSkinType] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchUserName()
    fetchOrdersForNotifications()
    fetchAllProducts()
  }, [])

  useEffect(() => {
    const filtered = allProducts.filter(p => p.skin_type === activeType)
    setProducts(filtered)
  }, [activeType, allProducts])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const fetchOrdersForNotifications = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) {
      setAllOrders(data.map((o: Order) => ({ ...o, time_ago: getTimeAgo(o.created_at) })))
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNewOrdersCount(data.filter((o: Order) => new Date(o.created_at) > last24h).length)
    }
  }

  const fetchAllProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('id, name, images, skin_type').order('name')
    if (data) setAllProducts(data)
    setLoading(false)
  }

  const handleAssignSkinType = async (productId: string, skinType: string) => {
    setSaving(true)
    const { error } = await supabase.from('products').update({ skin_type: skinType }).eq('id', productId)
    if (error) {
      showToast('Failed to update skin type', 'error')
    } else {
      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, skin_type: skinType } : p))
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
      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, skin_type: null } : p))
      showToast('Skin type removed')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const unassignedProducts = allProducts.filter(p => !p.skin_type)

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Top Nav */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Skin Types</h1>
              <p className="text-sm text-gray-500">Assign products to skin type categories for the homepage section.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
                  {newOrdersCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">New Orders</h3>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <div className="p-8 text-center"><Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No new orders in the last 24 hours</p></div>
                      ) : allOrders.slice(0, 5).map((order) => (
                        <div key={order.id} onClick={() => { setShowNotifications(false); navigate('/orders') }} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{order.order_code}</span>
                            <span className="text-xs text-gray-500">{order.time_ago}</span>
                          </div>
                          <p className="text-sm text-gray-600">{order.shipping_address?.full_name || order.customer_email}</p>
                          <Eye className="w-3.5 h-3.5 text-gray-400 mt-1" />
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button onClick={() => { setShowNotifications(false); navigate('/orders') }} className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg">View all orders</button>
                    </div>
                  </div>
                )}
              </div>
              {/* Profile */}
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">{userName.charAt(0)}</div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100"><p className="font-semibold text-gray-900">{userName}</p><p className="text-sm text-gray-500">Store Owner</p></div>
                    <div className="p-2">
                      <button onClick={() => { setShowProfileMenu(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"><Settings className="w-4 h-4" /> Settings</button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl"><LogOut className="w-4 h-4" /> Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Skin Type Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SKIN_TYPES.map((type) => {
              const count = allProducts.filter(p => p.skin_type === type.label).length
              return (
                <button
                  key={type.label}
                  onClick={() => setActiveType(type.label)}
                  className={`bg-white rounded-2xl p-5 border-2 text-left transition-all hover:shadow-md ${
                    activeType === type.label ? 'border-indigo-400 shadow-md ring-2 ring-indigo-500/20' : 'border-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${type.color}`}>
                    <Droplets className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm font-semibold text-gray-700">{type.label} Skin</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{type.desc}</p>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Skin Type Products */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {SKIN_TYPES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => setActiveType(t.label)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        activeType === t.label ? t.color + ' border-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{products.length} products</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center">
                  <Droplets className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No products assigned to {activeType} skin yet</p>
                  <p className="text-sm text-gray-400 mt-1">Assign products from the unassigned list on the right</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🌿</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        {editingProduct === product.id ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <select
                              value={newSkinType}
                              onChange={(e) => setNewSkinType(e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {SKIN_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                            </select>
                            <button onClick={() => handleAssignSkinType(product.id, newSkinType)} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${SKIN_TYPES.find(t => t.label === product.skin_type)?.color || ''}`}>
                            {product.skin_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingProduct(product.id); setNewSkinType(product.skin_type || 'Oily') }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSkinType(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Unassigned Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Unassigned Products</h3>
                <p className="text-xs text-gray-400 mt-0.5">{unassignedProducts.length} products need a skin type</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {unassignedProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400">All products are assigned! 🎉</p>
                  </div>
                ) : (
                  unassignedProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">🌿</div>
                        )}
                      </div>
                      <p className="flex-1 text-sm text-gray-700 truncate">{product.name}</p>
                      <div className="flex gap-1">
                        {SKIN_TYPES.map(t => (
                          <button
                            key={t.label}
                            onClick={() => handleAssignSkinType(product.id, t.label)}
                            title={`Assign to ${t.label}`}
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all hover:scale-110 ${t.color}`}
                          >
                            {t.label[0]}
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

