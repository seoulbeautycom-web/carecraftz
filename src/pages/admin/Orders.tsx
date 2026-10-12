import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Settings,
  LogOut,
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  CreditCard,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface OrderItem {
  product_id?: string
  name: string
  quantity: number
  price: number
  currency?: string
  delivery_charge?: number
  location?: string
}

interface OrderTotalsCurrency {
  subtotal?: number
  delivery?: number
  total?: number
}

interface Order {
  id: string
  order_code: string
  customer_email: string
  customer_phone: string
  status: string
  created_at: string
  payment_method?: string
  shipping_address: {
    full_name: string
    address: string
    city: string
    country: string
    postal_code?: string
  }
  totals: {
    pkr?: OrderTotalsCurrency
    aed?: OrderTotalsCurrency
  }
  items: OrderItem[]
  time_ago?: string
}

const STATUS_DISPLAY: Record<string, string> = {
  'Order Received': 'Pending',
  'Order Confirmed': 'Processing',
  'Being Packaged': 'Processing',
  Dispatched: 'Processing',
  Delivered: 'Fulfilled',
  'Order Completed': 'Fulfilled',
  Refunded: 'Refunded',
}

const STATUS_BADGES: Record<string, string> = {
  Fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Processing: 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Refunded: 'bg-red-50 text-red-700 border-red-100',
}

const FILTER_TABS = ['All', 'Pending', 'Processing', 'Fulfilled', 'Refunded'] as const

const STATUS_OPTIONS = [
  'Order Received',
  'Order Confirmed',
  'Being Packaged',
  'Dispatched',
  'Delivered',
  'Order Completed',
  'Refunded',
]

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } else {
      const mapped = (data || []).map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at),
      }))
      setOrders(mapped)

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNewOrdersCount(mapped.filter((o) => new Date(o.created_at) > last24Hours).length)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchOrders()
      void fetchUserName()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchOrders, fetchUserName])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const openOrder = (order: Order) => {
    setShowNotifications(false)
    setStatusError('')
    setSelectedOrder(order)
  }

  const closeOrder = () => {
    setSelectedOrder(null)
    setStatusError('')
  }

  const updateOrderStatus = async (nextStatus: string) => {
    if (!selectedOrder || selectedOrder.id.length < 10) return
    setUpdatingStatus(true)
    setStatusError('')
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedOrder.id)

      if (error) throw error

      setOrders((current) =>
        current.map((order) =>
          order.id === selectedOrder.id ? { ...order, status: nextStatus } : order,
        ),
      )
      setSelectedOrder((current) => (current ? { ...current, status: nextStatus } : current))
    } catch (error) {
      console.error('Failed to update order status:', error)
      setStatusError('Could not update status. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return orders.filter((order) => {
      const displayStatus = STATUS_DISPLAY[order.status] || order.status
      const matchesSearch =
        order.order_code?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query) ||
        order.shipping_address?.full_name?.toLowerCase().includes(query) ||
        order.customer_phone?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || displayStatus.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => STATUS_DISPLAY[o.status] === 'Pending').length
  const processingOrders = orders.filter((o) => STATUS_DISPLAY[o.status] === 'Processing').length
  const fulfilledOrders = orders.filter((o) => STATUS_DISPLAY[o.status] === 'Fulfilled').length

  const stats = [
    { label: 'Total Orders', value: totalOrders, color: 'text-blue-600', filter: 'all' },
    { label: 'Pending', value: pendingOrders, color: 'text-amber-600', filter: 'Pending' },
    { label: 'Processing', value: processingOrders, color: 'text-indigo-600', filter: 'Processing' },
    { label: 'Fulfilled', value: fulfilledOrders, color: 'text-emerald-600', filter: 'Fulfilled' },
  ]

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const formatMoney = (amount: number, currency: 'AED' | 'PKR') =>
    currency === 'PKR' ? `₨${amount.toLocaleString()}` : `AED ${amount.toLocaleString()}`

  const formatOrderTotal = (order: Order) => {
    const aed = order.totals?.aed?.total || 0
    const pkr = order.totals?.pkr?.total || 0
    const parts: string[] = []
    if (aed > 0) parts.push(formatMoney(aed, 'AED'))
    if (pkr > 0) parts.push(formatMoney(pkr, 'PKR'))
    return parts.length ? parts.join(' · ') : '—'
  }

  const getStatusBadge = (status: string) => {
    const displayStatus = STATUS_DISPLAY[status] || status
    const badgeClass = STATUS_BADGES[displayStatus] || 'bg-gray-50 text-gray-700 border-gray-200'

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badgeClass}`}>
        {displayStatus === 'Fulfilled' && <CheckCircle2 className="w-3 h-3" />}
        {(displayStatus === 'Processing' || displayStatus === 'Pending') && <Clock className="w-3 h-3" />}
        {displayStatus}
      </span>
    )
  }

  const itemCount = (order: Order) =>
    (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || order.items?.length || 0

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Orders</h1>
              <p className="text-[11px] text-gray-500">Review, fulfil, and track customer orders.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D9D0C2] bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
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
                        orders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => openOrder(order)}
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
              const active = statusFilter === stat.filter
              return (
                <button
                  key={stat.filter}
                  type="button"
                  onClick={() => setStatusFilter(stat.filter)}
                  className={`rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'border-indigo-400 ring-2 ring-indigo-500/15'
                      : 'border-[#D9D0C2] hover:border-[#C9BEAE]'
                  }`}
                >
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{stat.label}</p>
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]/50 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order code, customer, email, phone…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {FILTER_TABS.map((tab) => {
                  const value = tab === 'All' ? 'all' : tab
                  const active = statusFilter.toLowerCase() === value.toLowerCase()
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-[#D9D0C2] text-gray-600 hover:bg-[#F7F2E8]'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0D4] bg-[#F7F2E8]/40">
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">Loading orders…</td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">No orders found</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        tabIndex={0}
                        onClick={() => openOrder(order)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openOrder(order)
                          }
                        }}
                        className={`group border-b border-[#F0E9DC] last:border-0 cursor-pointer transition-colors focus:outline-none ${
                          selectedOrder?.id === order.id
                            ? 'bg-indigo-50/70'
                            : 'hover:bg-[#F7F2E8]/70 focus:bg-[#F7F2E8]'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                            {order.order_code || `#${order.id.slice(0, 8)}`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium text-gray-900 truncate max-w-[12rem]">
                            {order.shipping_address?.full_name || order.customer_email?.split('@')[0] || '—'}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[12rem]">{order.customer_email}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs text-gray-600">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs text-gray-600">{itemCount(order)}</span>
                        </td>
                        <td className="px-3 py-2.5">{getStatusBadge(order.status)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {formatOrderTotal(order)}
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

        {/* Order detail drawer */}
        {selectedOrder && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <button
              type="button"
              aria-label="Close order details"
              className="absolute inset-0 bg-black/30"
              onClick={closeOrder}
            />
            <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E8E0D4] bg-[#F7F2E8] shadow-2xl">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E8E0D4] bg-[#F7F2E8] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Order</p>
                  <h2 className="text-base font-bold text-gray-900 truncate">
                    {selectedOrder.order_code || selectedOrder.id}
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={closeOrder}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                <div className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="relative">
                    <select
                      value={selectedOrder.status}
                      disabled={updatingStatus || selectedOrder.id.length < 10}
                      onChange={(e) => void updateOrderStatus(e.target.value)}
                      className="w-full appearance-none px-3 py-1.5 pr-8 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none disabled:bg-gray-50"
                    >
                      {!STATUS_OPTIONS.includes(selectedOrder.status) && (
                        <option value={selectedOrder.status}>{selectedOrder.status}</option>
                      )}
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  {statusError && <p className="text-[11px] text-red-600">{statusError}</p>}
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Customer</p>
                  <div className="space-y-1.5 text-xs text-gray-700">
                    <p className="font-medium text-gray-900">
                      {selectedOrder.shipping_address?.full_name || '—'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {selectedOrder.customer_email || '—'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedOrder.customer_phone || '—'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Shipping
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {[
                      selectedOrder.shipping_address?.address,
                      selectedOrder.shipping_address?.city,
                      selectedOrder.shipping_address?.postal_code,
                      selectedOrder.shipping_address?.country,
                    ].filter(Boolean).join(', ') || 'No shipping address'}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Items ({itemCount(selectedOrder)})
                  </p>
                  <ul className="divide-y divide-[#F0E9DC]">
                    {(selectedOrder.items || []).length === 0 ? (
                      <li className="py-2 text-xs text-gray-500">No line items</li>
                    ) : (
                      selectedOrder.items.map((item, index) => (
                        <li key={`${item.product_id || item.name}-${index}`} className="py-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.name || 'Product'}</p>
                            <p className="text-[11px] text-gray-500">
                              Qty {item.quantity}
                              {item.location ? ` · ${item.location}` : ''}
                              {item.currency ? ` · ${item.currency}` : ''}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {item.currency === 'PKR'
                              ? formatMoney((item.price || 0) * (item.quantity || 0), 'PKR')
                              : formatMoney((item.price || 0) * (item.quantity || 0), 'AED')}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium text-gray-900 uppercase">{selectedOrder.payment_method || '—'}</span>
                  </div>
                  {(selectedOrder.totals?.aed?.total || 0) > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#F0E9DC]">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">AED subtotal</span>
                        <span>{formatMoney(selectedOrder.totals?.aed?.subtotal || 0, 'AED')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">AED delivery</span>
                        <span>{formatMoney(selectedOrder.totals?.aed?.delivery || 0, 'AED')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-800">AED total</span>
                        <span>{formatMoney(selectedOrder.totals?.aed?.total || 0, 'AED')}</span>
                      </div>
                    </div>
                  )}
                  {(selectedOrder.totals?.pkr?.total || 0) > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#F0E9DC]">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">PKR subtotal</span>
                        <span>{formatMoney(selectedOrder.totals?.pkr?.subtotal || 0, 'PKR')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">PKR delivery</span>
                        <span>{formatMoney(selectedOrder.totals?.pkr?.delivery || 0, 'PKR')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-800">PKR total</span>
                        <span>{formatMoney(selectedOrder.totals?.pkr?.total || 0, 'PKR')}</span>
                      </div>
                    </div>
                  )}
                  {(selectedOrder.totals?.aed?.total || 0) <= 0 && (selectedOrder.totals?.pkr?.total || 0) <= 0 && (
                    <p className="text-xs text-gray-500">No totals recorded</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-[#E8E0D4] bg-[#F7F2E8] px-4 py-3">
                <button
                  type="button"
                  onClick={closeOrder}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9D0C2] text-xs font-semibold text-gray-700 hover:bg-[#F0E9DC] transition-colors"
                >
                  Close
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
