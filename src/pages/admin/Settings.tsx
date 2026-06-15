import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronDown, 
  Bell,
  Store,
  CreditCard,
  Truck,
  BellRing,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Settings as SettingsIcon,
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
  status: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

interface SettingsTab {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  active?: boolean
}

export default function Settings() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  const [activeTab, setActiveTab] = useState('store-details')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    fetchUserName()
    fetchOrdersForNotifications()
  }, [])

  const fetchOrdersForNotifications = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      const ordersWithTime = data.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at)
      }))
      setAllOrders(ordersWithTime)
      
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentOrders = data.filter((o: Order) => new Date(o.created_at) > last24Hours)
      setNewOrdersCount(recentOrders.length)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const settingsTabs: SettingsTab[] = [
    { 
      id: 'store-details', 
      label: 'Store Details', 
      description: 'Name, address, contact info',
      icon: <Store className="w-5 h-5" />,
      active: true 
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      description: 'Gateways, currencies, billing',
      icon: <CreditCard className="w-5 h-5" /> 
    },
    { 
      id: 'shipping', 
      label: 'Shipping & Delivery', 
      description: 'Zones, rates, fulfillment',
      icon: <Truck className="w-5 h-5" /> 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      description: 'Email and push preferences',
      icon: <BellRing className="w-5 h-5" /> 
    },
    { 
      id: 'security', 
      label: 'Security', 
      description: 'Passwords, 2FA, sessions',
      icon: <Shield className="w-5 h-5" /> 
    },
    { 
      id: 'themes', 
      label: 'Themes & Branding', 
      description: 'Colors, fonts, logo',
      icon: <Palette className="w-5 h-5" /> 
    },
    { 
      id: 'domain', 
      label: 'Domain', 
      description: 'Custom domain, SSL',
      icon: <Globe className="w-5 h-5" /> 
    }
  ]

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Configure your store preferences.</p>
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
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">New Orders</h3>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
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
                            onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-xs text-gray-500">{order.time_ago}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{order.shipping_address?.full_name || order.customer_email}</p>
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
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
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">Store Owner</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <SettingsIcon className="w-4 h-4" /> Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-8">
            {/* Left Sidebar - Settings Tabs */}
            <div className="w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${activeTab === tab.id ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {tab.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{tab.description}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content - Store Information Form */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Store Information</h2>
                
                <div className="space-y-6">
                  {/* Store Name & URL */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                      <input
                        type="text"
                        defaultValue="Petal & Root"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store URL</label>
                      <input
                        type="text"
                        defaultValue="petalandroot.myshopify.com"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue="hello@petalandroot.co"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        defaultValue="+1 (807) 555-0192"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Currency & Timezone */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <div className="relative">
                        <select
                          defaultValue="USD"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent appearance-none"
                        >
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="CAD">CAD — Canadian Dollar</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <div className="relative">
                        <select
                          defaultValue="America/New_York"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent appearance-none"
                        >
                          <option value="America/New_York">America/New_York</option>
                          <option value="America/Los_Angeles">America/Los_Angeles</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Asia/Tokyo">Asia/Tokyo</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Address</h3>
                    
                    {/* Street Address & City */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          defaultValue="44 Maple Hill Rd"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          defaultValue="Burlington"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Suite & ZIP */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Suite</label>
                        <input
                          type="text"
                          defaultValue="Vermont"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          defaultValue="05401"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
