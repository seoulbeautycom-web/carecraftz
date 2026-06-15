import { useEffect, useState } from 'react'
import { 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface CountryStat {
  code: string
  name: string
  visits: number
  color: string
}

export default function Analytics() {
  const [userName, setUserName] = useState('Admin')

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

  // Stats data
  const stats = [
    { 
      label: 'Total Sessions', 
      value: '48,290', 
      change: '+18.4%', 
      trend: 'up',
      color: 'text-gray-900'
    },
    { 
      label: 'Bounce Rate', 
      value: '32.1%', 
      change: '-4.2%', 
      trend: 'down',
      color: 'text-gray-900'
    },
    { 
      label: 'Avg. Session', 
      value: '3m 42s', 
      change: '+20s', 
      trend: 'up',
      color: 'text-gray-900'
    },
    { 
      label: 'Conversion Rate', 
      value: '3.67%', 
      change: '+0.8%', 
      trend: 'up',
      color: 'text-gray-900'
    }
  ]

  // Traffic sources data
  const trafficSources = [
    { name: 'Organic Search', percentage: 38, color: 'bg-indigo-500' },
    { name: 'Social Media', percentage: 27, color: 'bg-purple-500' },
    { name: 'Direct', percentage: 18, color: 'bg-amber-500' },
    { name: 'Email', percentage: 12, color: 'bg-emerald-500' },
    { name: 'Referral', percentage: 5, color: 'bg-pink-500' }
  ]

  // Countries data
  const countries: CountryStat[] = [
    { code: 'US', name: 'United States', visits: 12400, color: 'bg-blue-500' },
    { code: 'GB', name: 'United Kingdom', visits: 4200, color: 'bg-indigo-500' },
    { code: 'CA', name: 'Canada', visits: 3100, color: 'bg-purple-500' },
    { code: 'AU', name: 'Australia', visits: 2800, color: 'bg-pink-500' }
  ]

  const maxVisits = Math.max(...countries.map(c => c.visits))

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500">Deep dive into your store performance.</p>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue & Orders Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue & Orders</h3>
              <p className="text-sm text-gray-500 mb-6">6-month trend</p>
              
              {/* Chart Placeholder */}
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Revenue line */}
                  <path
                    d="M0,150 C50,140 100,130 150,125 C200,120 250,110 300,100 C350,90 400,70 450,60 C500,50 550,40 600,30"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  {/* Area fill */}
                  <path
                    d="M0,150 C50,140 100,130 150,125 C200,120 250,110 300,100 C350,90 400,70 450,60 C500,50 550,40 600,30 L600,200 L0,200 Z"
                    fill="url(#gradient)"
                    opacity="0.2"
                  />
                  
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-2">
                  <span>$36K</span>
                  <span>$27K</span>
                  <span>$18K</span>
                  <span>$9K</span>
                  <span>$0</span>
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-4 text-xs text-gray-400 px-8">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h3>
              
              {/* Donut Chart */}
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  
                  {/* Data segments */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="12"
                    strokeDasharray="${38 * 2.51} ${100 * 2.51}" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="12"
                    strokeDasharray="${27 * 2.51} ${100 * 2.51}" strokeDashoffset="${-38 * 2.51}" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
                    strokeDasharray="${18 * 2.51} ${100 * 2.51}" strokeDashoffset="${-65 * 2.51}" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                    strokeDasharray="${12 * 2.51} ${100 * 2.51}" strokeDashoffset="${-83 * 2.51}" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="12"
                    strokeDasharray="${5 * 2.51} ${100 * 2.51}" strokeDashoffset="${-95 * 2.51}" />
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {trafficSources.map((source) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${source.color}`}></span>
                      <span className="text-sm text-gray-600">{source.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Conversion Rate</h3>
              <p className="text-sm text-gray-500 mb-6">Last 7 days</p>
              
              {/* Line Chart */}
              <div className="h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="37.5" x2="400" y2="37.5" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="112.5" x2="400" y2="112.5" stroke="#f3f4f6" strokeWidth="1" />
                  
                  {/* Conversion line */}
                  <path
                    d="M0,112.5 C50,105 100,100 150,95 C200,90 250,85 300,80 C350,75 400,85 400,95"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  {/* Data points */}
                  <circle cx="0" cy="112.5" r="4" fill="#10b981" />
                  <circle cx="66" cy="105" r="4" fill="#10b981" />
                  <circle cx="133" cy="100" r="4" fill="#10b981" />
                  <circle cx="200" cy="90" r="4" fill="#10b981" />
                  <circle cx="266" cy="85" r="4" fill="#10b981" />
                  <circle cx="333" cy="80" r="4" fill="#10b981" />
                  <circle cx="400" cy="95" r="4" fill="#10b981" />
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-2">
                  <span>5%</span>
                  <span>4%</span>
                  <span>3%</span>
                  <span>2%</span>
                  <span>1%</span>
                </div>
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Countries</h3>
              
              <div className="space-y-4">
                {countries.map((country) => (
                  <div key={country.code} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-8">{country.code}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{country.name}</span>
                        <span className="text-sm font-medium text-gray-900">{country.visits.toLocaleString()} visits</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${country.color} h-2 rounded-full`}
                          style={{ width: `${(country.visits / maxVisits) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
