import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface OrderItem {
  product_id?: string
  name?: string
  quantity?: number
  price?: number
  currency?: string
}

interface OrderTotalsCurrency {
  subtotal?: number
  delivery?: number
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
    city?: string
    country?: string
  }
  totals?: {
    pkr?: OrderTotalsCurrency
    aed?: OrderTotalsCurrency
  }
  items?: OrderItem[]
  payment_method?: string
}

type RangeKey = '7d' | '30d' | '90d' | '6m'

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: '6m', label: '6 months', days: 183 },
]

const STATUS_DISPLAY: Record<string, string> = {
  'Order Received': 'Pending',
  'Order Confirmed': 'Processing',
  'Being Packaged': 'Processing',
  Dispatched: 'Processing',
  Delivered: 'Fulfilled',
  'Order Completed': 'Fulfilled',
  Refunded: 'Refunded',
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-500',
  Processing: 'bg-blue-500',
  Fulfilled: 'bg-emerald-500',
  Refunded: 'bg-rose-500',
  Other: 'bg-gray-400',
}

const COUNTRY_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500', 'bg-violet-500']

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

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: 'short' })
}

const dayLabel = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short' })

const normalizeCountry = (value?: string) => {
  const raw = (value || '').trim()
  if (!raw) return 'Unknown'
  const upper = raw.toUpperCase()
  if (['AE', 'UAE', 'UNITED ARAB EMIRATES'].includes(upper) || raw.toLowerCase().includes('emirates')) {
    return 'United Arab Emirates'
  }
  if (['PK', 'PAK', 'PAKISTAN'].includes(upper)) return 'Pakistan'
  if (['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(upper)) return 'United States'
  if (['GB', 'UK', 'UNITED KINGDOM'].includes(upper)) return 'United Kingdom'
  return raw
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export default function Analytics() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [range, setRange] = useState<RangeKey>('30d')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [productCount, setProductCount] = useState(0)
  const [activeProductCount, setActiveProductCount] = useState(0)

  useEffect(() => {
    void bootstrap()
  }, [])

  const bootstrap = async () => {
    setLoading(true)
    try {
      const [{ data: sessionData }, ordersResult, productsResult, activeProductsResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
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
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const rangeDays = RANGE_OPTIONS.find((option) => option.key === range)?.days ?? 30

  const analytics = useMemo(() => {
    const now = new Date()
    const currentStart = startOfDay(new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000))
    const previousStart = startOfDay(new Date(currentStart.getTime() - rangeDays * 24 * 60 * 60 * 1000))

    const inRange = (date: Date, start: Date, end: Date) => date >= start && date < end

    const currentOrders = orders.filter((order) => inRange(new Date(order.created_at), currentStart, now))
    const previousOrders = orders.filter((order) => inRange(new Date(order.created_at), previousStart, currentStart))

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

    const avgOrderValue = currentOrders.length > 0 ? currentPrimary / currentOrders.length : 0
    const previousAvg =
      previousOrders.length > 0
        ? (primaryCurrency === 'AED' ? previousRevenue.aed : previousRevenue.pkr) / previousOrders.length
        : 0

    const fulfilledCount = currentOrders.filter(
      (order) => STATUS_DISPLAY[order.status] === 'Fulfilled',
    ).length
    const fulfillmentRate = currentOrders.length > 0 ? (fulfilledCount / currentOrders.length) * 100 : 0
    const previousFulfilled = previousOrders.filter(
      (order) => STATUS_DISPLAY[order.status] === 'Fulfilled',
    ).length
    const previousFulfillment =
      previousOrders.length > 0 ? (previousFulfilled / previousOrders.length) * 100 : 0

    // Monthly revenue (last 6 calendar months)
    const months: { key: string; label: string; revenue: number; orders: number }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = monthKey(date)
      months.push({ key, label: monthLabel(key), revenue: 0, orders: 0 })
    }
    const monthLookup = new Map(months.map((month) => [month.key, month]))
    for (const order of orders) {
      const created = new Date(order.created_at)
      const key = monthKey(created)
      const bucket = monthLookup.get(key)
      if (!bucket) continue
      bucket.orders += 1
      const { amount, currency } = getOrderTotal(order)
      if (currency === primaryCurrency) bucket.revenue += amount
    }

    // Daily orders last 7 days
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

    // Status breakdown for current range
    const statusCounts: Record<string, number> = {}
    for (const order of currentOrders) {
      const label = STATUS_DISPLAY[order.status] || 'Other'
      statusCounts[label] = (statusCounts[label] ?? 0) + 1
    }
    const statusBreakdown = Object.entries(statusCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: currentOrders.length > 0 ? Math.round((count / currentOrders.length) * 100) : 0,
        color: STATUS_COLORS[name] ?? STATUS_COLORS.Other,
      }))
      .sort((left, right) => right.count - left.count)

    // Top countries
    const countryCounts: Record<string, number> = {}
    for (const order of currentOrders) {
      const country = normalizeCountry(order.shipping_address?.country)
      countryCounts[country] = (countryCounts[country] ?? 0) + 1
    }
    const countries = Object.entries(countryCounts)
      .map(([name, count], index) => ({
        name,
        count,
        color: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)

    // Top products from items
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

    // Payment methods
    const paymentCounts: Record<string, number> = {}
    for (const order of currentOrders) {
      const method = (order.payment_method || 'unknown').toUpperCase()
      paymentCounts[method] = (paymentCounts[method] ?? 0) + 1
    }
    const payments = Object.entries(paymentCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: currentOrders.length > 0 ? Math.round((count / currentOrders.length) * 100) : 0,
      }))
      .sort((left, right) => right.count - left.count)

    const recentOrders = [...orders]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 8)
      .map((order) => ({ ...order, time_ago: getTimeAgo(order.created_at) }))

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newOrdersCount = orders.filter((order) => new Date(order.created_at) > last24Hours).length

    return {
      currentOrders,
      currentRevenue,
      primaryCurrency,
      currentPrimary,
      uniqueCustomers,
      avgOrderValue,
      fulfillmentRate,
      months,
      days,
      statusBreakdown,
      countries,
      topProducts,
      payments,
      recentOrders,
      newOrdersCount,
      changes: {
        revenue: formatChange(currentPrimary, previousPrimary),
        orders: formatChange(currentOrders.length, previousOrders.length),
        customers: formatChange(uniqueCustomers, previousCustomers),
        aov: formatChange(avgOrderValue, previousAvg),
        fulfillment: formatChange(fulfillmentRate, previousFulfillment),
      },
    }
  }, [orders, rangeDays])

  const maxMonthRevenue = Math.max(...analytics.months.map((month) => month.revenue), 1)
  const maxDayOrders = Math.max(...analytics.days.map((day) => day.orders), 1)
  const maxCountry = Math.max(...analytics.countries.map((country) => country.count), 1)

  const buildLinePath = (values: number[], width: number, height: number) => {
    if (values.length === 0) return ''
    const max = Math.max(...values, 1)
    return values
      .map((value, index) => {
        const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
        const y = height - (value / max) * (height - 16) - 8
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const monthPath = buildLinePath(
    analytics.months.map((month) => month.revenue),
    600,
    200,
  )

  const donutSegments = (() => {
    const circumference = 2 * Math.PI * 40
    let offset = 0
    return analytics.statusBreakdown.map((segment) => {
      const length = (segment.percentage / 100) * circumference
      const next = { ...segment, dash: length, gap: circumference - length, offset }
      offset -= length
      return next
    })
  })()

  const stats = [
    {
      label: 'Revenue',
      value: formatMoney(analytics.currentPrimary, analytics.primaryCurrency),
      change: analytics.changes.revenue,
      icon: Wallet,
      tone: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Orders',
      value: analytics.currentOrders.length.toLocaleString(),
      change: analytics.changes.orders,
      icon: ShoppingCart,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Customers',
      value: analytics.uniqueCustomers.toLocaleString(),
      change: analytics.changes.customers,
      icon: Users,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Avg. order',
      value: formatMoney(analytics.avgOrderValue, analytics.primaryCurrency),
      change: analytics.changes.aov,
      icon: Package,
      tone: 'bg-blue-50 text-blue-600',
    },
  ]

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Analytics</h1>
              <p className="text-[11px] text-gray-500">Live store performance from orders and products.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#D9D0C2] bg-white p-0.5">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRange(option.key)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      range === option.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-[#F7F2E8]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

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
                  {analytics.newOrdersCount > 0 && (
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
                      {analytics.newOrdersCount === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        analytics.recentOrders
                          .filter((order) => new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
                          .slice(0, 5)
                          .map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => {
                                setShowNotifications(false)
                                navigate('/orders')
                              }}
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
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate('/settings')
                        }}
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

        <div className="px-4 py-5 sm:px-6 space-y-4">
          <div className="sm:hidden flex flex-wrap gap-1.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border ${
                  range === option.key
                    ? 'border-indigo-300 bg-indigo-600 text-white'
                    : 'border-[#D9D0C2] bg-white text-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              Loading analytics…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="rounded-xl border border-[#D9D0C2] bg-white p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                        <div className={`rounded-lg p-2 ${stat.tone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            stat.change.trend === 'up'
                              ? 'bg-emerald-50 text-emerald-700'
                              : stat.change.trend === 'down'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-[#F0E9DC] text-gray-600'
                          }`}
                        >
                          {stat.change.trend === 'up' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : stat.change.trend === 'down' ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : null}
                          {stat.change.label} vs prior
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-[#D9D0C2] bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Fulfillment</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{analytics.fulfillmentRate.toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-500">{analytics.changes.fulfillment.label} vs prior</p>
                </div>
                <div className="rounded-xl border border-[#D9D0C2] bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Catalog</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{productCount}</p>
                  <p className="text-[10px] text-gray-500">{activeProductCount} active</p>
                </div>
                <div className="rounded-xl border border-[#D9D0C2] bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">AED revenue</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {formatMoney(analytics.currentRevenue.aed, 'AED')}
                  </p>
                </div>
                <div className="rounded-xl border border-[#D9D0C2] bg-white px-3.5 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">PKR revenue</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {formatMoney(analytics.currentRevenue.pkr, 'PKR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 rounded-xl border border-[#D9D0C2] bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Revenue trend</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Last 6 months · {analytics.primaryCurrency}</p>
                    </div>
                    <p className="text-[11px] font-medium text-gray-600">
                      {analytics.months.reduce((sum, month) => sum + month.orders, 0)} orders
                    </p>
                  </div>

                  <div className="h-52 relative">
                    {analytics.months.every((month) => month.revenue === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-[#D9D0C2] rounded-xl bg-[#F7F2E8]/40">
                        No revenue in the last 6 months
                      </div>
                    ) : (
                      <>
                        <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                          <line x1="0" y1="50" x2="600" y2="50" stroke="#E8E0D4" strokeWidth="1" />
                          <line x1="0" y1="100" x2="600" y2="100" stroke="#E8E0D4" strokeWidth="1" />
                          <line x1="0" y1="150" x2="600" y2="150" stroke="#E8E0D4" strokeWidth="1" />
                          <path d={`${monthPath} L600,200 L0,200 Z`} fill="url(#analyticsRevenueFill)" opacity="0.25" />
                          <path d={monthPath} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          <defs>
                            <linearGradient id="analyticsRevenueFill" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#4f46e5" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-400 py-1 pointer-events-none">
                          <span>{formatMoney(maxMonthRevenue, analytics.primaryCurrency)}</span>
                          <span>{formatMoney(maxMonthRevenue / 2, analytics.primaryCurrency)}</span>
                          <span>0</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] text-gray-500 px-1">
                    {analytics.months.map((month) => (
                      <span key={month.key} className="text-center">
                        {month.label}
                        <span className="block text-gray-400">{month.orders}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                  <p className="text-xs font-semibold text-gray-800">Order status</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-4">Mix for selected range</p>

                  {analytics.statusBreakdown.length === 0 ? (
                    <div className="py-10 text-center text-xs text-gray-500 border border-dashed border-[#D9D0C2] rounded-xl bg-[#F7F2E8]/40">
                      No orders in this range
                    </div>
                  ) : (
                    <>
                      <div className="relative w-36 h-36 mx-auto mb-4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#F0E9DC" strokeWidth="12" />
                          {donutSegments.map((segment) => (
                            <circle
                              key={segment.name}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={
                                segment.name === 'Pending'
                                  ? '#f59e0b'
                                  : segment.name === 'Processing'
                                    ? '#3b82f6'
                                    : segment.name === 'Fulfilled'
                                      ? '#10b981'
                                      : segment.name === 'Refunded'
                                        ? '#f43f5e'
                                        : '#9ca3af'
                              }
                              strokeWidth="12"
                              strokeDasharray={`${segment.dash} ${segment.gap}`}
                              strokeDashoffset={segment.offset}
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-lg font-bold text-gray-900">{analytics.currentOrders.length}</p>
                          <p className="text-[10px] text-gray-500">orders</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {analytics.statusBreakdown.map((segment) => (
                          <div key={segment.name} className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`h-2.5 w-2.5 rounded-full ${segment.color}`} />
                              <span className="text-gray-600 truncate">{segment.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900 shrink-0">
                              {segment.count} · {segment.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                  <p className="text-xs font-semibold text-gray-800">Orders · last 7 days</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-4">Daily order volume</p>
                  <div className="h-44 relative">
                    {analytics.days.every((day) => day.orders === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-[#D9D0C2] rounded-xl bg-[#F7F2E8]/40">
                        No orders in the last 7 days
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-end gap-2 px-1 pb-6">
                          {analytics.days.map((day) => (
                            <div key={day.label} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                              <span className="text-[10px] font-medium text-gray-700">{day.orders}</span>
                              <div
                                className="w-full rounded-t-md bg-indigo-500 transition-all"
                                style={{ height: `${Math.max((day.orders / maxDayOrders) * 7.5, day.orders > 0 ? 0.35 : 0)}rem` }}
                              />
                              <span className="text-[10px] text-gray-500">{day.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                  <p className="text-xs font-semibold text-gray-800">Top countries</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-4">From shipping addresses</p>
                  {analytics.countries.length === 0 ? (
                    <div className="py-10 text-center text-xs text-gray-500 border border-dashed border-[#D9D0C2] rounded-xl bg-[#F7F2E8]/40">
                      No country data yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.countries.map((country) => (
                        <div key={country.name}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-medium text-gray-800 truncate">{country.name}</span>
                            <span className="text-[11px] text-gray-500 shrink-0">{country.count} orders</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#F0E9DC] overflow-hidden">
                            <div
                              className={`${country.color} h-2 rounded-full`}
                              style={{ width: `${(country.count / maxCountry) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Top products</p>
                      <p className="text-[11px] text-gray-500">By units sold in range</p>
                    </div>
                  </div>
                  <div className="divide-y divide-[#F0E9DC]">
                    {analytics.topProducts.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-gray-500">No product sales in this range</p>
                    ) : (
                      analytics.topProducts.map((product, index) => (
                        <div key={`${product.name}-${index}`} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0E9DC] text-[11px] font-bold text-gray-700">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-[10px] text-gray-500">{product.sold} sold</p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 shrink-0">
                            {formatMoney(product.revenue, analytics.primaryCurrency)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Recent orders</p>
                      <p className="text-[11px] text-gray-500">Latest store activity</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/orders')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-[#F0E9DC]">
                    {analytics.recentOrders.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-gray-500">No orders yet</p>
                    ) : (
                      analytics.recentOrders.map((order) => {
                        const total = getOrderTotal(order)
                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="w-full text-left px-4 py-3 hover:bg-[#F7F2E8]/60 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-900">{order.order_code}</p>
                              <span className="text-[10px] text-gray-400">{order.time_ago}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="text-[11px] text-gray-600 truncate">
                                {order.shipping_address?.full_name || order.customer_email}
                              </p>
                              <p className="text-[11px] font-semibold text-gray-800 shrink-0">
                                {formatMoney(total.amount, total.currency)}
                              </p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {analytics.payments.length > 0 ? (
                    <div className="border-t border-[#E8E0D4] px-4 py-3 bg-[#FBF8F2]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Payment mix</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analytics.payments.map((payment) => (
                          <span
                            key={payment.name}
                            className="inline-flex items-center rounded-md border border-[#D9D0C2] bg-white px-2 py-1 text-[10px] font-medium text-gray-700"
                          >
                            {payment.name} · {payment.percentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
