import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Filter, CheckCircle, Package, Send, Home, AlertCircle, CheckSquare, ChevronDown, ChevronUp, Eye } from 'lucide-react'
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
  'Order Received': 'bg-blue-100 text-blue-700',
  'Order Confirmed': 'bg-yellow-100 text-yellow-700',
  'Being Packaged': 'bg-purple-100 text-purple-700',
  'Dispatched': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-green-100 text-green-700'
}

export default function AdminOrders() {
  const navigate = useNavigate()
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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">Manage and track customer orders</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{orders.length}</span> orders
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order code, email, or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg font-bold text-blue-600">
                        {order.order_code || order.id.slice(0, 8)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Quick Status Update */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(getOrderProgress(order.status))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getOrderProgress(order.status)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {expandedOrder === order.id && (
                  <div className="p-4 bg-gray-50">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Customer</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{order.shipping_address?.full_name}</p>
                          <p className="text-gray-600">{order.customer_email}</p>
                          <p className="text-gray-600">{order.customer_phone}</p>
                        </div>
                      </div>
                      
                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{order.shipping_address?.address}</p>
                          <p>{order.shipping_address?.city}</p>
                          <p>{order.shipping_address?.country}</p>
                        </div>
                      </div>
                      
                      {/* Order Summary */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Order Total</h4>
                        <div className="space-y-1 text-sm">
                          {order.totals?.pkr?.total > 0 && (
                            <p className="text-green-700 font-medium">
                              {formatCurrency(order.totals.pkr.total, 'PKR')}
                            </p>
                          )}
                          {order.totals?.aed?.total > 0 && (
                            <p className="text-blue-700 font-medium">
                              {formatCurrency(order.totals.aed.total, 'AED')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Items */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-2 bg-white px-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">
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
