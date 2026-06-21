import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Bell,
  CheckCircle2,
  Clock,
  Download,
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
  customer_phone: string
  status: string
  created_at: string
  shipping_address: {
    full_name: string
    address: string
    city: string
    country: string
  }
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    currency: string
  }>
  time_ago?: string
}

// Status mapping to display names
const STATUS_DISPLAY: Record<string, string> = {
  'Order Received': 'Pending',
  'Order Confirmed': 'Processing',
  'Being Packaged': 'Processing',
  'Dispatched': 'Processing',
  'Delivered': 'Fulfilled'
}

// Status badge styles matching reference
const STATUS_BADGES: Record<string, string> = {
  'Fulfilled': 'bg-emerald-100 text-emerald-700',
  'Processing': 'bg-blue-100 text-blue-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Refunded': 'bg-red-100 text-red-700'
}

const FILTER_TABS = ['All', 'Pending', 'Processing', 'Fulfilled', 'Refunded']

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchUserName()
  }, [])

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    
    // Fetch all orders for notifications
    const { data: allData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allData) {
      const ordersWithTime = allData.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at)
      }))
      setAllOrders(ordersWithTime)
      
      // Count orders from last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentOrders = allData.filter((o: Order) => new Date(o.created_at) > last24Hours)
      setNewOrdersCount(recentOrders.length)
    }
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleViewOrder = (orderId: string) => {
    setShowNotifications(false)
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setShowDetailModal(true)
    }
  }

  const filteredOrders = orders.filter(order => {
    const displayStatus = STATUS_DISPLAY[order.status] || order.status
    const matchesSearch = 
      order.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      displayStatus.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => STATUS_DISPLAY[o.status] === 'Pending').length
  const processingOrders = orders.filter(o => STATUS_DISPLAY[o.status] === 'Processing').length
  const fulfilledOrders = orders.filter(o => STATUS_DISPLAY[o.status] === 'Fulfilled').length

  const stats = [
    { label: 'Total Orders', value: totalOrders, color: 'text-blue-600', filter: 'all' },
    { label: 'Pending', value: pendingOrders, color: 'text-amber-600', filter: 'Pending' },
    { label: 'Processing', value: processingOrders, color: 'text-indigo-600', filter: 'Processing' },
    { label: 'Fulfilled', value: fulfilledOrders, color: 'text-emerald-600', filter: 'Fulfilled' }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount}`
  }

  const getStatusBadge = (status: string) => {
    const displayStatus = STATUS_DISPLAY[status] || status
    const badgeClass = STATUS_BADGES[displayStatus] || 'bg-gray-100 text-gray-700'
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {displayStatus === 'Fulfilled' && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
        {displayStatus === 'Processing' && <Clock className="w-3.5 h-3.5 mr-1.5" />}
        {displayStatus === 'Pending' && <Clock className="w-3.5 h-3.5 mr-1.5" />}
        {displayStatus}
      </span>
    )
  }

  // Sample data for demo if no orders
  const sampleOrders: Order[] = [
    {
      id: '1',
      order_code: '#8423',
      customer_email: 'sarah@email.com',
      customer_phone: '',
      status: 'Delivered',
      created_at: new Date().toISOString(),
      shipping_address: { full_name: 'Sarah K.', address: '', city: '', country: '' },
      totals: { pkr: { total: 48 } },
      items: [{ name: '', quantity: 2, price: 0, currency: 'USD' }]
    },
    {
      id: '2',
      order_code: '#8422',
      customer_email: 'james@email.com',
      customer_phone: '',
      status: 'Being Packaged',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      shipping_address: { full_name: 'James T.', address: '', city: '', country: '' },
      totals: { pkr: { total: 76 } },
      items: [{ name: '', quantity: 3, price: 0, currency: 'USD' }]
    },
    {
      id: '3',
      order_code: '#8421',
      customer_email: 'mei@email.com',
      customer_phone: '',
      status: 'Delivered',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      shipping_address: { full_name: 'Mei L.', address: '', city: '', country: '' },
      totals: { pkr: { total: 22 } },
      items: [{ name: '', quantity: 1, price: 0, currency: 'USD' }]
    }
  ]

  const displayOrders = orders.length > 0 ? filteredOrders : sampleOrders

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">Manage and fulfill customer orders.</p>
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
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">New Orders</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
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
                            onClick={() => handleViewOrder(order.id)}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-xs text-gray-500">{order.time_ago}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{order.shipping_address?.full_name || order.customer_email}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === 'Delivered' || order.status === 'Order Completed' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'Processing' || order.status === 'Order Confirmed' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {STATUS_DISPLAY[order.status] || order.status}
                              </span>
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifications(false); }}
                        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
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
                
                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">Store Owner</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
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
            {stats.map((stat, index) => (
              <button
                key={index}
                onClick={() => setStatusFilter(stat.filter)}
                className={`bg-white rounded-2xl p-6 shadow-sm border text-left transition-all hover:shadow-md ${
                  statusFilter === stat.filter ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-100'
                }`}
              >
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab === 'All' ? 'all' : tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (tab === 'All' && statusFilter === 'all') || 
                      statusFilter.toLowerCase() === tab.toLowerCase()
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Loading orders...
                      </td>
                    </tr>
                  ) : displayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    displayOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{order.order_code || `#${order.id.slice(0, 4)}`}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.shipping_address?.full_name || order.customer_email?.split('@')[0]}</p>
                            <p className="text-xs text-gray-500">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{order.items?.length || 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(order.totals?.pkr?.total || order.totals?.aed?.total || 0)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
            <div className="my-8 max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Order Code</span>
                  <span className="text-sm font-medium text-gray-900">{selectedOrder.order_code}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Customer</span>
                  <span className="text-sm font-medium text-gray-900">{selectedOrder.shipping_address?.full_name || selectedOrder.customer_email}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-900">{selectedOrder.customer_email}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-medium text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedOrder.totals?.pkr?.total || selectedOrder.totals?.aed?.total || 0)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); navigate(`/orders?id=${selectedOrder.id}`); }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

