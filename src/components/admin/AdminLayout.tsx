import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Star,
  FileText,
  Globe
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Star, label: 'Reviews', path: '/reviews' },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Globe, label: 'Social', path: '/social' },
  { icon: Users, label: 'Staff', path: '/staff' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
    } else {
      setUserEmail(session.user.email || '')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-500 ease-out ${
          sidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/50">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Store className="w-6 h-6 text-white" />
            </div>
            {sidebarExpanded && (
              <div className="overflow-hidden">
                <span className="font-bold text-white text-lg tracking-tight">CareCraftz</span>
                <span className="block text-xs text-slate-500 -mt-1">Admin Portal</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const isHovered = hoveredItem === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 font-medium border-r-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {/* Hover Glow Effect */}
                {isHovered && !isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isHovered ? 'scale-110' : ''} ${isActive ? 'text-emerald-400' : ''}`} />
                {sidebarExpanded && (
                  <span className="text-sm relative z-10">{item.label}</span>
                )}
                
                {/* Active Indicator Dot */}
                {isActive && sidebarExpanded && (
                  <div className="absolute right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-700">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            {sidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{userEmail}</p>
                <p className="text-xs text-emerald-500 font-medium">Administrator</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  )
}
