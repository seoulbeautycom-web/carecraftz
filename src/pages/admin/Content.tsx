import { useEffect, useState } from 'react'
import { 
  FileText, 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  Image as ImageIcon,
  Layout
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface Page {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft'
  views: number
  updated: string
}

interface BlogPost {
  id: string
  title: string
  category: string
  status: 'published' | 'draft' | 'scheduled'
  publishDate: string
  readTime: string
}

export default function Content() {
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

  // Sample pages data
  const pages: Page[] = [
    { id: '1', title: 'About Us', slug: '/about', status: 'published', views: 1240, updated: 'Jun 10, 2026' },
    { id: '2', title: 'Our Ingredients', slug: '/ingredients', status: 'published', views: 890, updated: 'Jun 8, 2026' },
    { id: '3', title: 'Sustainability Pledge', slug: '/sustainability', status: 'draft', views: 0, updated: 'Jun 5, 2026' },
    { id: '4', title: 'FAQ', slug: '/faq', status: 'published', views: 3420, updated: 'May 28, 2026' }
  ]

  // Sample blog posts data
  const blogPosts: BlogPost[] = [
    { id: '1', title: 'The Science of Rosehip Oil', category: 'Ingredients', status: 'published', publishDate: 'Jun 12, 2026', readTime: '5 min' },
    { id: '2', title: 'How We Source Our Botanicals', category: 'Behind the Scenes', status: 'published', publishDate: 'Jun 8, 2026', readTime: '4 min' },
    { id: '3', title: 'Summer Skincare Rituals', category: 'Lifestyle', status: 'draft', publishDate: '—', readTime: '6 min' },
    { id: '4', title: 'Zero Waste Packaging Guide', category: 'Sustainability', status: 'scheduled', publishDate: 'Jun 18, 2026', readTime: '3 min' }
  ]

  const stats = [
    { label: 'Pages', value: 4, icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Blog Posts', value: 12, icon: FileText, color: 'bg-purple-100 text-purple-600' },
    { label: 'Media Files', value: 86, icon: ImageIcon, color: 'bg-amber-100 text-amber-600' },
    { label: 'Templates', value: 3, icon: Layout, color: 'bg-emerald-100 text-emerald-600' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Published
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Draft
          </span>
        )
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Scheduled
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
              <h1 className="text-xl font-semibold text-gray-900">Content</h1>
              <p className="text-sm text-gray-500">Manage pages, blog posts, and media.</p>
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
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                    <div className={`w-10 h-10 ${stat.color.split(' ')[0]} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pages Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                New Page
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{page.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{page.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(page.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{page.views.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{page.updated}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blog Posts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Blog Posts</h3>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Publish Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Read Time</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{post.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{post.publishDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
