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
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        return
      }

      // Add sample sold data
      const productsWithSold = (productsData || []).map((p: Product, i: number) => ({
        ...p,
        sold: [284, 156, 143, 122, 98, 85, 64][i % 7] || 0
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

  const formatPrice = (price: number) => {
    return `$${price.toFixed(0)}`
  }

  const getStatusBadge = (product: Product) => {
    if (product.inventory === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Out of Stock
        </span>
      )
    }
    if (product.inventory <= product.low_stock_threshold) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        Active
      </span>
    )
  }

  // Sample products for demo
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Calendula & Oat Soap',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 12,
      compare_at_price: null,
      inventory: 84,
      low_stock_threshold: 10,
      category: 'Face',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-001',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 284
    },
    {
      id: '2',
      name: 'Whipped Shea Body Butter',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 22,
      compare_at_price: null,
      inventory: 56,
      low_stock_threshold: 10,
      category: 'Body',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-002',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 156
    },
    {
      id: '3',
      name: 'Rosehip Facial Serum',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 38,
      compare_at_price: null,
      inventory: 32,
      low_stock_threshold: 10,
      category: 'Serums',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-003',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 143
    },
    {
      id: '4',
      name: 'Lavender Dream Soap',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 14,
      compare_at_price: null,
      inventory: 10,
      low_stock_threshold: 15,
      category: 'Body',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-004',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 122
    },
    {
      id: '5',
      name: 'Green Clay Detox Mask',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 28,
      compare_at_price: null,
      inventory: 0,
      low_stock_threshold: 10,
      category: 'Face',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-005',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 98
    },
    {
      id: '6',
      name: 'Botanical Bath Salts',
      description: '',
      brand_name: 'CareCraftz',
      brand_logo: '',
      seller_name: 'CareCraftz Official',
      price: 18,
      compare_at_price: null,
      inventory: 63,
      low_stock_threshold: 10,
      category: 'Bath',
      location: 'UAE',
      delivery_charge: 0,
      images: [],
      is_active: true,
      is_featured: false,
      sku: 'SKU-006',
      weight: null,
      discount_percent: 0,
      tags: [],
      tag1: null,
      tag2: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      sold: 58
    }
  ]

  // Apply inventory filter
  const inventoryFilteredProducts = filteredProducts.filter(product => {
    if (inventoryFilter === 'all') return true
    if (inventoryFilter === 'active') return product.is_active
    if (inventoryFilter === 'low') return product.inventory <= product.low_stock_threshold && product.inventory > 0
    if (inventoryFilter === 'out') return product.inventory === 0
    return true
  })

  const usingDemoProducts = products.length === 0
  const displayProducts = usingDemoProducts
    ? sampleProducts.filter((product) => {
        if (!matchesSearch(product)) return false
        if (inventoryFilter === 'all') return true
        if (inventoryFilter === 'active') return product.is_active
        if (inventoryFilter === 'low') return product.inventory <= product.low_stock_threshold && product.inventory > 0
        if (inventoryFilter === 'out') return product.inventory === 0
        return true
      })
    : inventoryFilteredProducts

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500">Manage your product catalog and inventory.</p>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-4">
              {/* Notification Button with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {newOrdersCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">New Orders</h3>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        allOrders.slice(0, 5).map((order) => (
                          <div 
                            key={order.id}
                            onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-xs text-gray-500">{order.time_ago}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{order.shipping_address?.full_name || order.customer_email}</p>
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                      >
                        View all orders
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Button with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">Store Owner</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Clickable Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <button
                  key={index}
                  onClick={() => setInventoryFilter(stat.filter)}
                  className={`bg-white rounded-2xl p-6 shadow-sm border text-left transition-all hover:shadow-md ${
                    inventoryFilter === stat.filter ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('600', '100')}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Products Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* View Toggle & Add Button */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TableIcon className="w-4 h-4" />
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Grid
                    </button>
                  </div>
                  <button
                    onClick={() => openProductEditor()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Skin Type</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sold</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : displayProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      displayProducts.map((product) => (
                        <tr
                          key={product.id}
                          tabIndex={0}
                          onClick={() => openProductEditor(usingDemoProducts ? undefined : product.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openProductEditor(usingDemoProducts ? undefined : product.id)
                            }
                          }}
                          className="group border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {product.name}
                                  </span>
                                  {product.brand_name && (
                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                                      {product.brand_name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {product.brand_name || 'No brand yet'}{product.seller_name ? ` • Seller: ${product.seller_name}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{product.sku || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{product.category || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            {product.skin_type ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                product.skin_type === 'Oily' ? 'bg-lime-100 text-lime-700' :
                                product.skin_type === 'Dry' ? 'bg-orange-100 text-orange-700' :
                                product.skin_type === 'Combo' ? 'bg-teal-100 text-teal-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {product.skin_type}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm ${product.inventory <= product.low_stock_threshold ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {product.inventory}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-emerald-600">
                              <span className="text-emerald-500">↗</span>
                              {product.sold || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(product)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="col-span-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-10 text-center text-gray-500">
                    Loading products...
                  </div>
                ) : displayProducts.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-10 text-center text-gray-500">
                    No products found
                  </div>
                ) : (
                  displayProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProductEditor(usingDemoProducts ? undefined : product.id)}
                      className="group rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3]">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3">
                          {getStatusBadge(product)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {product.name}
                            </h3>
                            {product.brand_name && (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                                {product.brand_name}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {product.subtitle || product.description || 'No description added yet.'}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                          <Eye className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-gray-400">Price</p>
                          <p className="font-medium text-gray-900">{formatPrice(product.price)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-gray-400">Stock</p>
                          <p className="font-medium text-gray-900">{product.inventory}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-gray-400">SKU</p>
                          <p className="font-medium text-gray-900">{product.sku || '—'}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-gray-400">Sold</p>
                          <p className="font-medium text-gray-900">{product.sold || 0}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>{product.brand_name || 'No brand yet'}{product.seller_name ? ` • ${product.seller_name}` : ''}</span>
                        <span className="font-medium text-indigo-600">Open details →</span>
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

