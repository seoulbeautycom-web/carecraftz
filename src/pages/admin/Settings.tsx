import { useEffect, useState } from 'react'
import { 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  Store,
  CreditCard,
  Truck,
  BellRing,
  Shield,
  Palette,
  Globe,
  ChevronRight
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface SettingsTab {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  active?: boolean
}

export default function Settings() {
  const [userName, setUserName] = useState('Admin')
  const [activeTab, setActiveTab] = useState('store-details')

  useEffect(() => {
    fetchUserName()
  }, [])

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
            
            {/* Right - Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
              <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                New
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userName.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
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
