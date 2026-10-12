import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  Plus,
  Search, 
  ChevronDown, 
  Bell,
  Grid3X3,
  Table as TableIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  LogOut,
  X,
  Eye
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface Order {
  id: string
  order_code: string
  customer_email: string
  status: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

interface Product {
  id: string
  name: string
  subtitle?: string | null
  description: string | null
  how_to_use?: string | null
  ingredients?: string | null
  brand_name?: string | null
  brand_logo?: string | null
  seller_name?: string | null
  price: number
  price_pkr?: number | null
  price_aed?: number | null
  compare_at_price: number | null
  inventory: number
  low_stock_threshold: number
  category: string | null
  location: string
  delivery_charge: number
  images: string[]
  is_active: boolean
  is_featured: boolean
  sku: string | null
  weight: number | null
  discount_percent: number
  tags: string[]
  tag1: string | null
  tag2: string | null
  skin_type?: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  sold?: number
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

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [userName, setUserName] = useState('Admin')
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'active' | 'low' | 'out'>('all')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  const openProductEditor = useCallback((productId?: string) => {
    navigate(productId ? `/products/${productId}` : '/products/new')
  }, [navigate])

  const fetchOrdersForNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      const ordersWithTime = data.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at)
      }))
      setAllOrders(ordersWithTime)
      
      const last24Hours = new Date()
      last24Hours.setHours(last24Hours.getHours() - 24)
      const recentOrders = data.filter((o: Order) => new Date(o.created_at) > last24Hours)
      setNewOrdersCount(recentOrders.length)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const [{ data: productsData, error }, { data: ordersData }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('items,status'),
      ])

      if (error) {
        console.error('Error fetching products:', error)
        return
      }

      const soldByProduct = new Map<string, number>()
      for (const order of ordersData || []) {
        const status = String((order as { status?: string }).status || '')
        if (!['Delivered', 'Order Completed', 'Dispatched', 'Being Packaged', 'Order Confirmed'].includes(status)) {
          continue
        }
        const items = Array.isArray((order as { items?: unknown }).items)
          ? ((order as { items: Array<{ product_id?: string; quantity?: number }> }).items)
          : []
        for (const item of items) {
          if (!item?.product_id) continue
          soldByProduct.set(
            item.product_id,
            (soldByProduct.get(item.product_id) || 0) + (Number(item.quantity) || 0),
          )
        }
      }

      const productsWithSold = (productsData || []).map((p: Product) => ({
        ...p,
        sold: soldByProduct.get(p.id) || 0,
      }))

      setProducts(productsWithSold)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInitialData = useCallback(() => {
    void fetchProducts()
    void fetchUserName()
    void fetchOrdersForNotifications()
  }, [fetchProducts, fetchUserName, fetchOrdersForNotifications])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadInitialData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadInitialData])

  const query = searchQuery.toLowerCase()
  const matchesSearch = (product: Pick<Product, 'name' | 'subtitle' | 'sku' | 'category' | 'brand_name' | 'seller_name'>) => [
    product.name,
    product.subtitle || '',
    product.sku || '',
    product.category || '',
    product.brand_name || '',
    product.seller_name || '',
  ].some((value) => value.toLowerCase().includes(query))

  const filteredProducts = products.filter(matchesSearch)

  // Calculate stats
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const lowStockProducts = products.filter(p => p.inventory <= p.low_stock_threshold && p.inventory > 0).length
  const outOfStockProducts = products.filter(p => p.inventory === 0).length

  const stats = [
    { label: 'Total Products', value: totalProducts, color: 'text-indigo-600', filter: 'all' as const, icon: Package },
    { label: 'Active', value: activeProducts, color: 'text-emerald-600', filter: 'active' as const, icon: CheckCircle2 },
    { label: 'Low Stock', value: lowStockProducts, color: 'text-amber-600', filter: 'low' as const, icon: AlertTriangle },
    { label: 'Out of Stock', value: outOfStockProducts, color: 'text-red-600', filter: 'out' as const, icon: XCircle }
  ]

  const formatPrice = (product: Product) => {
    const parts: string[] = []
    if (product.price_aed != null && product.price_aed > 0) parts.push(`AED ${product.price_aed.toFixed(0)}`)
    if (product.price_pkr != null && product.price_pkr > 0) parts.push(`₨${product.price_pkr.toLocaleString()}`)
    if (parts.length === 0) parts.push(product.price > 0 ? `AED ${product.price.toFixed(0)}` : '—')
    return parts.join(' · ')
  }

  const formatLocations = (location: string) => {
    if (!location?.trim()) return '—'
    return location
      .split(',')
      .map((part) => part.trim().split(':')[0])
      .filter(Boolean)
      .join(', ')
  }

  const getStatusBadge = (product: Product) => {
    if (product.inventory === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-100">
          Out of stock
        </span>
      )
    }
    if (product.inventory <= product.low_stock_threshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle className="w-3 h-3" />
          Low stock
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        Active
      </span>
    )
  }

  // Apply inventory filter
  const inventoryFilteredProducts = filteredProducts.filter(product => {
    if (inventoryFilter === 'all') return true
    if (inventoryFilter === 'active') return product.is_active
    if (inventoryFilter === 'low') return product.inventory <= product.low_stock_threshold && product.inventory > 0
    if (inventoryFilter === 'out') return product.inventory === 0
    return true
  })

  const displayProducts = inventoryFilteredProducts

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        {/* Top bar — matches product editor chrome */}
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Products</h1>
              <p className="text-[11px] text-gray-500">Catalog, partner assignment, and fulfilment.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openProductEditor()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add product
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
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
                            <p className="text-[11px] text-gray-600 truncate">{order.shipping_address?.full_name || order.customer_email}</p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-[#E8E0D4] bg-[#F7F2E8]">
                      <button
                        type="button"
                        onClick={() => { setShowNotifications(false); navigate('/orders') }}
                        className="w-full py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-white rounded-lg"
                      >
                        View all orders
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 p-0.5 pr-2 hover:bg-white rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
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
                        onClick={handleLogout}
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

        <div className="px-4 py-4 sm:px-6 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {stats.map((stat) => {
              const Icon = stat.icon
              const active = inventoryFilter === stat.filter
              return (
                <button
                  key={stat.filter}
                  type="button"
                  onClick={() => setInventoryFilter(stat.filter)}
                  className={`rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'border-indigo-400 ring-2 ring-indigo-500/15'
                      : 'border-[#D9D0C2] hover:border-[#C9BEAE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('600', '50')}`}>
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]/50">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, SKU, partner…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#F0E9DC] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      Grid
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E0D4] bg-[#F7F2E8]/40">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Locations</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">Loading products…</td>
                      </tr>
                    ) : displayProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">No products found</td>
                      </tr>
                    ) : (
                      displayProducts.map((product) => (
                        <tr
                          key={product.id}
                          tabIndex={0}
                          onClick={() => openProductEditor(product.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openProductEditor(product.id)
                            }
                          }}
                          className="group border-b border-[#F0E9DC] last:border-0 cursor-pointer hover:bg-[#F7F2E8]/70 transition-colors focus:bg-[#F7F2E8] focus:outline-none"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-[#F0E9DC] border border-[#D9D0C2] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {product.subtitle || product.category || '—'}
                                  {product.skin_type ? ` · ${product.skin_type}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-600 font-mono">{product.sku || '—'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-700">{product.seller_name || product.brand_name || '—'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-600">{formatLocations(product.location)}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{formatPrice(product)}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs ${product.inventory <= product.low_stock_threshold ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {product.inventory}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {getStatusBadge(product)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="col-span-full rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8] px-4 py-8 text-center text-xs text-gray-500">
                    Loading products…
                  </div>
                ) : displayProducts.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8] px-4 py-8 text-center text-xs text-gray-500">
                    No products found
                  </div>
                ) : (
                  displayProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProductEditor(product.id)}
                      className="group rounded-xl border border-[#D9D0C2] bg-white p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <div className="relative overflow-hidden rounded-lg bg-[#F0E9DC] aspect-[4/3] border border-[#E8E0D4]">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute left-2 top-2">
                          {getStatusBadge(product)}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {product.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-gray-500 truncate">
                            {product.seller_name || product.brand_name || 'No partner'} · {formatLocations(product.location)}
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F2E8] text-gray-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/60 px-2 py-1.5">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Price</p>
                          <p className="font-medium text-gray-900 truncate">{formatPrice(product)}</p>
                        </div>
                        <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/60 px-2 py-1.5">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Stock</p>
                          <p className="font-medium text-gray-900">{product.inventory}</p>
                        </div>
                        <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/60 px-2 py-1.5">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">SKU</p>
                          <p className="font-medium text-gray-900 font-mono">{product.sku || '—'}</p>
                        </div>
                        <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/60 px-2 py-1.5">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Sold</p>
                          <p className="font-medium text-gray-900">{product.sold || 0}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

