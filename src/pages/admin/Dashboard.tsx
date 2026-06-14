import { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Search,
  Filter,
  Download
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
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
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
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setOrders(data)
    setLoading(false)
  }

  // Calculate stats
  const totalRevenue = orders.reduce((acc, order) => {
    const pkr = order.totals?.pkr?.total || 0
    const aed = order.totals?.aed?.total || 0
    return acc + pkr + (aed * 75) // Rough conversion
  }, 0)

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Total Revenue',
      value: `₨${(totalRevenue / 1000).toFixed(1)}k`,
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Pending Orders',
      value: orders.filter(o => o.status !== 'Delivered').length.toString(),
      change: '-3%',
      trend: 'down',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-emerald-400'
      case 'Dispatched': return 'text-blue-400'
      case 'Order Confirmed': return 'text-amber-400'
      default: return 'text-slate-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-PK')}`
  }

  return (
    <AdminLayout>
      <div className="flex-1 bg-[#0f1115] min-h-screen">
        {/* Top Header */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Hello, {userName}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-[#1a1d2d] border border-[#2a2d3d] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
                />
              </div>
              <button className="p-2 bg-[#1a1d2d] border border-[#2a2d3d] rounded-lg text-slate-400 hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 bg-[#1a1d2d] border border-[#2a2d3d] rounded-lg text-slate-400 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-[#1a1d2d] rounded-2xl p-6 border border-[#2a2d3d]"
              >
                <p className="text-slate-400 text-sm">{stat.title}</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="px-8 pb-8">
          <div className="bg-[#1a1d2d] rounded-2xl border border-[#2a2d3d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a2d3d] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <button className="text-slate-400 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2d3d]">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Order ID</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Customer</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-[#2a2d3d] last:border-0 hover:bg-[#232638] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{order.order_code || order.id.slice(0, 8)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2a2d3d] flex items-center justify-center text-sm text-slate-300">
                              {order.customer_name?.[0] || order.customer_email?.[0] || '?'}
                            </div>
                            <span className="text-slate-300">{order.customer_name || order.customer_email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4 text-white font-medium">
                          {formatCurrency(order.totals?.pkr?.total || order.totals?.aed?.total || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${getStatusColor(order.status)}`}>
                            {order.status}
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
