import { useEffect, useState } from 'react'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Plus,
  Bell,
  CheckCircle2,
  Clock,
  Download
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userName, setUserName] = useState('Admin')

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
    { label: 'Total Orders', value: totalOrders, color: 'text-blue-600', subtext: '' },
    { label: 'Pending', value: pendingOrders, color: 'text-amber-600', subtext: '' },
    { label: 'Processing', value: processingOrders, color: 'text-indigo-600', subtext: '' },
    { label: 'Fulfilled', value: fulfilledOrders, color: 'text-emerald-600', subtext: '' }
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
            
            {/* Right - Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
              <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                New
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userName.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
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
      </div>
    </AdminLayout>
  )
}
