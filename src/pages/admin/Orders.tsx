import { useEffect, useState } from 'react'
import { ShoppingCart, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'
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

const ORDER_STATUSES = [
  'Order Received',
  'Order Confirmed', 
  'Being Packaged',
  'Dispatched',
  'Delivered'
]

const STATUS_COLORS: Record<string, string> = {
  'Order Received': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Order Confirmed': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Being Packaged': 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  'Dispatched': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'Delivered': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    } else {
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    }
    
    setUpdatingStatus(null)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount) return '-'
    return currency === 'PKR' 
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOrderProgress = (status: string) => {
    const index = ORDER_STATUSES.indexOf(status)
    return ((index + 1) / ORDER_STATUSES.length) * 100
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Orders</h1>
              <p className="text-sm text-slate-400">Manage and track customer orders</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Total: <span className="font-semibold text-white">{orders.length}</span> orders
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order code, email, or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Statuses</option>
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-800">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
                {/* Order Header */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg font-bold text-blue-400">
                        {order.order_code || order.id.slice(0, 8)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-slate-800 text-slate-400'}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Quick Status Update */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className="text-sm px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(getOrderProgress(order.status))}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getOrderProgress(order.status)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {expandedOrder === order.id && (
                  <div className="p-4 bg-slate-900/30">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Customer</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-slate-300">{order.shipping_address?.full_name}</p>
                          <p className="text-slate-400">{order.customer_email}</p>
                          <p className="text-slate-400">{order.customer_phone}</p>
                        </div>
                      </div>
                      
                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Shipping Address</h4>
                        <div className="space-y-1 text-sm text-slate-400">
                          <p>{order.shipping_address?.address}</p>
                          <p>{order.shipping_address?.city}</p>
                          <p>{order.shipping_address?.country}</p>
                        </div>
                      </div>
                      
                      {/* Order Summary */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Order Total</h4>
                        <div className="space-y-1 text-sm">
                          {order.totals?.pkr && order.totals.pkr.total > 0 && (
                            <p className="text-emerald-400 font-medium">
                              {formatCurrency(order.totals.pkr.total, 'PKR')}
                            </p>
                          )}
                          {order.totals?.aed && order.totals.aed.total > 0 && (
                            <p className="text-blue-400 font-medium">
                              {formatCurrency(order.totals.aed.total, 'AED')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Items */}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <h4 className="font-semibold text-white mb-3">Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-2 bg-slate-800 px-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-200">{item.name}</span>
                              <span className="text-slate-500">x{item.quantity}</span>
                            </div>
                            <span className="font-medium text-emerald-400">
                              {formatCurrency(item.price * item.quantity, item.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
