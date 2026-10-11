import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import ProductModal, { type ProductPerformanceStats } from '../../components/admin/ProductModal'
import { supabase } from '../../lib/supabase'

type ProductModalProduct = Parameters<typeof ProductModal>[0]['product']

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

const COMPLETED_ORDER_STATUSES = new Set(['Delivered', 'Order Completed'])

const EMPTY_STATS: ProductPerformanceStats = {
  unitsSold: 0,
  orderCount: 0,
  approvedReviews: 0,
  averageRating: 0,
  lastSoldAt: null,
  latestReviewAt: null,
}

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
      supabase
        .from('reviews')
        .select('id,rating,is_approved,created_at')
        .eq('product_id', targetProductId)
        .order('created_at', { ascending: false }),
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

  const handleSaved = useCallback(
    (savedProductId?: string) => {
      if (currentProductId === 'new' && savedProductId) {
        navigate(`/products/${savedProductId}`, { replace: true })
      } else if (savedProductId || currentProductId !== 'new') {
        void loadEditorData(savedProductId || currentProductId)
      }
    },
    [currentProductId, loadEditorData, navigate],
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Loading product…</p>
                  <p className="text-xs text-gray-500">Fetching editor content.</p>
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
          <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Unable to open product</p>
              <p className="mt-2 text-sm text-gray-700">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <ProductModal
            key={currentProductId}
            product={product}
            layout="page"
            closeOnSave={false}
            stats={stats}
            statsError={statsError}
            onClose={() => navigate('/products')}
            onSaved={handleSaved}
          />
        </div>
      </div>
    </AdminLayout>
  )
}
