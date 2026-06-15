import { useEffect, useState } from 'react'
import { 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  Instagram,
  Facebook,
  Music2,
  Heart,
  MessageCircle,
  Share2,
  Eye
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

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
