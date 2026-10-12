import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  ChevronDown,
  Bell,
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Settings,
  LogOut,
  X,
  Search,
  Flag,
  Trash2,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { supabase } from '../../lib/supabase'

interface Order {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

type ReviewStatus = 'pending' | 'published' | 'flagged' | 'rejected'

interface ReviewRow {
  id: string
  customer_name: string
  customer_email: string | null
  product_id: string | null
  rating: number
  title: string | null
  review_text: string
  status: ReviewStatus
  is_approved: boolean
  helpful_count: number | null
  admin_reply: string | null
  created_at: string
  products?: { name: string } | { name: string }[] | null
}

interface Review {
  id: string
  customer_name: string
  customer_initials: string
  customer_avatar_color: string
  product_name: string
  rating: number
  title: string
  content: string
  status: ReviewStatus
  date: string
  helpful_count: number
  admin_reply: string
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500']

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const avatarColorFor = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash + value.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

const formatReviewDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const productNameFromRow = (products: ReviewRow['products']) => {
  if (!products) return 'Unknown product'
  if (Array.isArray(products)) return products[0]?.name || 'Unknown product'
  return products.name || 'Unknown product'
}

const mapReview = (row: ReviewRow): Review => {
  const status: ReviewStatus =
    row.status === 'published' || row.status === 'flagged' || row.status === 'rejected'
      ? row.status
      : row.is_approved
        ? 'published'
        : 'pending'

  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_initials: getInitials(row.customer_name),
    customer_avatar_color: avatarColorFor(row.customer_name || row.id),
    product_name: productNameFromRow(row.products),
    rating: row.rating,
    title: row.title?.trim() || 'Customer review',
    content: row.review_text,
    status,
    date: formatReviewDate(row.created_at),
    helpful_count: row.helpful_count ?? 0,
    admin_reply: row.admin_reply?.trim() || '',
  }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) return message
  }
  return fallback
}

const FULL_REVIEW_SELECT =
  'id, customer_name, customer_email, product_id, rating, title, review_text, status, is_approved, helpful_count, admin_reply, created_at, products(name)'

const LEGACY_REVIEW_SELECT =
  'id, customer_name, customer_email, product_id, rating, review_text, is_approved, helpful_count, created_at, products(name)'

const isMissingColumnError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase()
  return message.includes('does not exist') || message.includes('could not find') || message.includes('column')
}

export default function Reviews() {
  const navigate = useNavigate()
  const { hasAnyPermission } = useAdminAccess()
  const canModerate = hasAnyPermission(['reviews.moderate', 'roles.manage'])
  const canDelete = hasAnyPermission(['reviews.delete', 'roles.manage'])

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [pageSuccess, setPageSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [actionId, setActionId] = useState<string | null>(null)
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [menuReviewId, setMenuReviewId] = useState<string | null>(null)
  const [hasExtendedSchema, setHasExtendedSchema] = useState(true)

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

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const fullResult = await supabase
        .from('reviews')
        .select(FULL_REVIEW_SELECT)
        .order('created_at', { ascending: false })

      if (!fullResult.error) {
        setHasExtendedSchema(true)
        setReviews(((fullResult.data ?? []) as unknown as ReviewRow[]).map(mapReview))
        return
      }

      if (!isMissingColumnError(fullResult.error)) {
        throw fullResult.error
      }

      // Migration not applied yet — fall back to original reviews columns.
      const legacyResult = await supabase
        .from('reviews')
        .select(LEGACY_REVIEW_SELECT)
        .order('created_at', { ascending: false })

      if (legacyResult.error) throw legacyResult.error

      setHasExtendedSchema(false)
      setReviews(
        ((legacyResult.data ?? []) as unknown as ReviewRow[]).map((row) =>
          mapReview({
            ...row,
            title: null,
            status: row.is_approved ? 'published' : 'pending',
            admin_reply: null,
          }),
        ),
      )
    } catch (error) {
      console.error('Failed to load reviews:', error)
      setPageError(getErrorMessage(error, 'Failed to load reviews'))
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReviews()
      void fetchUserName()
      void fetchOrdersForNotifications()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchReviews, fetchUserName, fetchOrdersForNotifications])

  const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    if (!canModerate) {
      setPageError('You need reviews.moderate permission to moderate reviews.')
      return
    }

    setActionId(reviewId)
    setPageError('')
    setPageSuccess('')
    setMenuReviewId(null)

    try {
      if (!hasExtendedSchema && (status === 'flagged')) {
        setPageError('Run the reviews migration to enable flagging (adds status/title/admin_reply columns).')
        return
      }

      const payload = hasExtendedSchema
        ? { status }
        : { is_approved: status === 'published' }

      const { error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', reviewId)

      if (error) throw error
      setPageSuccess(
        status === 'published'
          ? 'Review approved and published.'
          : status === 'rejected'
            ? 'Review rejected.'
            : status === 'flagged'
              ? 'Review flagged for follow-up.'
              : 'Review moved back to pending.',
      )
      await fetchReviews()
    } catch (error) {
      console.error('Failed to update review:', error)
      setPageError(getErrorMessage(error, 'Failed to update review'))
    } finally {
      setActionId(null)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!canDelete) {
      setPageError('You need reviews.delete permission to remove reviews.')
      return
    }
    if (!window.confirm('Delete this review permanently?')) return

    setActionId(reviewId)
    setPageError('')
    setPageSuccess('')
    setMenuReviewId(null)

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) throw error
      setPageSuccess('Review deleted.')
      await fetchReviews()
    } catch (error) {
      console.error('Failed to delete review:', error)
      setPageError(getErrorMessage(error, 'Failed to delete review'))
    } finally {
      setActionId(null)
    }
  }

  const openReply = (review: Review) => {
    setReplyReviewId(review.id)
    setReplyText(review.admin_reply)
    setMenuReviewId(null)
    setShowNotifications(false)
    setShowProfileMenu(false)
  }

  const saveReply = async () => {
    if (!replyReviewId) return
    if (!canModerate) {
      setPageError('You need reviews.moderate permission to reply.')
      return
    }
    if (!hasExtendedSchema) {
      setPageError('Run the reviews migration to enable staff replies (adds admin_reply column).')
      return
    }

    setActionId(replyReviewId)
    setPageError('')
    setPageSuccess('')

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_reply: replyText.trim() })
        .eq('id', replyReviewId)

      if (error) throw error
      setPageSuccess(replyText.trim() ? 'Reply saved.' : 'Reply cleared.')
      setReplyReviewId(null)
      setReplyText('')
      await fetchReviews()
    } catch (error) {
      console.error('Failed to save reply:', error)
      setPageError(getErrorMessage(error, 'Failed to save reply'))
    } finally {
      setActionId(null)
    }
  }

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.customer_name.toLowerCase().includes(query) ||
        review.product_name.toLowerCase().includes(query) ||
        review.content.toLowerCase().includes(query) ||
        review.title.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || review.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reviews, searchQuery, statusFilter])

  const totalReviews = reviews.length
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length
  const flaggedReviews = reviews.filter((r) => r.status === 'flagged').length
  const publishedReviews = reviews.filter((r) => r.status === 'published').length
  const avgRating =
    totalReviews === 0
      ? 0
      : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews) * 10) / 10

  const stats = [
    { label: 'Avg. rating', value: `${avgRating}`, color: 'text-amber-600', filter: 'all' },
    { label: 'Total', value: totalReviews, color: 'text-indigo-600', filter: 'all' },
    { label: 'Pending', value: pendingReviews, color: 'text-amber-600', filter: 'pending' },
    { label: 'Flagged', value: flaggedReviews, color: 'text-rose-600', filter: 'flagged' },
  ]

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Pending
          </span>
        )
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
            Flagged
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const replyTarget = reviews.find((review) => review.id === replyReviewId) || null

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Reviews</h1>
              <p className="text-[11px] text-gray-500">Moderate and respond to customer reviews.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                    setMenuReviewId(null)
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
                    setMenuReviewId(null)
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
          {!hasExtendedSchema ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              Reviews are loading on the legacy schema. Run migration
              {' '}<code className="font-mono">20240633000000_reviews_status_and_seed.sql</code>
              {' '}in the Supabase SQL editor to add <code className="font-mono">title</code>, <code className="font-mono">status</code>, and <code className="font-mono">admin_reply</code>.
              Approve/Reject still work via <code className="font-mono">is_approved</code>.
            </div>
          ) : null}
          {pageError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{pageError}</div>
          ) : null}
          {pageSuccess ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">{pageSuccess}</div>
          ) : null}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {stats.map((stat) => {
              const active = statusFilter === stat.filter
              return (
                <button
                  key={`${stat.filter}-${stat.label}`}
                  type="button"
                  onClick={() => setStatusFilter(stat.filter)}
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
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer, product, or review…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'all', label: 'All', count: totalReviews },
                  { key: 'pending', label: 'Pending', count: pendingReviews },
                  { key: 'published', label: 'Published', count: publishedReviews },
                  { key: 'flagged', label: 'Flagged', count: flaggedReviews },
                  { key: 'rejected', label: 'Rejected', count: reviews.filter((r) => r.status === 'rejected').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      statusFilter === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-[#D9D0C2] text-gray-600 hover:bg-[#F7F2E8]'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1 py-0.5 rounded text-[10px] ${
                      statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-[#F7F2E8] text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#F0E9DC]">
              {loading ? (
                <div className="px-3 py-8 text-center text-xs text-gray-500">Loading reviews…</div>
              ) : filteredReviews.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-gray-500">No reviews found</div>
              ) : (
                filteredReviews.map((review) => {
                  const busy = actionId === review.id
                  return (
                    <div key={review.id} className="p-3 sm:p-4 hover:bg-[#F7F2E8]/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 ${review.customer_avatar_color} rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                          {review.customer_initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{review.customer_name}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                {getStatusBadge(review.status)}
                              </div>

                              <p className="text-[11px] text-gray-500 mt-0.5">
                                On <span className="text-gray-700">{review.product_name}</span> · {review.date}
                              </p>

                              <h4 className="text-sm font-semibold text-gray-900 mt-2">{review.title}</h4>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{review.content}</p>

                              {review.admin_reply ? (
                                <div className="mt-2 rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/70 px-2.5 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Staff reply</p>
                                  <p className="mt-0.5 text-xs text-gray-700 whitespace-pre-line">{review.admin_reply}</p>
                                </div>
                              ) : null}

                              <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{review.helpful_count} found this helpful</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {(review.status === 'pending' || review.status === 'flagged' || review.status === 'rejected') && (
                                <button
                                  type="button"
                                  disabled={busy || !canModerate}
                                  onClick={() => void updateReviewStatus(review.id, 'published')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {busy ? '…' : 'Approve'}
                                </button>
                              )}
                              {(review.status === 'pending' || review.status === 'flagged') && (
                                <button
                                  type="button"
                                  disabled={busy || !canModerate}
                                  onClick={() => void updateReviewStatus(review.id, 'rejected')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-100 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              )}
                              {review.status === 'published' && (
                                <button
                                  type="button"
                                  disabled={busy || !canModerate}
                                  onClick={() => openReply(review)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-700 border border-[#D9D0C2] bg-white hover:bg-[#F7F2E8] rounded-lg disabled:opacity-50"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Reply
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setMenuReviewId((current) => (current === review.id ? null : review.id))}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-[#F7F2E8] rounded-lg disabled:opacity-50"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {menuReviewId === review.id ? (
                                  <div className="absolute right-0 mt-1 w-40 rounded-xl border border-[#D9D0C2] bg-white shadow-lg z-20 overflow-hidden">
                                    <button
                                      type="button"
                                      disabled={!canModerate}
                                      onClick={() => openReply(review)}
                                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-700 hover:bg-[#F7F2E8] disabled:opacity-50"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" /> Reply
                                    </button>
                                    {review.status !== 'flagged' ? (
                                      <button
                                        type="button"
                                        disabled={!canModerate}
                                        onClick={() => void updateReviewStatus(review.id, 'flagged')}
                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                      >
                                        <Flag className="w-3.5 h-3.5" /> Flag
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={!canModerate}
                                        onClick={() => void updateReviewStatus(review.id, 'pending')}
                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-700 hover:bg-[#F7F2E8] disabled:opacity-50"
                                      >
                                        Unflag
                                      </button>
                                    )}
                                    {canDelete ? (
                                      <button
                                        type="button"
                                        onClick={() => void deleteReview(review.id)}
                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {replyTarget ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
            <div className="my-8 w-full max-w-lg rounded-xl border border-[#D9D0C2] bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Reply to {replyTarget.customer_name}</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{replyTarget.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setReplyReviewId(null); setReplyText('') }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a public staff reply…"
                className="w-full px-3 py-2 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setReplyReviewId(null); setReplyText('') }}
                  className="flex-1 px-3 py-1.5 border border-[#D9D0C2] bg-white text-gray-700 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionId === replyTarget.id || !canModerate}
                  onClick={() => void saveReply()}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionId === replyTarget.id ? 'Saving…' : 'Save reply'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
