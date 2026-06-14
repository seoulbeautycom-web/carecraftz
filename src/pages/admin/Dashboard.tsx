import { useNavigate } from 'react-router-dom'
import { Users, ShoppingCart, Package, TrendingUp, ArrowUpRight, Sparkles, Bell, Calendar } from 'lucide-react'
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
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/10'
    },
    {
      title: 'Total Products',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Package,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/10'
    },
    {
      title: 'Staff Members',
      value: '1',
      change: 'Active',
      trend: 'neutral',
      icon: Users,
      gradient: 'from-violet-500 to-purple-500',
      bgGlow: 'bg-violet-500/10'
    },
    {
      title: 'Revenue',
      value: '$0',
      change: '+0%',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/10'
    }
  ]

  const quickActions = [
    { 
      title: 'Manage Staff', 
      description: 'Add, edit, or remove staff members', 
      icon: Users, 
      path: '/staff', 
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconGradient: 'from-violet-500 to-purple-500'
    },
    { 
      title: 'Manage Products', 
      description: 'Add new products and manage inventory', 
      icon: Package, 
      path: '/products', 
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconGradient: 'from-emerald-500 to-teal-500'
    },
    { 
      title: 'View Orders', 
      description: 'Process and track customer orders', 
      icon: ShoppingCart, 
      path: '/orders', 
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconGradient: 'from-blue-500 to-cyan-500'
    },
  ]

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-slate-400">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <button className="relative p-2 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon

            return (
              <div 
                key={index} 
                className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all duration-300 overflow-hidden"
              >
                {/* Background Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${stat.bgGlow} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className={`w-4 h-4 ${stat.trend === 'up' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            Quick Actions
            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent ml-4" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Hover Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`inline-flex w-12 h-12 bg-gradient-to-br ${action.iconGradient} rounded-xl items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-slate-400">{action.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all
            </button>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <TrendingUp className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-white font-medium mb-1">No recent activity</h3>
              <p className="text-slate-400 text-sm">Your store activity will appear here once you start receiving orders.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
