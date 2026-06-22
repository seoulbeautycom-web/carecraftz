import { Link, useLocation } from 'react-router-dom'
import { Search, Store } from 'lucide-react'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { ADMIN_NAV_ITEMS } from '../../lib/adminNavigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

const salesChannels = [
  { name: 'Online Store', dot: 'bg-emerald-500' },
  { name: 'Instagram Shop', dot: 'bg-orange-500' },
  { name: 'Google Shopping', dot: 'bg-blue-500' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { loading, fullName, roleCode, landingPath, hasAnyPermission: canAccessAnyPermission } = useAdminAccess()

  const menuItems = ADMIN_NAV_ITEMS.filter((item) => canAccessAnyPermission(item.requiredAnyPermissions))
  const homePath = landingPath ?? '/'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Dark theme matching reference */}
      <aside className="w-64 bg-slate-900 flex flex-col fixed h-screen">
        {/* Logo Area */}
        <div className="p-5">
          <Link to={homePath} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base">CareCraftz</span>
              <span className="block text-xs text-slate-500 -mt-0.5">
                {fullName || roleCode || 'Staff access'}
              </span>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive || (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Sales Channels */}
          <div className="mt-6 px-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Sales Channels</p>
            <ul className="space-y-1">
              {salesChannels.map((channel) => (
                <li key={channel.name} className="flex items-center gap-2 text-sm text-slate-400 px-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${channel.dot}`}></span>
                  {channel.name}
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Help Center */}
        <div className="px-4 py-2">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-2 py-2">
            <span className="text-lg">?</span>
            Help Center
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
