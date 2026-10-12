import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import {
  DEFAULT_STORE_SETTINGS,
  LOCATION_META,
  type PlatformStoreSettings,
  fetchPlatformStoreSettings,
} from '../../lib/storeSettings'

interface OrderItem {
  product_id?: string
  name?: string
  quantity?: number
  price?: number
}

interface OrderTotalsCurrency {
  total?: number
}

interface OrderRow {
  id: string
  order_code: string
  customer_email: string
  status: string
  created_at: string
  time_ago?: string
  shipping_address?: {
    full_name?: string
  }
  totals?: {
    pkr?: OrderTotalsCurrency
    aed?: OrderTotalsCurrency
  }
  items?: OrderItem[]
}

const STATUS_DISPLAY: Record<string, string> = {
  'Order Received': 'Pending',
  'Order Confirmed': 'Processing',
  'Being Packaged': 'Processing',
  Dispatched: 'Processing',
  Delivered: 'Fulfilled',
  'Order Completed': 'Fulfilled',
  Refunded: 'Refunded',
}

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Processing: 'bg-blue-100 text-blue-800',
  Fulfilled: 'bg-emerald-100 text-emerald-800',
  Refunded: 'bg-rose-100 text-rose-800',
  Other: 'bg-gray-100 text-gray-700',
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

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const getOrderTotal = (order: OrderRow) => {
  const pkr = order.totals?.pkr?.total
  const aed = order.totals?.aed?.total
  if (typeof pkr === 'number' && pkr > 0) return { amount: pkr, currency: 'PKR' as const }
  if (typeof aed === 'number' && aed > 0) return { amount: aed, currency: 'AED' as const }
  if (typeof pkr === 'number') return { amount: pkr, currency: 'PKR' as const }
  if (typeof aed === 'number') return { amount: aed, currency: 'AED' as const }
  return { amount: 0, currency: 'AED' as const }
}

const formatMoney = (amount: number, currency: 'AED' | 'PKR') => {
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
  }
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

const formatChange = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return { label: '0%', trend: 'flat' as const }
    return { label: '+100%', trend: 'up' as const }
  }
  const pct = ((current - previous) / previous) * 100
  const rounded = Math.abs(pct) >= 10 ? pct.toFixed(0) : pct.toFixed(1)
  if (pct > 0.05) return { label: `+${rounded}%`, trend: 'up' as const }
  if (pct < -0.05) return { label: `${rounded}%`, trend: 'down' as const }
  return { label: '0%', trend: 'flat' as const }
}

const dayLabel = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short' })

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [productCount, setProductCount] = useState(0)
  const [activeProductCount, setActiveProductCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [myStore, setMyStore] = useState<PlatformStoreSettings>(DEFAULT_STORE_SETTINGS)

  useEffect(() => {
    void bootstrap()
  }, [])

  const bootstrap = async () => {
    setLoading(true)
    try {
      const [{ data: sessionData }, ordersResult, productsResult, activeProductsResult, storeSettings] =
        await Promise.all([
          supabase.auth.getSession(),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
          fetchPlatformStoreSettings(),
        ])

      const email = sessionData.session?.user?.email
      if (email) {
        const name = email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }

      if (ordersResult.error) throw ordersResult.error
      setOrders((ordersResult.data ?? []) as OrderRow[])
      setProductCount(productsResult.count ?? 0)
      setActiveProductCount(activeProductsResult.count ?? 0)
      setMyStore(storeSettings)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const dashboard = useMemo(() => {
    const now = new Date()
    const weekStart = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    const prevWeekStart = startOfDay(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const inRange = (date: Date, start: Date, end: Date) => date >= start && date < end

    const currentOrders = orders.filter((order) => inRange(new Date(order.created_at), weekStart, now))
    const previousOrders = orders.filter((order) =>
      inRange(new Date(order.created_at), prevWeekStart, weekStart),
    )

    const sumRevenue = (list: OrderRow[]) =>
      list.reduce(
        (acc, order) => {
          const { amount, currency } = getOrderTotal(order)
          if (currency === 'AED') acc.aed += amount
          else acc.pkr += amount
          return acc
        },
        { aed: 0, pkr: 0 },
      )

    const currentRevenue = sumRevenue(currentOrders)
    const previousRevenue = sumRevenue(previousOrders)
    const primaryCurrency: 'AED' | 'PKR' = currentRevenue.aed >= currentRevenue.pkr ? 'AED' : 'PKR'
    const currentPrimary = primaryCurrency === 'AED' ? currentRevenue.aed : currentRevenue.pkr
    const previousPrimary = primaryCurrency === 'AED' ? previousRevenue.aed : previousRevenue.pkr

    const uniqueCustomers = new Set(
      currentOrders.map((order) => order.customer_email?.toLowerCase()).filter(Boolean),
    ).size
    const previousCustomers = new Set(
      previousOrders.map((order) => order.customer_email?.toLowerCase()).filter(Boolean),
    ).size

    const unitsSold = currentOrders.reduce(
      (sum, order) =>
        sum + (order.items ?? []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
      0,
    )
    const previousUnits = previousOrders.reduce(
      (sum, order) =>
        sum + (order.items ?? []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
      0,
    )

    const days: { label: string; orders: number; revenue: number }[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000))
      const next = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      const dayOrders = orders.filter((order) => {
        const created = new Date(order.created_at)
        return created >= day && created < next
      })
      days.push({
        label: dayLabel(day),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => {
          const { amount, currency } = getOrderTotal(order)
          return currency === primaryCurrency ? sum + amount : sum
        }, 0),
      })
    }

    const productMap = new Map<string, { name: string; sold: number; revenue: number }>()
    for (const order of currentOrders) {
      for (const item of order.items ?? []) {
        const name = (item.name || 'Unknown product').trim() || 'Unknown product'
        const key = item.product_id || name
        const quantity = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        const existing = productMap.get(key) ?? { name, sold: 0, revenue: 0 }
        existing.sold += quantity
        existing.revenue += quantity * price
        productMap.set(key, existing)
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((left, right) => right.sold - left.sold || right.revenue - left.revenue)
      .slice(0, 5)

    const recentOrders = orders.slice(0, 6).map((order) => ({
      ...order,
      time_ago: getTimeAgo(order.created_at),
    }))

    const newOrders = orders.filter((order) => new Date(order.created_at) > last24Hours)
    const pendingOrders = orders.filter((order) => {
      const label = STATUS_DISPLAY[order.status] || 'Other'
      return label === 'Pending' || label === 'Processing'
    }).length

    return {
      currentOrders,
      currentPrimary,
      primaryCurrency,
      uniqueCustomers,
      unitsSold,
      days,
      topProducts,
      recentOrders,
      newOrders,
      newOrdersCount: newOrders.length,
      pendingOrders,
      changes: {
        revenue: formatChange(currentPrimary, previousPrimary),
        orders: formatChange(currentOrders.length, previousOrders.length),
        customers: formatChange(uniqueCustomers, previousCustomers),
        units: formatChange(unitsSold, previousUnits),
      },
    }
  }, [orders])

  const maxDayRevenue = Math.max(...dashboard.days.map((day) => day.revenue), 1)
  const maxDayOrders = Math.max(...dashboard.days.map((day) => day.orders), 1)

  const stats = [
    {
      label: 'Revenue (7d)',
      value: formatMoney(dashboard.currentPrimary, dashboard.primaryCurrency),
      change: dashboard.changes.revenue,
      subtext: 'vs previous 7 days',
      icon: Wallet,
      tone: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Orders (7d)',
      value: dashboard.currentOrders.length.toLocaleString(),
      change: dashboard.changes.orders,
      subtext: `${dashboard.pendingOrders} pending / processing`,
      icon: ShoppingCart,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Customers (7d)',
      value: dashboard.uniqueCustomers.toLocaleString(),
      change: dashboard.changes.customers,
      subtext: 'Unique emails this week',
      icon: Users,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Units sold (7d)',
      value: dashboard.unitsSold.toLocaleString(),
      change: dashboard.changes.units,
      subtext: `${activeProductCount} active of ${productCount} products`,
      icon: Package,
      tone: 'bg-blue-50 text-blue-600',
    },
  ]

  const statusLabel = (status: string) => STATUS_DISPLAY[status] || status || 'Other'
  const statusBadgeClass = (status: string) => STATUS_BADGE[statusLabel(status)] || STATUS_BADGE.Other

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
              <p className="text-[11px] text-gray-500">
                Welcome back, {userName} — live store overview for the last 7 days.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void bootstrap()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D0C2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white/80"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
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
                  {dashboard.newOrdersCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E8E0D4] flex items-center justify-between bg-[#F7F2E8]">
                      <h3 className="text-xs font-semibold text-gray-900">New orders</h3>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {dashboard.newOrdersCount === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        dashboard.newOrders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                              setShowNotifications(false)
                              navigate(`/orders?id=${order.id}`)
                            }}
                            className="w-full text-left px-3 py-2.5 border-b border-[#F0E9DC] hover:bg-[#F7F2E8] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-[10px] text-gray-400">{getTimeAgo(order.created_at)}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 truncate">
                              {order.shipping_address?.full_name || order.customer_email}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-[#E8E0D4]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/orders')
                        }}
                        className="w-full rounded-lg py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"
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
                  className="flex items-center gap-1.5 p-1 pr-2 hover:bg-white rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                  />
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
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate('/settings')
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-700 hover:bg-[#F7F2E8] rounded-lg"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <section className="lg:col-span-2 rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-semibold text-gray-800">My Store</h2>
                    <p className="text-[10px] text-gray-500 truncate">CareCraftz storefront identity</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/partners?tab=setup')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
                >
                  Edit
                </button>
              </div>
              <div className="p-3.5 space-y-3">
                <div>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">{myStore.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{myStore.email || '—'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#E8E0D4] bg-[#FBF8F2]/80 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      <Globe className="w-3 h-3" />
                      URL
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{myStore.website_url}</p>
                  </div>
                  <div className="rounded-lg border border-[#E8E0D4] bg-[#FBF8F2]/80 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      <Phone className="w-3 h-3" />
                      Number
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{myStore.phone || '—'}</p>
                  </div>
                  <div className="sm:col-span-2 rounded-lg border border-[#E8E0D4] bg-[#FBF8F2]/80 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </div>
                    <p className="text-xs font-medium text-gray-800">
                      {LOCATION_META[myStore.location_code].label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {myStore.currency} · {myStore.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="lg:col-span-3 grid grid-cols-2 gap-2 content-start">
              {stats.map((stat) => {
                const Icon = stat.icon
                const trendUp = stat.change.trend === 'up'
                const trendDown = stat.change.trend === 'down'
                return (
                  <div key={stat.label} className="rounded-xl border border-[#D9D0C2] bg-white px-2.5 py-2">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stat.tone}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${
                          trendUp
                            ? 'bg-emerald-50 text-emerald-700'
                            : trendDown
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {trendUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : null}
                        {trendDown ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
                        {stat.change.label}
                      </span>
                    </div>
                    <p className="text-base font-bold text-gray-900 leading-tight">
                      {loading ? '—' : stat.value}
                    </p>
                    <p className="text-[10px] font-medium text-gray-600 mt-0.5">{stat.label}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 truncate">{stat.subtext}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Revenue overview</h3>
                  <p className="text-[10px] text-gray-500">Last 7 days · {dashboard.primaryCurrency}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/analytics')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Full analytics
                </button>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="h-48 flex items-center justify-center text-xs text-gray-400">Loading…</div>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-2">
                    {dashboard.days.map((day) => {
                      const height = Math.max((day.revenue / maxDayRevenue) * 100, day.revenue > 0 ? 8 : 2)
                      return (
                        <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                          <span className="text-[9px] text-gray-400 truncate w-full text-center">
                            {day.revenue > 0 ? formatMoney(day.revenue, dashboard.primaryCurrency) : '—'}
                          </span>
                          <div className="w-full h-36 flex items-end rounded-t-md bg-[#F7F2E8] overflow-hidden">
                            <div
                              className="w-full rounded-t-md bg-indigo-500 transition-all"
                              style={{ height: `${height}%` }}
                              title={`${day.label}: ${formatMoney(day.revenue, dashboard.primaryCurrency)}`}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-gray-500">{day.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-gray-800">Top products</h3>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </button>
              </div>
              <div className="p-3 space-y-2">
                {loading ? (
                  <p className="py-8 text-center text-xs text-gray-400">Loading…</p>
                ) : dashboard.topProducts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-400">No product sales this week</p>
                ) : (
                  dashboard.topProducts.map((product, index) => (
                    <div
                      key={`${product.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#F0E9DC] bg-[#FBF8F2]/60 px-2.5 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-4">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-500">
                            {product.sold} sold · {formatMoney(product.revenue, dashboard.primaryCurrency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-gray-800">Recent orders</h3>
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E0D4] bg-[#FBF8F2]/50">
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Order
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Customer
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Amount
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">
                          Loading orders…
                        </td>
                      </tr>
                    ) : dashboard.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      dashboard.recentOrders.map((order) => {
                        const { amount, currency } = getOrderTotal(order)
                        const label = statusLabel(order.status)
                        return (
                          <tr
                            key={order.id}
                            className="border-b border-[#F0E9DC] last:border-0 hover:bg-[#F7F2E8]/60 cursor-pointer transition-colors"
                            onClick={() => navigate(`/orders?id=${order.id}`)}
                          >
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-semibold text-gray-900">
                                {order.order_code || `#${order.id.slice(0, 6)}`}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                                  {(
                                    order.shipping_address?.full_name ||
                                    order.customer_email ||
                                    '?'
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-700 truncate">
                                  {order.shipping_address?.full_name || order.customer_email}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusBadgeClass(order.status)}`}
                              >
                                {label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-medium text-gray-900">
                                {formatMoney(amount, currency)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-[11px] text-gray-500">{order.time_ago}</span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2]">
                <h3 className="text-xs font-semibold text-gray-800">Orders / day</h3>
                <p className="text-[10px] text-gray-500">Last 7 days</p>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="h-44 flex items-center justify-center text-xs text-gray-400">Loading…</div>
                ) : (
                  <>
                    <div className="h-44 flex items-end justify-between gap-1.5">
                      {dashboard.days.map((day) => {
                        const height = Math.max((day.orders / maxDayOrders) * 100, day.orders > 0 ? 10 : 3)
                        return (
                          <div key={`orders-${day.label}`} className="flex-1 flex flex-col items-center gap-1.5">
                            <span className="text-[9px] text-gray-400">{day.orders || ''}</span>
                            <div className="w-full h-32 flex items-end rounded-t-sm bg-[#F7F2E8]">
                              <div
                                className="w-full rounded-t-sm bg-indigo-500"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-medium text-gray-500">{day.label}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('/orders')}
                        className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-white"
                      >
                        Manage orders
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-white"
                      >
                        Products
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/analytics')}
                        className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-white"
                      >
                        Analytics
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
