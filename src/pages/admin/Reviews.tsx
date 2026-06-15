import { useEffect, useState } from 'react'
import { 
  Star, 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface Review {
  id: string
  customer_name: string
  customer_initials: string
  customer_avatar_color: string
  product_name: string
  rating: number
  title: string
  content: string
  status: 'published' | 'pending' | 'flagged'
  date: string
  helpful_count: number
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    fetchReviews()
    fetchUserName()
  }, [])

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const fetchReviews = async () => {
    // For demo, using sample data
    setReviews(sampleReviews)
    setLoading(false)
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalReviews = reviews.length
  const avgRating = 4.0
  const pendingReviews = reviews.filter(r => r.status === 'pending').length
  const flaggedReviews = reviews.filter(r => r.status === 'flagged').length

  const stats = [
    { 
      label: 'Avg. Rating', 
      value: `${avgRating}/5`, 
      color: 'text-amber-600',
      subtext: '',
      stars: true
    },
    { label: 'Total Reviews', value: totalReviews, color: 'text-indigo-600' },
    { label: 'Pending', value: pendingReviews, color: 'text-amber-600' },
    { label: 'Flagged', value: flaggedReviews, color: 'text-red-600' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Published
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Pending
          </span>
        )
      case 'flagged':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
            Flagged
          </span>
        )
      default:
        return null
    }
  }

  // Sample reviews data
  const sampleReviews: Review[] = [
    {
      id: '1',
      customer_name: 'Sarah K.',
      customer_initials: 'SK',
      customer_avatar_color: 'bg-blue-500',
      product_name: 'Calendula & Oat Soap',
      rating: 5,
      title: 'My skin has never felt better',
      content: 'I switched to this soap six months ago and haven\'t looked back. It lathers beautifully and leaves zero residue. My skin feels soft all day.',
      status: 'published',
      date: 'Jun 12, 2026',
      helpful_count: 24
    },
    {
      id: '2',
      customer_name: 'Theo C.',
      customer_initials: 'TC',
      customer_avatar_color: 'bg-purple-500',
      product_name: 'Rosehip Facial Serum',
      rating: 5,
      title: 'Worth every penny',
      content: 'I was skeptical at first but after two weeks of use I can see a noticeable difference in my skin tone. The texture is lightweight and absorbs fast.',
      status: 'published',
      date: 'Jun 10, 2026',
      helpful_count: 18
    },
    {
      id: '3',
      customer_name: 'Priya S.',
      customer_initials: 'PS',
      customer_avatar_color: 'bg-amber-500',
      product_name: 'Green Clay Detox Mask',
      rating: 4,
      title: 'Really effective but strong scent',
      content: 'Does exactly what it claims. My pores are visibly smaller after 2 uses. Giving 4 stars only because the clay scent is quite strong for my taste.',
      status: 'pending',
      date: 'Jun 9, 2026',
      helpful_count: 7
    },
    {
      id: '4',
      customer_name: 'Leo F.',
      customer_initials: 'LF',
      customer_avatar_color: 'bg-emerald-500',
      product_name: 'Whipped Shea Body Butter',
      rating: 4,
      title: 'So moisturizing!',
      content: 'Love how thick and creamy this is. Perfect for dry winter skin. Takes a while to absorb but once it does, skin stays hydrated all day.',
      status: 'pending',
      date: 'Jun 7, 2026',
      helpful_count: 12
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
              <h1 className="text-xl font-semibold text-gray-900">Reviews</h1>
              <p className="text-sm text-gray-500">Moderate and respond to customer reviews.</p>
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
                {stat.stars ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-amber-600">{avgRating}</span>
                      <span className="text-lg text-gray-400">/5</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Status Filter Tabs */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', count: totalReviews },
                  { key: 'pending', label: 'Pending', count: pendingReviews },
                  { key: 'published', label: 'Published', count: reviews.filter(r => r.status === 'published').length },
                  { key: 'flagged', label: 'Flagged', count: flaggedReviews }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === tab.key
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      statusFilter === tab.key ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Loading reviews...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No reviews found
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 ${review.customer_avatar_color} rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
                        {review.customer_initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {/* Header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{review.customer_name}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              {getStatusBadge(review.status)}
                            </div>
                            
                            {/* Product & Date */}
                            <p className="text-sm text-gray-500 mt-0.5">
                              On <span className="text-gray-700">{review.product_name}</span> · {review.date}
                            </p>

                            {/* Review Content */}
                            <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {review.content}
                            </p>

                            {/* Helpful Count */}
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-3">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{review.helpful_count} found this helpful</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {review.status === 'pending' && (
                              <>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Approve
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {review.status === 'published' && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                Reply
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
