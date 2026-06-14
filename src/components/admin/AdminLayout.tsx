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
  ArrowRightLeft
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Match reference design menu structure
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowRightLeft, label: 'Transactions', path: '/orders' },
  { icon: Users, label: 'Customers', path: '/staff' },
  { icon: BarChart3, label: 'Reports', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
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
    <div className="min-h-screen bg-[#0f1115] flex">
      {/* Sidebar - Reference Design */}
      <aside className="w-64 bg-[#1a1d2d] flex flex-col fixed h-screen">
        {/* Logo Area */}
        <div className="p-6 border-b border-[#2a2d3d]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white text-lg">CareCraftz</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                (item.path === '/orders' && location.pathname === '/dashboard' && item.label === 'Transactions')

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-[#232638]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#2a2d3d]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-[#232638] rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto bg-[#0f1115]">
        {children}
      </main>
    </div>
  )
}
