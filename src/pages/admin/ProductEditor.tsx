import { useCallback, useEffect, useState } from 'react'
import type { ComponentProps, ComponentType } from 'react'
import { ArrowLeft, BarChart3, MessageSquareText, Package2, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import ProductModal from '../../components/admin/ProductModal'
import { supabase } from '../../lib/supabase'

type ProductModalProduct = ComponentProps<typeof ProductModal>['product']

interface OrderItem {
  product_id?: string | null
  quantity?: number | null
}

interface OrderRecord {
  id: string
  status: string
  created_at: string
  items: OrderItem[] | null
}

interface ReviewRecord {
  id: string
  rating: number
  is_approved: boolean
  created_at: string
}

interface ProductPerformanceStats {
  unitsSold: number
  orderCount: number
  approvedReviews: number
  averageRating: number
  lastSoldAt: string | null
  latestReviewAt: string | null
}

const COMPLETED_ORDER_STATUSES = new Set(['Delivered', 'Order Completed'])

const EMPTY_STATS: ProductPerformanceStats = {
  unitsSold: 0,
  orderCount: 0,
  approvedReviews: 0,
  averageRating: 0,
  lastSoldAt: null,
  latestReviewAt: null,
}

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

const formatDate = (value: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const formatRating = (value: number) => `${value > 0 ? value.toFixed(1) : '0.0'}/5`

const computeProductStats = (
  orders: OrderRecord[],
  reviews: ReviewRecord[],
  targetProductId: string,
): ProductPerformanceStats => {
  const completedOrders = orders.filter((order) => COMPLETED_ORDER_STATUSES.has(order.status))
  const matchingOrderIds = new Set<string>()
  let unitsSold = 0
  let lastSoldAt: string | null = null

  completedOrders.forEach((order) => {
    const matchingItems = (Array.isArray(order.items) ? order.items : []).filter(
      (item) => item?.product_id === targetProductId,
    )

    if (matchingItems.length === 0) {
      return
    }

    matchingOrderIds.add(order.id)
    matchingItems.forEach((item) => {
      unitsSold += Number(item.quantity || 0)
    })

    if (!lastSoldAt || new Date(order.created_at).getTime() > new Date(lastSoldAt).getTime()) {
      lastSoldAt = order.created_at
    }
  })

  const latestReviewAt = reviews.reduce<string | null>((latest, review) => {
    if (!latest) return review.created_at
    return new Date(review.created_at).getTime() > new Date(latest).getTime() ? review.created_at : latest
  }, null)

  const approvedReviews = reviews.filter((review) => review.is_approved)
  const averageRating = approvedReviews.length
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
    : 0

  return {
    unitsSold,
    orderCount: matchingOrderIds.size,
    approvedReviews: approvedReviews.length,
    averageRating,
    lastSoldAt,
    latestReviewAt,
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper: string
  tone: string
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

export default function ProductEditor() {
  const { productId } = useParams<{ productId: string }>()
  const currentProductId = productId ?? 'new'
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductModalProduct>(undefined)
  const [stats, setStats] = useState<ProductPerformanceStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(currentProductId !== 'new')
  const [error, setError] = useState('')
  const [statsError, setStatsError] = useState('')

  const loadEditorData = useCallback(async (targetProductId: string) => {
    if (!targetProductId || targetProductId === 'new') {
      setProduct(undefined)
      setStats(EMPTY_STATS)
      setError('')
      setStatsError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setStatsError('')

    const [productResult, ordersResult, reviewsResult] = await Promise.all([
      supabase.from('products').select('*').eq('id', targetProductId).maybeSingle(),
      supabase.from('orders').select('id,status,created_at,items').order('created_at', { ascending: false }),
      supabase.from('reviews').select('id,rating,is_approved,created_at').eq('product_id', targetProductId).order('created_at', { ascending: false }),
    ])

    if (productResult.error) {
      setError(productResult.error.message)
      setLoading(false)
      return
    }

    if (!productResult.data) {
      setError('Product not found.')
      setLoading(false)
      return
    }

    setProduct(productResult.data as ProductModalProduct)

    if (ordersResult.error || reviewsResult.error) {
      console.error('Error loading product metrics:', ordersResult.error || reviewsResult.error)
      setStats(EMPTY_STATS)
      setStatsError('Performance metrics are temporarily unavailable.')
    } else {
      setStats(
        computeProductStats(
          (ordersResult.data || []) as OrderRecord[],
          (reviewsResult.data || []) as ReviewRecord[],
          targetProductId,
        ),
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEditorData(currentProductId)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentProductId, loadEditorData])

  const handleSaved = useCallback((savedProductId?: string) => {
    if (currentProductId === 'new' && savedProductId) {
      navigate(`/products/${savedProductId}`, { replace: true })
    }
  }, [currentProductId, navigate])

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Loading product workspace...</p>
                  <p className="text-sm text-gray-500">Fetching editor content and live performance data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && currentProductId !== 'new') {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Unable to open product</p>
              <p className="mt-3 text-base text-gray-700">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to products
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to products
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-600">Product workspace</p>
                <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                  {currentProductId === 'new' ? 'Create a new product' : 'Edit product workspace'}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-gray-500">
                  A focused page layout for product management, with live order performance and review signals.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Product ID</p>
              <p className="mt-1 font-mono text-sm text-gray-900">{currentProductId}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 min-w-0">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={Package2}
                  label="Lifetime sales"
                  value={formatNumber(stats.unitsSold)}
                  helper="Units sold from completed orders"
                  tone="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                  icon={ShoppingBag}
                  label="Orders"
                  value={formatNumber(stats.orderCount)}
                  helper="Orders containing this product"
                  tone="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  icon={Star}
                  label="Average rating"
                  value={formatRating(stats.averageRating)}
                  helper="Approved reviews only"
                  tone="bg-amber-50 text-amber-600"
                />
                <StatCard
                  icon={MessageSquareText}
                  label="Approved reviews"
                  value={formatNumber(stats.approvedReviews)}
                  helper="Visible review count"
                  tone="bg-violet-50 text-violet-600"
                />
              </div>

              <ProductModal
                key={currentProductId}
                product={product}
                layout="page"
                closeOnSave={false}
                onClose={() => navigate('/products')}
                onSaved={handleSaved}
              />
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6 self-start">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Performance snapshot</p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900">Live product activity</h2>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <SnapshotRow label="Last sale" value={formatDate(stats.lastSoldAt)} />
                  <SnapshotRow label="Latest review" value={formatDate(stats.latestReviewAt)} />
                  <SnapshotRow label="Sales basis" value="Delivered orders only" />
                  <SnapshotRow label="Review basis" value="Approved reviews only" />
                </div>

                {statsError ? (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{statsError}</p>
                ) : (
                  <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Metrics update automatically from completed order rows and review records.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Workspace map</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>Basics — product identity, pricing, inventory, and media.</li>
                  <li>Branding — brand name, logo, and seller details.</li>
                  <li>How To Use & Ingredients — customer-facing copy.</li>
                  <li>Page Sections — manifesto and breakdown blocks.</li>
                  <li>Blog Assignment — attach editorial content.</li>
                  <li>Reviews — moderate product feedback.</li>
                </ul>
              </div>
            </aside>
          </div>

          {statsError && currentProductId === 'new' && (
            <p className="mt-6 text-sm text-gray-500">Performance metrics will appear once the product has sales and reviews.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
