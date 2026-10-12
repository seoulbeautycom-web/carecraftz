import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  ChevronDown,
  CreditCard,
  Globe,
  LogOut,
  Palette,
  Shield,
  Truck,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import {
  DEFAULT_OPS_SETTINGS,
  type PlatformOpsSettings,
  fetchPlatformOpsSettings,
  savePlatformOpsSettings,
} from '../../lib/opsSettings'

interface Order {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name?: string }
}

type SettingsTabId = 'payments' | 'shipping' | 'notifications' | 'security' | 'themes' | 'domain'

const TABS: { id: SettingsTabId; label: string; description: string; icon: typeof CreditCard }[] = [
  { id: 'payments', label: 'Payments', description: 'COD, card, currencies', icon: CreditCard },
  { id: 'shipping', label: 'Shipping & Delivery', description: 'Flat rates and ETAs', icon: Truck },
  { id: 'notifications', label: 'Notifications', description: 'Email alert preferences', icon: BellRing },
  { id: 'security', label: 'Security', description: 'Staff session defaults', icon: Shield },
  { id: 'themes', label: 'Themes & Branding', description: 'Colors and announcement bar', icon: Palette },
  { id: 'domain', label: 'Domain', description: 'Primary domain preferences', icon: Globe },
]

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

export default function Settings() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Admin')
  const [activeTab, setActiveTab] = useState<SettingsTabId>('payments')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [settings, setSettings] = useState<PlatformOpsSettings>(DEFAULT_OPS_SETTINGS)
  const [baseline, setBaseline] = useState<PlatformOpsSettings>(DEFAULT_OPS_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    void bootstrap()
  }, [])

  const bootstrap = async () => {
    setLoading(true)
    try {
      const [{ data: sessionData }, ordersResult, ops] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('orders').select('id,order_code,customer_email,created_at,shipping_address').order('created_at', { ascending: false }).limit(20),
        fetchPlatformOpsSettings(),
      ])
      const email = sessionData.session?.user?.email
      if (email) {
        const name = email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }
      const orders = (ordersResult.data || []) as Order[]
      const withTime = orders.map((order) => ({ ...order, time_ago: getTimeAgo(order.created_at) }))
      setAllOrders(withTime)
      const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNewOrdersCount(orders.filter((o) => new Date(o.created_at) > last24).length)
      const normalized = { ...ops, payments: { ...ops.payments, card_enabled: false } }
      setSettings(normalized)
      setBaseline(normalized)
    } finally {
      setLoading(false)
    }
  }

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(baseline), [settings, baseline])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleSave = async () => {
    if (!dirty || saving) return
    setSaving(true)
    setError('')
    const payload = {
      ...settings,
      payments: { ...settings.payments, card_enabled: false },
    }
    const { settings: saved, error: saveError } = await savePlatformOpsSettings(payload)
    if (saveError) {
      setError(saveError)
      setSaving(false)
      return
    }
    setSettings(saved)
    setBaseline(saved)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
    setSaving(false)
  }

  const fieldClass =
    'w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'
  const labelClass = 'block text-[11px] font-medium text-gray-600 mb-1.5'

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Settings</h1>
              <p className="text-[11px] text-gray-500">Payments, shipping, alerts, and storefront chrome.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savedFlash ? (
                <span className="text-[11px] font-semibold text-emerald-700">Saved</span>
              ) : null}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!dirty || saving || loading}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                  }}
                  className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg"
                >
                  <Bell className="w-4 h-4" />
                  {newOrdersCount > 0 ? <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" /> : null}
                </button>
                {showNotifications ? (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E8E0D4] flex items-center justify-between bg-[#F7F2E8]">
                      <h3 className="text-xs font-semibold text-gray-900">New orders</h3>
                      <button type="button" onClick={() => setShowNotifications(false)} className="p-1 text-gray-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <p className="p-6 text-center text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                      ) : (
                        allOrders.slice(0, 5).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => {
                              setShowNotifications(false)
                              navigate('/orders')
                            }}
                            className="w-full text-left px-3 py-2.5 border-b border-[#F0E9DC] hover:bg-[#F7F2E8]"
                          >
                            <div className="flex justify-between gap-2">
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
                ) : null}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu)
                    setShowNotifications(false)
                  }}
                  className="flex items-center gap-1.5 p-1 pr-2 hover:bg-white rounded-lg"
                >
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                {showProfileMenu ? (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#D9D0C2] z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]">
                      <p className="text-xs font-semibold text-gray-900">{userName}</p>
                      <p className="text-[10px] text-gray-500">Staff access</p>
                    </div>
                    <div className="p-1.5">
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
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          {error ? (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-3">
            <aside className="rounded-xl border border-[#D9D0C2] bg-white p-2 space-y-1 h-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      active
                        ? 'bg-[#F7F2E8] border border-[#D9D0C2] text-indigo-700'
                        : 'border border-transparent text-gray-600 hover:bg-[#FBF8F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{tab.label}</p>
                        <p className="text-[10px] text-gray-500 truncate">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
              <p className="px-2 pt-2 text-[10px] text-gray-400">
                Store identity / social / contact: Partner Stores → My Store setup.
              </p>
            </aside>

            <section className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2]">
                <h2 className="text-xs font-semibold text-gray-800">
                  {TABS.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="text-[10px] text-gray-500">
                  {TABS.find((tab) => tab.id === activeTab)?.description}
                </p>
              </div>
              <div className="p-4 space-y-4 max-w-2xl">
                {loading ? (
                  <p className="text-xs text-gray-500 py-8 text-center">Loading settings…</p>
                ) : null}

                {!loading && activeTab === 'payments' ? (
                  <>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      Card checkout is hard-blocked until a payment gateway is connected. Enabling the toggle
                      below will not accept card orders.
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={settings.payments.cod_enabled}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            payments: { ...s.payments, cod_enabled: e.target.checked },
                          }))
                        }
                      />
                      Cash on delivery enabled
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-not-allowed">
                      <input type="checkbox" checked={false} disabled />
                      Card payments (requires payment provider)
                    </label>
                    <div>
                      <label className={labelClass}>Default currency</label>
                      <select
                        value={settings.payments.default_currency}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            payments: {
                              ...s.payments,
                              default_currency: e.target.value as 'AED' | 'PKR',
                            },
                          }))
                        }
                        className={fieldClass}
                      >
                        <option value="AED">AED</option>
                        <option value="PKR">PKR</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <textarea
                        rows={3}
                        value={settings.payments.notes}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            payments: { ...s.payments, notes: e.target.value },
                          }))
                        }
                        className={fieldClass}
                        placeholder="Internal notes for payment ops"
                      />
                    </div>
                  </>
                ) : null}

                {!loading && activeTab === 'shipping' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p className="sm:col-span-2 text-[11px] text-gray-500">
                      Flat rates apply when product delivery charges are 0. Free-shipping thresholds zero
                      delivery once the cart subtotal for that currency is met. Used on cart and checkout.
                    </p>
                    <div>
                      <label className={labelClass}>UAE flat rate (AED)</label>
                      <input
                        type="number"
                        min={0}
                        value={settings.shipping.uae_flat_rate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: { ...s.shipping, uae_flat_rate: Number(e.target.value) || 0 },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pakistan flat rate (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        value={settings.shipping.pakistan_flat_rate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: {
                              ...s.shipping,
                              pakistan_flat_rate: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Free shipping from (AED)</label>
                      <input
                        type="number"
                        min={0}
                        value={settings.shipping.free_shipping_threshold_aed}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: {
                              ...s.shipping,
                              free_shipping_threshold_aed: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Free shipping from (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        value={settings.shipping.free_shipping_threshold_pkr}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: {
                              ...s.shipping,
                              free_shipping_threshold_pkr: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>ETA UAE</label>
                      <input
                        value={settings.shipping.estimated_days_uae}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: { ...s.shipping, estimated_days_uae: e.target.value },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>ETA Pakistan</label>
                      <input
                        value={settings.shipping.estimated_days_pakistan}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            shipping: { ...s.shipping, estimated_days_pakistan: e.target.value },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>
                ) : null}

                {!loading && activeTab === 'notifications' ? (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-3 py-2 text-[11px] text-gray-600">
                      Preferences are saved for when transactional email is connected. No mailer is active yet —
                      toggling these does not send mail today.
                    </div>
                    {(
                      [
                        ['email_new_order', 'Email on new order'],
                        ['email_low_stock', 'Email on low stock'],
                        ['email_partner_application', 'Email on partner application'],
                        ['email_review_submitted', 'Email on new review'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={settings.notifications[key]}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              notifications: { ...s.notifications, [key]: e.target.checked },
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                ) : null}

                {!loading && activeTab === 'security' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-3 py-2 text-[11px] text-gray-600">
                      Session timeout is enforced in the admin app. Staff 2FA is a saved policy flag only until
                      MFA is connected. Password min length applies to customer sign-up.
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={settings.security.require_staff_2fa}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            security: { ...s.security, require_staff_2fa: e.target.checked },
                          }))
                        }
                      />
                      Require staff 2FA (saved policy — not enforced yet)
                    </label>
                    <div>
                      <label className={labelClass}>Session timeout (hours)</label>
                      <input
                        type="number"
                        min={1}
                        value={settings.security.session_timeout_hours}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            security: {
                              ...s.security,
                              session_timeout_hours: Number(e.target.value) || 1,
                            },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Password min length</label>
                      <input
                        type="number"
                        min={6}
                        value={settings.security.password_min_length}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            security: {
                              ...s.security,
                              password_min_length: Number(e.target.value) || 6,
                            },
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>
                ) : null}

                {!loading && activeTab === 'themes' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(
                        [
                          ['primary_color', 'Primary'],
                          ['accent_color', 'Accent'],
                          ['announcement_bg', 'Announcement bar'],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key}>
                          <label className={labelClass}>{label}</label>
                          <input
                            type="color"
                            value={settings.themes[key]}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                themes: { ...s.themes, [key]: e.target.value },
                              }))
                            }
                            className="h-10 w-full rounded-lg border border-[#D9D0C2] bg-white"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={labelClass}>Announcement messages (one per line)</label>
                      <textarea
                        rows={5}
                        value={settings.announcements.join('\n')}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            announcements: e.target.value.split('\n'),
                          }))
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>
                ) : null}

                {!loading && activeTab === 'domain' ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-3 py-2 text-[11px] text-gray-600">
                      Force HTTPS redirects the storefront off HTTP (not localhost). Primary domain / www
                      preference is stored for DNS/hosting setup — www redirect is not applied in-app.
                    </div>
                    <div>
                      <label className={labelClass}>Primary domain</label>
                      <input
                        value={settings.domain.primary_domain}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            domain: { ...s.domain, primary_domain: e.target.value },
                          }))
                        }
                        className={fieldClass}
                        placeholder="carecraftz.com"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={settings.domain.www_redirect}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            domain: { ...s.domain, www_redirect: e.target.checked },
                          }))
                        }
                      />
                      Prefer www redirect
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={settings.domain.force_https}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            domain: { ...s.domain, force_https: e.target.checked },
                          }))
                        }
                      />
                      Force HTTPS
                    </label>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
