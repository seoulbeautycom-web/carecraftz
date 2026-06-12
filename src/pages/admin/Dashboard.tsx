import { useNavigate } from 'react-router-dom'
import { Users, ShoppingCart, Package, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const stats = [
    {
      title: 'Total Orders',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Total Products',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Package,
      color: 'green'
    },
    {
      title: 'Staff Members',
      value: '1',
      change: 'Active',
      trend: 'neutral',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Revenue',
      value: '$0',
      change: '+0%',
      trend: 'up',
      icon: TrendingUp,
      color: 'yellow'
    }
  ]

  const quickActions = [
    { title: 'Manage Staff', description: 'Add, edit, or remove staff members', icon: Users, path: '/admin/staff', color: 'bg-purple-50 text-purple-600' },
    { title: 'Manage Products', description: 'Add new products and manage inventory', icon: Package, path: '/admin/products', color: 'bg-green-50 text-green-600' },
    { title: 'View Orders', description: 'Process and track customer orders', icon: ShoppingCart, path: '/admin/orders', color: 'bg-blue-50 text-blue-600' },
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colors = getColorClasses(stat.color)
            const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : null

            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {TrendIcon && <TrendIcon className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />}
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`${colors.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all text-left group"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">No recent activity</h3>
              <p className="text-gray-600 text-sm">Your store activity will appear here once you start receiving orders.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
