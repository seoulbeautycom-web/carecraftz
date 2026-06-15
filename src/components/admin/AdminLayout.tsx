import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ShoppingCart,
  Package,
  Star,
  FileText,
  Globe,
  ChevronDown,
  Search
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// All admin pages - styled to match reference design
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders', badge: 12 },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Star, label: 'Reviews', path: '/reviews', badge: 3 },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Globe, label: 'Social', path: '/social' },
  { icon: Users, label: 'Staff', path: '/staff' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

const salesChannels = [
  { name: 'Online Store', dot: 'bg-emerald-500' },
  { name: 'Instagram Shop', dot: 'bg-orange-500' },
  { name: 'Google Shopping', dot: 'bg-blue-500' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Admin')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
    } else {
      setUserEmail(session.user.email || '')
      const name = session.user.email?.split('@')[0] || 'Admin'
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
    // Prevent unused var warning
    void LogOut
    void userEmail
  }

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
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base">CareCraftz</span>
              <span className="block text-xs text-slate-500 -mt-0.5">by carecraftz.com</span>
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
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
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

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {userName.charAt(0)}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-slate-500">Store Owner</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
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
