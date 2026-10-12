import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  featured_image: string | null
  author_name: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  views: number
  tags: string[]
  created_at: string
}

interface Order {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

type PostStatus = 'draft' | 'published' | 'archived'

const emptyPostForm = () => ({
  title: '',
  excerpt: '',
  body: '',
  featured_image: '',
  author_name: '',
  status: 'draft' as PostStatus,
  published_at: '',
  tags: '',
})

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const fieldClass =
  'w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none'

export default function BlogPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | PostStatus>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [newPost, setNewPost] = useState(emptyPostForm)
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [])

  const fetchOrdersForNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_code, customer_email, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      const ordersWithTime = data.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at),
      }))
      setAllOrders(ordersWithTime)

      const last24Hours = new Date()
      last24Hours.setHours(last24Hours.getHours() - 24)
      setNewOrdersCount(data.filter((o: Order) => new Date(o.created_at) > last24Hours).length)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPosts()
      void fetchUserName()
      void fetchOrdersForNotifications()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchPosts, fetchUserName, fetchOrdersForNotifications])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Date.now()
  }

  const handleAddPost = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const slug = generateSlug(newPost.title)
      const tags = newPost.tags.split(',').map((t) => t.trim()).filter(Boolean)

      const { error } = await supabase.from('blog_posts').insert([
        {
          ...newPost,
          slug,
          tags,
          published_at: newPost.status === 'published' ? newPost.published_at || new Date().toISOString() : null,
        },
      ])

      if (error) throw error
      setShowAddModal(false)
      setNewPost(emptyPostForm())
      void fetchPosts()
    } catch (err) {
      console.error('Error adding post:', err)
      alert('Failed to add post')
    }
  }

  const handleEditPost = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingPost) return

    try {
      const tags = newPost.tags.split(',').map((t) => t.trim()).filter(Boolean)

      const { error } = await supabase
        .from('blog_posts')
        .update({
          ...newPost,
          tags,
          published_at: newPost.status === 'published' ? newPost.published_at || new Date().toISOString() : null,
        })
        .eq('id', editingPost.id)

      if (error) throw error
      setShowEditModal(false)
      setEditingPost(null)
      void fetchPosts()
    } catch (err) {
      console.error('Error updating post:', err)
      alert('Failed to update post')
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id)
      if (error) throw error
      void fetchPosts()
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post)
    setNewPost({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      featured_image: post.featured_image || '',
      author_name: post.author_name,
      status: post.status,
      published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '',
      tags: post.tags?.join(', ') || '',
    })
    setShowEditModal(true)
  }

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query)
      const matchesFilter = filterStatus === 'all' || post.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [posts, searchTerm, filterStatus])

  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)

  const stats = [
    { label: 'Total posts', value: posts.length, color: 'text-indigo-600', filter: 'all' as const },
    { label: 'Published', value: publishedCount, color: 'text-emerald-600', filter: 'published' as const },
    { label: 'Drafts', value: draftCount, color: 'text-amber-600', filter: 'draft' as const },
    { label: 'Total views', value: totalViews.toLocaleString(), color: 'text-sky-600', filter: 'all' as const },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'archived':
        return 'bg-gray-50 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const renderPostForm = (onSubmit: (e: FormEvent) => void, submitLabel: string, onCancel: () => void) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Title *</label>
        <input
          type="text"
          required
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          className={`mt-1 ${fieldClass}`}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Excerpt</label>
        <input
          type="text"
          value={newPost.excerpt}
          onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
          className={`mt-1 ${fieldClass}`}
          placeholder="Brief summary of the post"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Content *</label>
        <textarea
          required
          rows={6}
          value={newPost.body}
          onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
          className={`mt-1 ${fieldClass}`}
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Featured image URL</label>
        <input
          type="url"
          value={newPost.featured_image}
          onChange={(e) => setNewPost({ ...newPost, featured_image: e.target.value })}
          className={`mt-1 ${fieldClass}`}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Author name *</label>
          <input
            type="text"
            required
            value={newPost.author_name}
            onChange={(e) => setNewPost({ ...newPost, author_name: e.target.value })}
            className={`mt-1 ${fieldClass}`}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
          <select
            value={newPost.status}
            onChange={(e) => setNewPost({ ...newPost, status: e.target.value as PostStatus })}
            className={`mt-1 ${fieldClass}`}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {newPost.status === 'published' ? (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Publish date</label>
          <input
            type="datetime-local"
            value={newPost.published_at}
            onChange={(e) => setNewPost({ ...newPost, published_at: e.target.value })}
            className={`mt-1 ${fieldClass}`}
          />
        </div>
      ) : null}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tags (comma separated)</label>
        <input
          type="text"
          value={newPost.tags}
          onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
          className={`mt-1 ${fieldClass}`}
          placeholder="skincare, beauty, tips"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 border border-[#D9D0C2] bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Content</h1>
              <p className="text-[11px] text-gray-500">Manage blog posts and published content.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNewPost(emptyPostForm())
                  setShowAddModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New post
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                  }}
                  className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {newOrdersCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E8E0D4] flex items-center justify-between bg-[#F7F2E8]">
                      <h3 className="text-xs font-semibold text-gray-900">New orders</h3>
                      <button type="button" onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        allOrders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => { setShowNotifications(false); navigate('/orders') }}
                            className="w-full text-left px-3 py-2.5 border-b border-[#F0E9DC] hover:bg-[#F7F2E8] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-[10px] text-gray-400">{order.time_ago}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 truncate">
                              {order.shipping_address?.full_name || order.customer_email}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-[#E8E0D4] bg-[#F7F2E8]">
                      <button
                        type="button"
                        onClick={() => { setShowNotifications(false); navigate('/orders') }}
                        className="w-full py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-white rounded-lg"
                      >
                        View all orders
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu)
                    setShowNotifications(false)
                  }}
                  className="flex items-center gap-1.5 p-0.5 pr-2 hover:bg-white rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]">
                      <p className="text-xs font-semibold text-gray-900">{userName}</p>
                      <p className="text-[10px] text-gray-500">Staff access</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => { setShowProfileMenu(false); navigate('/settings') }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-700 hover:bg-[#F7F2E8] rounded-lg"
                      >
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {stats.map((stat) => {
              const active = filterStatus === stat.filter && stat.label !== 'Total views'
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => setFilterStatus(stat.filter)}
                  className={`rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'border-indigo-400 ring-2 ring-indigo-500/15'
                      : 'border-[#D9D0C2] hover:border-[#C9BEAE]'
                  }`}
                >
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{stat.label}</p>
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]/50 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | PostStatus)}
                  className="px-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                >
                  <option value="all">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="p-3">
              {loading ? (
                <div className="py-10 text-center text-xs text-gray-500">Loading posts…</div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-500">No posts found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-[#D9D0C2] bg-[#F7F2E8]/30 overflow-hidden hover:border-[#C9BEAE] transition-colors"
                    >
                      <div className="aspect-video bg-white relative border-b border-[#E8E0D4]">
                        {post.featured_image ? (
                          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileText className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md border text-[11px] font-medium capitalize ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-2.5">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {(post.views || 0).toLocaleString()}
                          </span>
                        </div>

                        {post.tags && post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-white border border-[#E8E0D4] text-gray-600 text-[10px] rounded-md">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 ? (
                              <span className="px-2 py-0.5 bg-white border border-[#E8E0D4] text-gray-500 text-[10px] rounded-md">
                                +{post.tags.length - 3}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="flex gap-1.5 mt-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(post)}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border border-[#D9D0C2] bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-[#F0E9DC]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deletePost(post.id)}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 border border-rose-200 bg-white text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showAddModal ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
            <div className="my-8 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#D9D0C2] bg-[#F7F2E8] p-4 shadow-xl">
              <div className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Create new post</h2>
                {renderPostForm(
                  (e) => void handleAddPost(e),
                  'Create post',
                  () => setShowAddModal(false),
                )}
              </div>
            </div>
          </div>
        ) : null}

        {showEditModal && editingPost ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
            <div className="my-8 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#D9D0C2] bg-[#F7F2E8] p-4 shadow-xl">
              <div className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Edit post</h2>
                {renderPostForm(
                  (e) => void handleEditPost(e),
                  'Update post',
                  () => {
                    setShowEditModal(false)
                    setEditingPost(null)
                  },
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
