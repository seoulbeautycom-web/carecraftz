import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
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
  customer_name: string
  status: string
  created_at: string
  time_ago?: string
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Admin')
  const [, setUserEmail] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    fetchOrders()
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      setUserEmail(session.user.email)
    }
  }

  const fetchOrders = async () => {
    // Fetch all orders for counting
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
    
    // Fetch recent orders for dashboard display
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) {
      const ordersWithTime = data.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at)
      }))
      setOrders(ordersWithTime)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleViewOrder = (orderId: string) => {
    setShowNotifications(false)
    navigate(`/orders?id=${orderId}`)
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours === 1) return '1h ago'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1d ago'
    return `${diffInDays}d ago`
  }

  // Calculate stats
  const totalRevenue = orders.reduce((acc, order) => {
    const pkr = order.totals?.pkr?.total || 0
    const aed = order.totals?.aed?.total || 0
    return acc + pkr + (aed * 75)
  }, 0)

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 1000).toFixed(1)}k`,
      change: '+14.5%',
      trend: 'up',
      subtext: 'vs $29,800 last week',
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trendColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Total Orders',
      value: orders.length.toString() || '0',
      change: '+20.5%',
      trend: 'up',
      subtext: 'vs 390 last week',
      icon: ShoppingCart,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trendColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'New Customers',
      value: '0',
      change: '-8.8%',
      trend: 'down',
      subtext: 'vs 204 last week',
      icon: Users,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trendColor: 'bg-red-100 text-red-700'
    },
    {
      title: 'Products Sold',
      value: '0',
      change: '+12.6%',
      trend: 'up',
      subtext: 'across 24 SKUs',
      icon: Package,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trendColor: 'bg-emerald-100 text-emerald-700'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Fulfilled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Fulfilled
          </span>
        )
      case 'Dispatched':
      case 'Processing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
            Processing
          </span>
        )
      case 'Order Confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Confirmed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  const formatCurrency = (amount: number, currency?: string) => {
    if (!amount) return '$0'
    return currency === 'AED' ? `AED ${amount}` : `$${amount}`
  }

  // Sample top products data
  const topProducts = [
    { name: 'Calendula & Oat Soap', sold: '284', revenue: '$3,408', trend: '+12%', trendUp: true },
    { name: 'Whipped Shea Body Butter', sold: '156', revenue: '$4,212', trend: '+8%', trendUp: true },
    { name: 'Rosehip Facial Serum', sold: '143', revenue: '$5,434', trend: '+22%', trendUp: true },
    { name: 'Lavender Dream Soap', sold: '122', revenue: '$1,708', trend: '-7%', trendUp: false },
    { name: 'Botanical Bath Salts', sold: '98', revenue: '$1,764', trend: '+2%', trendUp: true },
  ]

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {userName} — here's what's happening today.</p>
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
                            <p className="text-sm text-gray-600 mb-1">{order.customer_name || order.customer_email}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === 'Order Completed' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.status}
                              </span>
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate('/orders'); }}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${stat.iconBg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.trendColor}`}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
                  <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>
                </div>
              )
            })}
          </div>

          {/* Middle Section - Revenue Chart & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Overview */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                  <p className="text-sm text-gray-500">This week vs last week</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg">7D</button>
                  <button className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100">30D</button>
                  <button className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100">90D</button>
                </div>
              </div>
              {/* Chart Placeholder */}
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const heights = [30, 45, 35, 60, 85, 95, 70]
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-indigo-100 rounded-t-lg relative overflow-hidden"
                        style={{ height: `${heights[i]}%` }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-lg"
                          style={{ height: '100%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
              </div>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-4">{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sold} sold · {product.revenue}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${product.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                      {product.trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section - Recent Orders & Orders/Day */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          Loading orders...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">#{order.order_code || order.id.slice(0, 6)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                                {(order.customer_name || order.customer_email || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700">{order.customer_name || order.customer_email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.totals?.pkr?.total || order.totals?.aed?.total || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">{order.time_ago}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders/Day Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders / Day</h3>
              <p className="text-sm text-gray-500 mb-6">Last 7 days</p>
              <div className="flex items-end justify-between gap-1 h-48">
                {[40, 65, 45, 80, 55, 95, 70].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-indigo-500 rounded-t-sm"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
