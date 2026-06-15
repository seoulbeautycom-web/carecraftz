import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronDown, 
  Bell,
  Plus,
  Instagram,
  Facebook,
  Music2,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Settings,
  LogOut,
  X
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

interface SocialPost {
  id: string
  platform: 'instagram' | 'facebook' | 'tiktok'
  image: string
  content: string
  likes: number
  comments: number
  shares: number
  reach: string
  timeAgo: string
}

interface SocialStats {
  platform: 'instagram' | 'facebook' | 'tiktok'
  followers: string
  posts: number
  growth: string
  growthColor: string
}

export default function Social() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
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

  // Social stats
  const socialStats: SocialStats[] = [
    { platform: 'instagram', followers: '12.4K', posts: 142, growth: '+8.2%', growthColor: 'text-emerald-600' },
    { platform: 'facebook', followers: '4.8K', posts: 89, growth: '+2.1%', growthColor: 'text-emerald-600' },
    { platform: 'tiktok', followers: '28.1K', posts: 56, growth: '+14.5%', growthColor: 'text-emerald-600' }
  ]

  // Sample posts
  const recentPosts: SocialPost[] = [
    {
      id: '1',
      platform: 'instagram',
      image: '/social-placeholder.jpg',
      content: 'Sunday ritual 🌿 Our Calendula soap turning a simple wash into something grounding.',
      likes: 1240,
      comments: 84,
      shares: 32,
      reach: '5.4K',
      timeAgo: '2d ago'
    },
    {
      id: '2',
      platform: 'tiktok',
      image: '/social-placeholder.jpg',
      content: 'How we make our Whipped Shea Body Butter in small batches 🐝 Full process in the video.',
      likes: 4820,
      comments: 210,
      shares: 940,
      reach: '62K',
      timeAgo: '4d ago'
    },
    {
      id: '3',
      platform: 'facebook',
      image: '/social-placeholder.jpg',
      content: 'NEW: Rosehip Facial Serum is back in stock. Preorders sold out in 48 hrs — this batch won\'t last long.',
      likes: 328,
      comments: 44,
      shares: 28,
      reach: '3.2K',
      timeAgo: '6d ago'
    }
  ]

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />
      case 'tiktok':
        return <Music2 className="w-5 h-5 text-black" />
      default:
        return null
    }
  }

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-pink-100 text-pink-700">
            <Instagram className="w-3 h-3" />
            Instagram
          </span>
        )
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
            <Facebook className="w-3 h-3" />
            Facebook
          </span>
        )
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
            <Music2 className="w-3 h-3" />
            TikTok
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Social</h1>
              <p className="text-sm text-gray-500">Track and schedule your social media presence.</p>
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
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <Settings className="w-4 h-4" /> Settings
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
          {/* Social Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {socialStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(stat.platform)}
                    <span className="text-sm font-medium text-gray-600 capitalize">{stat.platform}</span>
                  </div>
                  <span className={`text-xs font-medium ${stat.growthColor} bg-emerald-50 px-2 py-1 rounded-full`}>
                    {stat.growth}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.followers}</p>
                    <p className="text-sm text-gray-500 mt-1">Followers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stat.posts}</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Posts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Schedule Post
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentPosts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    {/* Post Image Placeholder */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    </div>
                    
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getPlatformBadge(post.platform)}
                        <span className="text-sm text-gray-400">{post.timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                      
                      {/* Engagement Stats */}
                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Share2 className="w-4 h-4" />
                          <span>{post.shares}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
                          <Eye className="w-4 h-4" />
                          <span>Reach: {post.reach}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
