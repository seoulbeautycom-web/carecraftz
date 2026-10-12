import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronDown,
  ImagePlus,
  LogOut,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { supabase } from '../../lib/supabase'

type EditorSection = 'identity' | 'access' | 'products' | 'staff' | 'overview'
type DeliveryMode = 'carecraftz' | 'own'

const EDITOR_SECTIONS: { key: EditorSection; label: string; newOnly?: boolean; existingOnly?: boolean }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'access', label: 'Access & commerce' },
  { key: 'products', label: 'Products', existingOnly: true },
  { key: 'staff', label: 'Staff', existingOnly: true },
  { key: 'overview', label: 'Overview', existingOnly: true },
]

const PARTNER_COUNTRIES = ['UAE', 'Pakistan', 'GCC', 'International'] as const

const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  carecraftz: 'CareCraftz',
  own: 'Own',
}

interface PartnerStoreRow {
  id: string
  application_id: string | null
  slug: string
  tenant_type: 'flagship' | 'partner'
  display_name: string
  legal_name: string
  primary_email: string
  phone: string | null
  country: string | null
  city: string | null
  location: string | null
  logo_url: string | null
  delivery_mode: DeliveryMode | null
  status: 'pending' | 'active' | 'suspended' | 'closed'
  approval_status: 'pending' | 'approved' | 'rejected'
  commission_rate: number
  master_admin_email: string | null
  master_admin_user_id: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

interface StoreFormState {
  slug: string
  displayName: string
  legalName: string
  primaryEmail: string
  phone: string
  country: string
  city: string
  location: string
  logoUrl: string
  deliveryMode: DeliveryMode
  masterAdminEmail: string
  masterAdminPassword: string
  status: PartnerStoreRow['status']
  approvalStatus: PartnerStoreRow['approval_status']
  commissionRate: string
}

interface LinkedProduct {
  id: string
  name: string
  sku: string | null
  price: number
  inventory: number
  is_active: boolean
  images: string[] | null
}

interface PartnerMemberRow {
  id: string
  email: string
  full_name: string
  status: 'invited' | 'active' | 'disabled'
  joined_at: string | null
  invited_at: string | null
  created_at: string
}

interface PartnerStoreAdminApiResponse {
  ok?: boolean
  storeId?: string
  master_admin_email?: string
  partner_store_slug?: string
  warning?: string
  error?: string
}

const emptyStoreForm = (): StoreFormState => ({
  slug: '',
  displayName: '',
  legalName: '',
  primaryEmail: '',
  phone: '',
  country: '',
  city: '',
  location: '',
  logoUrl: '',
  deliveryMode: 'carecraftz',
  masterAdminEmail: '',
  masterAdminPassword: '',
  status: 'active',
  approvalStatus: 'approved',
  commissionRate: '0',
})

const normalizeDeliveryMode = (value: string | null | undefined): DeliveryMode =>
  value === 'own' ? 'own' : 'carecraftz'

const storeFormFromRow = (store: PartnerStoreRow): StoreFormState => ({
  slug: store.slug,
  displayName: store.display_name,
  legalName: store.legal_name,
  primaryEmail: store.primary_email,
  phone: store.phone ?? '',
  country: store.country ?? '',
  city: store.city ?? '',
  location: store.location ?? '',
  logoUrl: store.logo_url ?? '',
  deliveryMode: normalizeDeliveryMode(store.delivery_mode),
  masterAdminEmail: store.master_admin_email ?? '',
  masterAdminPassword: '',
  status: store.status,
  approvalStatus: store.approval_status,
  commissionRate: String(store.commission_rate ?? 0),
})

interface PendingChange {
  field: string
  label: string
  from: string
  to: string
}

const formatChangeValue = (value: string) => {
  const trimmed = value.trim()
  return trimmed || '—'
}

const collectStoreChanges = (baseline: StoreFormState, current: StoreFormState): PendingChange[] => {
  const fields: { key: keyof StoreFormState; label: string; sensitive?: boolean }[] = [
    { key: 'displayName', label: 'Display name' },
    { key: 'legalName', label: 'Legal name' },
    { key: 'slug', label: 'Store slug' },
    { key: 'primaryEmail', label: 'Primary email' },
    { key: 'phone', label: 'Phone number' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'logoUrl', label: 'Logo' },
    { key: 'deliveryMode', label: 'Delivery mode' },
    { key: 'masterAdminEmail', label: 'Master admin email' },
    { key: 'masterAdminPassword', label: 'Master admin password', sensitive: true },
    { key: 'status', label: 'Status' },
    { key: 'approvalStatus', label: 'Approval' },
    { key: 'commissionRate', label: 'Commission %' },
  ]

  const changes: PendingChange[] = []

  for (const field of fields) {
    const fromRaw = String(baseline[field.key] ?? '')
    const toRaw = String(current[field.key] ?? '')

    if (field.sensitive) {
      if (!toRaw.trim()) continue
      changes.push({
        field: field.key,
        label: field.label,
        from: fromRaw.trim() ? '••••••' : '—',
        to: '••••••',
      })
      continue
    }

    const fromNorm = fromRaw.trim()
    const toNorm = toRaw.trim()

    if (field.key === 'commissionRate') {
      if (Number(fromNorm || 0) === Number(toNorm || 0)) continue
    } else if (fromNorm === toNorm) {
      continue
    }

    if (field.key === 'logoUrl') {
      changes.push({
        field: field.key,
        label: field.label,
        from: fromNorm ? 'Uploaded' : '—',
        to: toNorm ? 'Uploaded' : '—',
      })
      continue
    }

    if (field.key === 'deliveryMode') {
      changes.push({
        field: field.key,
        label: field.label,
        from: DELIVERY_MODE_LABELS[normalizeDeliveryMode(fromNorm)],
        to: DELIVERY_MODE_LABELS[normalizeDeliveryMode(toNorm)],
      })
      continue
    }

    changes.push({
      field: field.key,
      label: field.label,
      from: formatChangeValue(fromNorm),
      to: formatChangeValue(toNorm),
    })
  }

  return changes
}

const slugifyPreview = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'partner-store'
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) return message
  }
  return fallback
}

const getStoreActionErrorMessage = (error: unknown, fallback: string) => {
  const message = getErrorMessage(error, fallback)
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('provision_partner_store')
    && (normalizedMessage.includes('does not exist') || normalizedMessage.includes('could not find the function'))
  ) {
    return 'The direct store provisioning RPC is not deployed yet. Wait for migrations, then try again.'
  }

  if (normalizedMessage.includes('insufficient permissions')) {
    return 'You need partners.provision, partners.manage, or roles.manage access to create or edit partner stores.'
  }

  if (
    normalizedMessage.includes('/api/partner-store-admin')
    && (normalizedMessage.includes('not found') || normalizedMessage.includes('404'))
  ) {
    return 'The partner store admin API route is not deployed yet. Wait for deployment, then try again.'
  }

  return message
}

const callPartnerStoreAdminApi = async (method: 'POST' | 'DELETE', body: Record<string, unknown>) => {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('You must be signed in to manage partner store credentials.')
  }

  const response = await fetch('/api/partner-store-admin', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as PartnerStoreAdminApiResponse

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || 'Failed to manage the partner store.')
  }

  return payload
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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

interface HeaderOrder {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

const fieldClass =
  'mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none'

export default function PartnerStoreEditor() {
  const { storeId = 'new' } = useParams<{ storeId: string }>()
  const isNew = storeId === 'new'
  const navigate = useNavigate()
  const { hasAnyPermission } = useAdminAccess()
  const canManage = hasAnyPermission(['partners.provision', 'partners.manage', 'roles.manage'])

  const [store, setStore] = useState<PartnerStoreRow | null>(null)
  const [form, setForm] = useState<StoreFormState>(emptyStoreForm)
  const [baselineForm, setBaselineForm] = useState<StoreFormState>(emptyStoreForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shippingLocations, setShippingLocations] = useState<string[]>([])
  const [productCount, setProductCount] = useState(0)
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([])
  const [staffMembers, setStaffMembers] = useState<PartnerMemberRow[]>([])
  const [logoUploading, setLogoUploading] = useState(false)
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showChanges, setShowChanges] = useState(false)
  const [activeSection, setActiveSection] = useState<EditorSection>('identity')
  const [recentOrders, setRecentOrders] = useState<HeaderOrder[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  const previewSlug = useMemo(
    () => slugifyPreview(form.slug || form.displayName || 'partner-store'),
    [form.slug, form.displayName],
  )

  const pendingChanges = useMemo(
    () => collectStoreChanges(baselineForm, form),
    [baselineForm, form],
  )
  const hasChanges = pendingChanges.length > 0

  const visibleSections = useMemo(
    () =>
      EDITOR_SECTIONS.filter((section) => {
        if (section.existingOnly && isNew) return false
        if (section.newOnly && !isNew) return false
        return true
      }),
    [isNew],
  )

  const health = useMemo(() => {
    const hasPasswordCredential = isNew
      ? Boolean(form.masterAdminPassword.trim())
      : Boolean(store?.master_admin_email || form.masterAdminPassword.trim() || form.masterAdminEmail.trim())

    const checks = [
      { key: 'displayName', filled: Boolean(form.displayName.trim()) },
      { key: 'legalName', filled: Boolean(form.legalName.trim()) },
      { key: 'slug', filled: Boolean(form.slug.trim() || form.displayName.trim()) },
      { key: 'primaryEmail', filled: Boolean(form.primaryEmail.trim()) },
      { key: 'phone', filled: Boolean(form.phone.trim()) },
      { key: 'country', filled: Boolean(form.country.trim()) },
      { key: 'city', filled: Boolean(form.city.trim()) },
      { key: 'location', filled: Boolean(form.location.trim()) },
      { key: 'logoUrl', filled: Boolean(form.logoUrl.trim()) },
      { key: 'deliveryMode', filled: Boolean(form.deliveryMode) },
      { key: 'masterAdminEmail', filled: Boolean(form.masterAdminEmail.trim() || store?.master_admin_email) },
      { key: 'masterAdminPassword', filled: hasPasswordCredential },
      { key: 'status', filled: Boolean(form.status) },
      { key: 'approvalStatus', filled: Boolean(form.approvalStatus) },
      { key: 'commissionRate', filled: form.commissionRate.trim() !== '' && Number.isFinite(Number(form.commissionRate)) },
    ]

    const filled = checks.filter((check) => check.filled).length
    const total = checks.length
    const percent = total === 0 ? 0 : Math.round((filled / total) * 100)

    return { filled, total, percent, checks }
  }, [form, isNew, store?.master_admin_email])

  useEffect(() => {
    if (!hasChanges) setShowChanges(false)
  }, [hasChanges])

  useEffect(() => {
    if (!visibleSections.some((section) => section.key === activeSection)) {
      setActiveSection(visibleSections[0]?.key ?? 'identity')
    }
  }, [activeSection, visibleSections])

  const partnersListPath = '/partners'

  const loadStore = useCallback(async () => {
    if (isNew) {
      const blank = emptyStoreForm()
      setStore(null)
      setForm(blank)
      setBaselineForm(blank)
      setShippingLocations([])
      setProductCount(0)
      setLinkedProducts([])
      setStaffMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } = await supabase
        .from('partner_stores')
        .select('*')
        .eq('id', storeId)
        .maybeSingle()

      if (loadError) throw loadError
      if (!data) {
        setError('Partner store not found.')
        setStore(null)
        return
      }

      const row = data as PartnerStoreRow
      const nextForm = storeFormFromRow(row)
      setStore(row)
      setForm(nextForm)
      setBaselineForm(nextForm)

      const [{ count }, applicationResult, productsResult, staffResult] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('partner_store_id', row.id),
        row.application_id
          ? supabase
              .from('partner_applications')
              .select('shipping_locations')
              .eq('id', row.application_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('products')
          .select('id, name, sku, price, inventory, is_active, images')
          .eq('partner_store_id', row.id)
          .order('name', { ascending: true }),
        supabase
          .from('partner_members')
          .select('id, email, full_name, status, joined_at, invited_at, created_at')
          .eq('partner_store_id', row.id)
          .order('created_at', { ascending: true }),
      ])

      setProductCount(count ?? 0)
      setLinkedProducts((productsResult.data ?? []) as LinkedProduct[])
      setStaffMembers((staffResult.data ?? []) as PartnerMemberRow[])
      const locations = (applicationResult.data as { shipping_locations?: string[] } | null)?.shipping_locations
      setShippingLocations(Array.isArray(locations) ? locations : [])
    } catch (loadError) {
      console.error('Failed to load partner store:', loadError)
      setError(getErrorMessage(loadError, 'Failed to load partner store'))
    } finally {
      setLoading(false)
    }
  }, [isNew, storeId])

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
      const ordersWithTime = data.map((order: HeaderOrder) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at),
      }))
      setRecentOrders(ordersWithTime)

      const last24Hours = new Date()
      last24Hours.setHours(last24Hours.getHours() - 24)
      setNewOrdersCount(data.filter((order: HeaderOrder) => new Date(order.created_at) > last24Hours).length)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !canManage) return

    setLogoUploading(true)
    setError('')

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `partner-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm((current) => ({ ...current, logoUrl: data.publicUrl }))
    } catch (uploadError) {
      console.error('Failed to upload partner logo:', uploadError)
      setError(getErrorMessage(uploadError, 'Failed to upload partner logo'))
    } finally {
      setLogoUploading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStore()
      void fetchUserName()
      void fetchOrdersForNotifications()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadStore, fetchUserName, fetchOrdersForNotifications])

  const handleSave = async () => {
    if (!canManage) {
      setError('You need partners.provision, partners.manage, or roles.manage access to edit partner stores.')
      return
    }

    const normalizedSlug = slugifyPreview(form.slug || form.displayName || 'partner-store')
    const displayName = form.displayName.trim()
    const legalName = form.legalName.trim()
    const primaryEmail = form.primaryEmail.trim().toLowerCase()
    const masterAdminEmail = form.masterAdminEmail.trim().toLowerCase()
    const masterAdminPassword = form.masterAdminPassword.trim()
    const commissionRate = Number.parseFloat(form.commissionRate)
    const resolvedMasterAdminEmail = masterAdminEmail || store?.master_admin_email?.trim().toLowerCase() || ''

    if (!displayName || !legalName || !primaryEmail || !resolvedMasterAdminEmail) {
      setError('Display name, legal name, primary email, and master admin email are required.')
      return
    }

    if (isNew && !masterAdminPassword) {
      setError('Master admin password is required when creating a new store.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = (await callPartnerStoreAdminApi('POST', {
        action: 'save-store',
        storeId: isNew ? undefined : storeId,
        slug: normalizedSlug,
        displayName,
        legalName,
        primaryEmail,
        phone: form.phone.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        location: form.location.trim(),
        logoUrl: form.logoUrl.trim() || null,
        deliveryMode: form.deliveryMode,
        masterAdminEmail: resolvedMasterAdminEmail,
        masterAdminPassword: masterAdminPassword || undefined,
        status: form.status,
        approvalStatus: form.approvalStatus,
        commissionRate: Number.isFinite(commissionRate) ? commissionRate : 0,
      })) as PartnerStoreAdminApiResponse

      const savedStoreId = payload.storeId ?? storeId
      const savedSlug = payload.partner_store_slug ?? normalizedSlug
      const warningSuffix = payload.warning ? ` ${payload.warning}` : ''
      setSuccess(`${isNew ? 'Created' : 'Updated'} store "${savedSlug}".${warningSuffix}`)

      if (isNew && savedStoreId) {
        navigate(`/partners/${savedStoreId}`, { replace: true })
      } else {
        await loadStore()
      }
    } catch (saveError) {
      console.error('Failed to save partner store:', saveError)
      setError(getStoreActionErrorMessage(saveError, 'Failed to save partner store'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!store || isNew) return
    if (!window.confirm(`Delete ${store.display_name}? This removes the partner store and its master admin account.`)) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await callPartnerStoreAdminApi('DELETE', { storeId: store.id })
      navigate(partnersListPath, { replace: true })
    } catch (deleteError) {
      console.error('Failed to delete partner store:', deleteError)
      setError(getStoreActionErrorMessage(deleteError, 'Failed to delete partner store'))
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="h-[100dvh] overflow-hidden bg-[#F7F2E8]">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
            <div className="min-w-0 flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => navigate(partnersListPath)}
                className="mt-0.5 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                aria-label="Back to partners"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  {isNew ? 'New partner' : store?.display_name || 'Partner store'}
                </h1>
                <p className="text-[11px] text-gray-500 truncate">
                  {isNew ? 'Create store slug and master admin' : `/${store?.slug || previewSlug}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isNew ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting || !canManage}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(partnersListPath)}
                className="px-3 py-1.5 rounded-lg border border-[#D9D0C2] bg-white text-gray-600 text-xs font-semibold hover:bg-[#F0E9DC]"
              >
                Cancel
              </button>

              <div className="relative flex items-center gap-2">
                {hasChanges ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowChanges((open) => !open)
                      setShowNotifications(false)
                      setShowProfileMenu(false)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                      {pendingChanges.length}
                    </span>
                    edit{pendingChanges.length === 1 ? '' : 's'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChanges ? 'rotate-180' : ''}`} />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !canManage || !hasChanges}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : isNew ? 'Create partner' : 'Save changes'}
                </button>

                {showChanges && hasChanges ? (
                  <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#D9D0C2] bg-white shadow-lg z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E8E0D4] bg-[#F7F2E8]">
                      <p className="text-xs font-semibold text-gray-700">
                        {pendingChanges.length} pending change{pendingChanges.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ul className="max-h-64 overflow-y-auto divide-y divide-[#F0E9DC]">
                      {pendingChanges.map((change) => (
                        <li key={change.field} className="px-3 py-2.5">
                          <p className="text-xs font-semibold text-gray-900">{change.label}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            <span className="line-through decoration-gray-400">{change.from}</span>
                            <span className="mx-1.5 text-gray-300">→</span>
                            <span className="text-gray-800 font-medium">{change.to}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    setShowProfileMenu(false)
                    setShowChanges(false)
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
                        recentOrders.slice(0, 5).map((order) => (
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
                    setShowChanges(false)
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

          <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
            <aside className="md:w-52 lg:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[#E8E0D4] bg-[#F0E9DC] p-2.5 md:overflow-y-auto">
              <div className="rounded-xl border border-[#D9D0C2] bg-white px-3 py-3 mb-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2 text-center">Info filled</p>
                <HealthCircle filled={health.filled} total={health.total} percent={health.percent} />
                <p className="mt-2 text-center text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-900">{health.filled}</span>
                  <span className="text-gray-400"> / {health.total} fields</span>
                </p>
              </div>

              <p className="px-2 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">Sections</p>
              <nav className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                {visibleSections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`whitespace-nowrap text-left px-2.5 py-1.5 rounded-md text-[12px] font-medium leading-snug transition-colors ${
                      activeSection === section.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-[#F7F2E8] hover:text-gray-900'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 min-h-0 overflow-y-auto px-3 py-3 sm:px-5 lg:px-6 pb-8 space-y-3">
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">{success}</div>
              ) : null}
              {!canManage ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  You can view this partner, but need partners.provision, partners.manage, or roles.manage to edit.
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-white px-4 py-10 text-center text-xs text-gray-500">
                  Loading partner…
                </div>
              ) : (
                <div className="max-w-3xl space-y-3">
                  {activeSection === 'identity' ? (
                    <section className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Identity</h2>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Display name</label>
                            <input
                              value={form.displayName}
                              onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))}
                              className={fieldClass}
                              placeholder="Partner store name"
                              disabled={!canManage}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Legal name</label>
                            <input
                              value={form.legalName}
                              onChange={(e) => setForm((current) => ({ ...current, legalName: e.target.value }))}
                              className={fieldClass}
                              placeholder="Registered legal entity"
                              disabled={!canManage}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Store slug</label>
                            <input
                              value={form.slug}
                              onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
                              className={fieldClass}
                              placeholder="my-partner-store"
                              disabled={!canManage}
                            />
                            <p className="mt-1 text-[10px] text-gray-400 font-mono">/{previewSlug}</p>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Primary email</label>
                            <input
                              value={form.primaryEmail}
                              onChange={(e) => setForm((current) => ({ ...current, primaryEmail: e.target.value }))}
                              className={fieldClass}
                              placeholder="store@example.com"
                              disabled={!canManage}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Phone number</label>
                            <input
                              type="tel"
                              value={form.phone}
                              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                              className={fieldClass}
                              placeholder="+971 50 123 4567"
                              disabled={!canManage}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Country</label>
                            <select
                              value={form.country}
                              onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
                              className={fieldClass}
                              disabled={!canManage}
                            >
                              <option value="">Select country</option>
                              {PARTNER_COUNTRIES.map((country) => (
                                <option key={country} value={country}>{country}</option>
                              ))}
                              {form.country && !(PARTNER_COUNTRIES as readonly string[]).includes(form.country) ? (
                                <option value={form.country}>{form.country}</option>
                              ) : null}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">City</label>
                            <input
                              value={form.city}
                              onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
                              className={fieldClass}
                              placeholder="Dubai"
                              disabled={!canManage}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Location</label>
                            <input
                              value={form.location}
                              onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                              className={fieldClass}
                              placeholder="Street, area, or landmark"
                              disabled={!canManage}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/50 p-3 flex flex-col">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Partner logo</p>
                          <div className="relative flex-1 min-h-[180px] rounded-lg border border-dashed border-[#D9D0C2] bg-white overflow-hidden flex items-center justify-center">
                            {form.logoUrl ? (
                              <>
                                <img src={form.logoUrl} alt="Partner logo" className="absolute inset-0 h-full w-full object-contain p-3" />
                                {canManage ? (
                                  <button
                                    type="button"
                                    onClick={() => setForm((current) => ({ ...current, logoUrl: '' }))}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-[#D9D0C2] text-rose-600 hover:bg-rose-50"
                                    aria-label="Remove logo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <div className="text-center px-3">
                                <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-[11px] text-gray-400">No logo yet</p>
                              </div>
                            )}
                          </div>
                          {canManage ? (
                            <label className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D9D0C2] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-[#F0E9DC] cursor-pointer">
                              {logoUploading ? (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              {logoUploading ? 'Uploading…' : form.logoUrl ? 'Replace logo' : 'Upload logo'}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleLogoUpload(e)} disabled={logoUploading} />
                            </label>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {activeSection === 'access' ? (
                    <section className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Access & commerce</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Master admin email</label>
                          <input
                            value={form.masterAdminEmail}
                            onChange={(e) => setForm((current) => ({ ...current, masterAdminEmail: e.target.value }))}
                            className={fieldClass}
                            placeholder="admin@example.com"
                            disabled={!canManage}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            Master admin password {isNew ? '' : '(optional)'}
                          </label>
                          <input
                            type="password"
                            value={form.masterAdminPassword}
                            onChange={(e) => setForm((current) => ({ ...current, masterAdminPassword: e.target.value }))}
                            className={fieldClass}
                            placeholder={isNew ? 'Set initial password' : 'Leave blank to keep'}
                            disabled={!canManage}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
                          <select
                            value={form.status}
                            onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as StoreFormState['status'] }))}
                            className={fieldClass}
                            disabled={!canManage}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Approval</label>
                          <select
                            value={form.approvalStatus}
                            onChange={(e) => setForm((current) => ({ ...current, approvalStatus: e.target.value as StoreFormState['approvalStatus'] }))}
                            className={fieldClass}
                            disabled={!canManage}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Commission %</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.commissionRate}
                            onChange={(e) => setForm((current) => ({ ...current, commissionRate: e.target.value }))}
                            className={fieldClass}
                            disabled={!canManage}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Delivery mode</label>
                          <select
                            value={form.deliveryMode}
                            onChange={(e) => setForm((current) => ({ ...current, deliveryMode: normalizeDeliveryMode(e.target.value) }))}
                            className={fieldClass}
                            disabled={!canManage}
                          >
                            <option value="carecraftz">CareCraftz</option>
                            <option value="own">Own</option>
                          </select>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {form.deliveryMode === 'own'
                              ? 'Partner handles fulfilment with their own logistics.'
                              : 'CareCraftz network handles delivery.'}
                          </p>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {activeSection === 'products' && !isNew ? (
                    <section className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-indigo-600" />
                          <h2 className="text-sm font-semibold text-gray-900">Linked products</h2>
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">{linkedProducts.length} product{linkedProducts.length === 1 ? '' : 's'}</span>
                      </div>

                      {linkedProducts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#D9D0C2] px-4 py-8 text-center text-xs text-gray-500">
                          No products linked to this partner store yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-[#E8E0D4]">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[#E8E0D4] bg-[#F7F2E8]/50">
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Product</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Price</th>
                                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {linkedProducts.map((product) => (
                                <tr
                                  key={product.id}
                                  className="border-b border-[#F0E9DC] last:border-0 hover:bg-[#F7F2E8]/50 cursor-pointer"
                                  onClick={() => navigate(`/products/${product.id}`)}
                                >
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-9 h-9 rounded-lg bg-[#F7F2E8] border border-[#E8E0D4] overflow-hidden shrink-0">
                                        {product.images?.[0] ? (
                                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                          <div className="h-full w-full flex items-center justify-center">
                                            <Package className="w-3.5 h-3.5 text-gray-300" />
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{product.sku || '—'}</td>
                                  <td className="px-3 py-2.5 text-xs font-semibold text-gray-900 text-right">{Number(product.price || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2.5 text-xs text-gray-700 text-right">{product.inventory}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                      product.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                      {product.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {activeSection === 'staff' && !isNew ? (
                    <section className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <h2 className="text-sm font-semibold text-gray-900">Partner staff</h2>
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">{staffMembers.length} member{staffMembers.length === 1 ? '' : 's'}</span>
                      </div>

                      {staffMembers.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#D9D0C2] px-4 py-8 text-center text-xs text-gray-500">
                          No staff members linked to this partner store yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-[#E8E0D4]">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[#E8E0D4] bg-[#F7F2E8]/50">
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Email</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Joined</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staffMembers.map((member) => (
                                <tr key={member.id} className="border-b border-[#F0E9DC] last:border-0">
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                        {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <p className="text-sm font-medium text-gray-900">{member.full_name || '—'}</p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-gray-700">{member.email}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${
                                      member.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : member.status === 'invited'
                                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                                          : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                      {member.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-gray-600">
                                    {formatDateTime(member.joined_at || member.invited_at || member.created_at)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {activeSection === 'overview' && !isNew && store ? (
                    <section className="rounded-xl border border-[#D9D0C2] bg-white p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Overview</h2>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <InfoCard label="Status" value={store.status} />
                        <InfoCard label="Approval" value={store.approval_status} />
                        <InfoCard label="Products" value={String(productCount)} />
                        <InfoCard label="Delivery" value={DELIVERY_MODE_LABELS[normalizeDeliveryMode(store.delivery_mode)]} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        <DetailRow icon={Mail} label="Primary email" value={store.primary_email} />
                        <DetailRow label="Phone" value={store.phone || '—'} />
                        <DetailRow label="Country" value={store.country || '—'} />
                        <DetailRow label="City" value={store.city || '—'} />
                        <DetailRow label="Location" value={store.location || '—'} />
                        <DetailRow label="Master admin" value={store.master_admin_email || '—'} />
                        <DetailRow label="Slug" value={`/${store.slug}`} mono />
                        <DetailRow label="Created" value={formatDateTime(store.created_at)} />
                        <DetailRow label="Updated" value={formatDateTime(store.updated_at)} />
                        <DetailRow label="Approved at" value={formatDateTime(store.approved_at)} />
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Shipping locations</p>
                        {shippingLocations.length === 0 ? (
                          <p className="text-xs text-gray-500">No shipping locations on linked application.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {shippingLocations.map((location) => (
                              <span
                                key={location}
                                className="inline-flex rounded-md border border-[#D9D0C2] bg-[#F7F2E8] px-2 py-1 text-[11px] font-medium text-gray-700"
                              >
                                {location}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function HealthCircle({ filled, total, percent }: { filled: number; total: number; percent: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const stroke =
    percent >= 80 ? '#059669' : percent >= 50 ? '#d97706' : '#e11d48'
  const labelTone =
    percent >= 80 ? 'text-emerald-700' : percent >= 50 ? 'text-amber-700' : 'text-rose-700'

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#E8E0D4" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold leading-none ${labelTone}`}>{percent}%</span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-gray-400">
          {filled}/{total}
        </span>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#D9D0C2] bg-[#F7F2E8]/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: typeof Mail
}) {
  return (
    <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]/50 px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
        {Icon ? <Icon className="w-3 h-3" /> : null}
        {label}
      </p>
      <p className={`mt-0.5 text-xs font-medium text-gray-900 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
