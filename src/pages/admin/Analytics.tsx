import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Calendar } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  averageOrderValue: number
}

interface Order {
  id: string
  created_at: string
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageOrderValue: 0
  })
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d, all

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case 'all':
          startDate = new Date('2024-01-01')
          break
      }

      // Fetch orders within date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate stats
      const totalOrders = orders?.length || 0
      
      let totalRevenue = 0
      orders?.forEach((order: Order) => {
        if (order.totals?.pkr?.total) {
          totalRevenue += order.totals.pkr.total
        }
        if (order.totals?.aed?.total) {
          totalRevenue += order.totals.aed.total
        }
      })

      // Get unique customers
      const uniqueCustomers = new Set(orders?.map(o => o.user_id).filter(Boolean))
      const totalCustomers = uniqueCustomers.size

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers,
        averageOrderValue
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      change: '+0%',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+0%',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Unique Customers',
      value: stats.totalCustomers.toString(),
      change: '+0%',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(stats.averageOrderValue),
      change: '+0%',
      icon: TrendingUp,
      color: 'yellow'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
      yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    }
    return colors[color] || colors.blue
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track your store performance and metrics.</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <Calendar className="w-4 h-4 text-gray-500 ml-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            const colors = getColorClasses(stat.color)

            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stat.value}</p>
                    <span className="text-sm text-gray-500 mt-1">{stat.change}</span>
                  </div>
                  <div className={`${colors.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Revenue chart coming soon</p>
                <p className="text-gray-400 text-xs mt-1">Connect to analytics API for detailed charts</p>
              </div>
            </div>
          </div>

          {/* Orders Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Orders Overview</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Orders chart coming soon</p>
                <p className="text-gray-400 text-xs mt-1">Historical order data visualization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products / Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Product analytics coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Activity feed coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
