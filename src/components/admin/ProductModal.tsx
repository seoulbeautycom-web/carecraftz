import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  BarChart3,
  Package2,
  ShoppingBag,
  Star,
  MessageSquareText,
  Bell,
  LogOut,
  Settings,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface ProductPerformanceStats {
  unitsSold: number
  orderCount: number
  approvedReviews: number
  averageRating: number
  lastSoldAt: string | null
  latestReviewAt: string | null
}

type DeliveryType = 'carecraftz' | 'partner'

interface PartnerStoreOption {
  id: string
  display_name: string
  status: string
  approval_status: string
  tenant_type?: string | null
  shipping_locations: string[]
}

interface BrandOption {
  id: string
  name: string
  logo_url: string
}

interface LocationFulfilmentData {
  price: number
  compare_at_price: number | null
  inventory: number
  low_stock_threshold: number
  weight: number | null
  discount_percent: number
  delivery_type: DeliveryType
  delivery_charge: number
}

type FulfilmentByLocation = Record<string, LocationFulfilmentData>

interface Product {
  id?: string
  name: string
  subtitle: string
  description: string
  how_to_use: string
  ingredients: string
  brand_id: string | null
  brand_name: string
  brand_logo: string
  seller_name: string
  partner_store_id: string | null
  price: number
  price_pkr: number | null
  price_aed: number | null
  compare_at_price: number | null
  inventory: number
  low_stock_threshold: number
  category: string
  location: string
  delivery_charge: number
  delivery_type: DeliveryType
  fulfilment_by_location: FulfilmentByLocation
  images: string[]
  is_active: boolean
  is_featured: boolean
  sku: string
  weight: number | null
  discount_percent: number
  tag1: string
  tag2: string
  skin_type: string
}

interface ProductSection {
  id?: string
  section_type: 'manifesto' | 'breakdown'
  sort_order: number
  manifesto_title: string
  manifesto_body: string
  breakdown_title: string
  breakdown_body: string
  breakdown_image: string
  breakdown_left_image: string
  _uploading?: boolean
}

interface Props {
  product?: Product & { id: string }
  onClose: () => void
  onSaved: (productId?: string) => void
  layout?: 'modal' | 'page'
  closeOnSave?: boolean
  stats?: ProductPerformanceStats | null
  statsError?: string
}

type ModalTab = 'basics' | 'brand' | 'partner' | 'fulfilment' | 'details' | 'sections' | 'stats'

const TABS: { key: ModalTab; label: string; pageOnly?: boolean }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'brand', label: 'Brand' },
  { key: 'partner', label: 'Partner' },
  { key: 'fulfilment', label: 'Fulfilment' },
  { key: 'details', label: 'How To Use & Ingredients' },
  { key: 'sections', label: 'Page Sections' },
  { key: 'stats', label: 'Stats', pageOnly: true },
]

const FIELD_LABELS: Partial<Record<keyof Product, string>> = {
  name: 'Product name',
  subtitle: 'Subtitle',
  description: 'Description',
  how_to_use: 'How to use',
  ingredients: 'Ingredients',
  brand_id: 'Brand',
  brand_name: 'Brand name',
  brand_logo: 'Brand logo',
  seller_name: 'Seller name',
  partner_store_id: 'Partner store',
  price: 'Price (base)',
  price_pkr: 'Price PKR',
  price_aed: 'Price AED',
  compare_at_price: 'Compare-at price',
  inventory: 'Inventory',
  low_stock_threshold: 'Low stock alert',
  category: 'Category',
  location: 'Fulfilment location',
  delivery_charge: 'Delivery charge',
  delivery_type: 'Delivery type',
  fulfilment_by_location: 'Location fulfilment',
  images: 'Product images',
  is_active: 'Active',
  is_featured: 'Featured',
  sku: 'SKU',
  weight: 'Weight',
  discount_percent: 'Discount %',
  tag1: 'Tag 1',
  tag2: 'Tag 2',
  skin_type: 'Skin type',
}

const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  carecraftz: 'CareCraftz delivery',
  partner: 'Partner own delivery',
}

type LocationCurrency = 'AED' | 'PKR'

interface FulfilmentLocation {
  name: string
  currency: LocationCurrency
}

const PRESET_LOCATIONS: FulfilmentLocation[] = [
  { name: 'UAE', currency: 'AED' },
  { name: 'Pakistan', currency: 'PKR' },
]

const normalizeDeliveryType = (value: unknown): DeliveryType =>
  value === 'partner' ? 'partner' : 'carecraftz'

const parseLocations = (raw: string | null | undefined): FulfilmentLocation[] => {
  if (!raw || !raw.trim()) return [{ name: 'UAE', currency: 'AED' }]
  return raw.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const preset = PRESET_LOCATIONS.find((item) => item.name.toLowerCase() === part.toLowerCase())
    if (preset) return { ...preset }
    const [namePart, currencyPart] = part.split(':').map((piece) => piece.trim())
    const currency: LocationCurrency = currencyPart?.toUpperCase() === 'PKR' ? 'PKR' : 'AED'
    if (namePart.toLowerCase() === 'pakistan') return { name: 'Pakistan', currency: 'PKR' }
    if (namePart.toLowerCase() === 'uae') return { name: 'UAE', currency: 'AED' }
    return { name: namePart, currency }
  })
}

const serializeLocations = (locations: FulfilmentLocation[]): string => {
  if (locations.length === 0) return 'UAE'
  return locations.map((loc) => {
    const preset = PRESET_LOCATIONS.find((item) => item.name === loc.name)
    if (preset) return preset.name
    return `${loc.name}:${loc.currency}`
  }).join(',')
}

const emptyLocationFulfilment = (deliveryType: DeliveryType = 'carecraftz'): LocationFulfilmentData => ({
  price: 0,
  compare_at_price: null,
  inventory: 0,
  low_stock_threshold: 10,
  weight: null,
  discount_percent: 0,
  delivery_type: deliveryType,
  delivery_charge: 0,
})

/** CareCraftz own storefront location (My Store setup). Not both markets by default. */
const PLATFORM_STORE_LOCATION: FulfilmentLocation = { name: 'UAE', currency: 'AED' }

const isPlatformCareCraftzStore = (store: { display_name?: string | null; tenant_type?: string | null } | null) => {
  if (!store) return false
  const tenant = (store.tenant_type || '').toLowerCase()
  if (tenant === 'carecraftz' || tenant === 'platform' || tenant === 'official') return true
  return (store.display_name || '').trim().toLowerCase() === 'carecraftz'
}

const normalizePartnerShippingLocations = (
  raw: string[] | null | undefined,
  store?: { display_name?: string | null; tenant_type?: string | null } | null,
): FulfilmentLocation[] => {
  // Own CareCraftz store follows My Store location (UAE), not partner multi-market shipping lists.
  if (isPlatformCareCraftzStore(store ?? null)) {
    return [{ ...PLATFORM_STORE_LOCATION }]
  }

  const found = new Set<'UAE' | 'Pakistan'>()
  ;(raw || []).forEach((item) => {
    const lower = String(item).toLowerCase()
    if (
      lower.includes('pakistan') ||
      lower.includes('pkr') ||
      lower.includes('lahore') ||
      lower.includes('karachi') ||
      lower.includes('islamabad')
    ) {
      found.add('Pakistan')
    }
    if (
      lower.includes('uae') ||
      lower.includes('dubai') ||
      lower.includes('abu dhabi') ||
      lower.includes('emirates') ||
      lower.includes('aed')
    ) {
      found.add('UAE')
    }
  })
  // Empty shipping list → single default market (matches My Store), not both countries.
  if (found.size === 0) return [{ ...PLATFORM_STORE_LOCATION }]
  return PRESET_LOCATIONS.filter((item) => found.has(item.name as 'UAE' | 'Pakistan')).map((item) => ({ ...item }))
}

const ensureLocationFulfilment = (
  current: FulfilmentByLocation,
  locations: FulfilmentLocation[],
  fallback?: Partial<LocationFulfilmentData>,
): FulfilmentByLocation => {
  const next: FulfilmentByLocation = {}
  locations.forEach((loc) => {
    next[loc.name] = {
      ...emptyLocationFulfilment(fallback?.delivery_type),
      ...fallback,
      ...current[loc.name],
    }
  })
  return next
}

const hydrateFulfilmentByLocation = (product?: Partial<Product>): FulfilmentByLocation => {
  const locations = parseLocations(product?.location)
  const existing = (product?.fulfilment_by_location && typeof product.fulfilment_by_location === 'object')
    ? product.fulfilment_by_location
    : {}
  const seeded = ensureLocationFulfilment(existing, locations, {
    delivery_type: normalizeDeliveryType(product?.delivery_type),
    delivery_charge: product?.delivery_charge ?? 0,
    inventory: product?.inventory ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 10,
    weight: product?.weight ?? null,
    discount_percent: product?.discount_percent ?? 0,
  })

  if (seeded.UAE) {
    seeded.UAE = {
      ...seeded.UAE,
      price: product?.price_aed ?? product?.price ?? seeded.UAE.price,
      compare_at_price: product?.compare_at_price ?? seeded.UAE.compare_at_price,
    }
  }
  if (seeded.Pakistan) {
    seeded.Pakistan = {
      ...seeded.Pakistan,
      price: product?.price_pkr ?? seeded.Pakistan.price,
    }
  }
  return seeded
}

const applyFulfilmentToProductFields = (form: Product): Product => {
  const locations = parseLocations(form.location)
  const byLocation = ensureLocationFulfilment(form.fulfilment_by_location || {}, locations, {
    delivery_type: form.delivery_type,
  })
  const uae = byLocation.UAE
  const pakistan = byLocation.Pakistan
  const primary = uae || pakistan || emptyLocationFulfilment(form.delivery_type)
  const inventory = locations.reduce((sum, loc) => sum + (byLocation[loc.name]?.inventory || 0), 0)

  return {
    ...form,
    fulfilment_by_location: byLocation,
    price_aed: uae ? uae.price : null,
    price_pkr: pakistan ? pakistan.price : null,
    price: primary.price,
    compare_at_price: uae?.compare_at_price ?? primary.compare_at_price,
    inventory,
    low_stock_threshold: primary.low_stock_threshold,
    weight: primary.weight,
    discount_percent: primary.discount_percent,
    delivery_type: primary.delivery_type,
    delivery_charge: primary.delivery_charge,
  }
}

type FieldChange = { field: string; label: string; from: string; to: string }

const formatChangeValue = (value: unknown, field?: string): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (field === 'delivery_type' && (value === 'carecraftz' || value === 'partner')) {
    return DELIVERY_TYPE_LABELS[value]
  }
  if (field === 'fulfilment_by_location' && value && typeof value === 'object') {
    const keys = Object.keys(value as FulfilmentByLocation)
    return keys.length ? keys.join(', ') : '—'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None'
    if (typeof value[0] === 'string' && (value[0] as string).startsWith('http')) {
      return `${value.length} image${value.length === 1 ? '' : 's'}`
    }
    return `${value.length} item${value.length === 1 ? '' : 's'}`
  }
  const text = String(value)
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

const normalizeSections = (list: ProductSection[]) =>
  list.map(({ _uploading: _u, id: _id, ...rest }) => rest)

const collectProductChanges = (
  baseline: Product,
  current: Product,
  baselineSections: ProductSection[],
  currentSections: ProductSection[],
): FieldChange[] => {
  const changes: FieldChange[] = []
  ;(Object.keys(FIELD_LABELS) as (keyof Product)[]).forEach((key) => {
    const fromVal = baseline[key]
    const toVal = current[key]
    const fromStr = JSON.stringify(fromVal ?? null)
    const toStr = JSON.stringify(toVal ?? null)
    if (fromStr !== toStr) {
      changes.push({
        field: String(key),
        label: FIELD_LABELS[key] || String(key),
        from: formatChangeValue(fromVal, String(key)),
        to: formatChangeValue(toVal, String(key)),
      })
    }
  })

  if (JSON.stringify(normalizeSections(baselineSections)) !== JSON.stringify(normalizeSections(currentSections))) {
    changes.push({
      field: 'sections',
      label: 'Page sections',
      from: `${baselineSections.length} block${baselineSections.length === 1 ? '' : 's'}`,
      to: `${currentSections.length} block${currentSections.length === 1 ? '' : 's'}`,
    })
  }

  return changes
}

const formatStatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)
const formatStatDate = (value: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
const formatStatRating = (value: number) => `${value > 0 ? value.toFixed(1) : '0.0'}/5`

const EMPTY_PRODUCT: Product = {
  name: '', subtitle: '', description: '', how_to_use: '', ingredients: '',
  brand_id: null, brand_name: '', brand_logo: '', seller_name: '', partner_store_id: null,
  price: 0, price_pkr: null, price_aed: null, compare_at_price: null,
  inventory: 0, low_stock_threshold: 10, category: '', location: 'UAE',
  delivery_charge: 0, delivery_type: 'carecraftz', fulfilment_by_location: { UAE: emptyLocationFulfilment() },
  images: [], is_active: true, is_featured: false,
  sku: '', weight: null, discount_percent: 0, tag1: '', tag2: '', skin_type: '',
}

const buildProductForm = (product?: Partial<Product> & { id?: string }): Product => {
  const base: Product = {
    ...EMPTY_PRODUCT,
    ...product,
    name: product?.name || '',
    subtitle: product?.subtitle || '',
    description: product?.description || '',
    how_to_use: product?.how_to_use || '',
    ingredients: product?.ingredients || '',
    brand_id: product?.brand_id || null,
    brand_name: product?.brand_name || '',
    brand_logo: product?.brand_logo || '',
    seller_name: product?.seller_name || '',
    partner_store_id: product?.partner_store_id || null,
    category: product?.category || '',
    location: product?.location || 'UAE',
    delivery_type: normalizeDeliveryType(product?.delivery_type),
    sku: product?.sku || '',
    tag1: product?.tag1 || '',
    tag2: product?.tag2 || '',
    skin_type: product?.skin_type || '',
    images: (() => {
      const raw = product as (Partial<Product> & { image?: string | null; images?: string[] | string | null }) | undefined
      if (Array.isArray(raw?.images) && raw.images.length > 0) {
        return raw.images.filter(Boolean)
      }
      if (typeof raw?.images === 'string' && raw.images) {
        return [raw.images]
      }
      if (raw?.image) {
        return [raw.image]
      }
      return []
    })(),
    fulfilment_by_location: {},
  }
  return applyFulfilmentToProductFields({
    ...base,
    fulfilment_by_location: hydrateFulfilmentByLocation(product),
  })
}

type SupabaseErrorLike = {
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | number | null
}

type ProductSaveStage = 'product details' | 'page sections'

const cleanErrorText = (value?: string | null) => (value || '').trim()

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error.trim()
  if (error instanceof Error) return error.message.trim()

  if (error && typeof error === 'object') {
    const typedError = error as SupabaseErrorLike
    return [typedError.message, typedError.details, typedError.hint]
      .map(cleanErrorText)
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  return ''
}

const getFriendlyProductError = (error: unknown): string => {
  const message = extractErrorMessage(error)
  const lowerMessage = message.toLowerCase()
  const code = error && typeof error === 'object' ? String((error as SupabaseErrorLike).code ?? '') : ''

  if (!message) {
    return 'Please try again in a moment.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('networkerror') ||
    lowerMessage.includes('network request failed')
  ) {
    return 'The app could not reach the server. Please check your internet connection and try again.'
  }

  if (
    code === '42501' ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('rls')
  ) {
    return "Your account does not have permission to save products right now. Please sign in with an admin account and try again."
  }

  if (code === '23505' || lowerMessage.includes('duplicate key') || lowerMessage.includes('already exists')) {
    if (lowerMessage.includes('sku') || lowerMessage.includes('products_sku')) {
      return 'That SKU is already being used by another product. Please choose a different SKU.'
    }

    if (lowerMessage.includes('slug')) {
      return 'That slug is already being used. Please choose a different value.'
    }

    return 'One of the values you entered is already in use. Please change the duplicate field and try again.'
  }

  if (code === '23502' || lowerMessage.includes('null value in column') || lowerMessage.includes('violates not-null constraint')) {
    return 'Please fill in the missing required fields before saving.'
  }

  if (code === '23503' || lowerMessage.includes('foreign key')) {
    return 'One of the linked records could not be found. Please refresh the page and try again.'
  }

  if (lowerMessage.includes('violates check constraint') || lowerMessage.includes('check constraint')) {
    if (lowerMessage.includes('skin_type')) {
      return 'Please pick a valid skin type or leave it blank.'
    }

    return 'One of the values you selected is not allowed. Please review the form and try again.'
  }

  if (lowerMessage.includes('no product id after save')) {
    return 'The product was saved, but the app could not confirm the new product ID. Please refresh and try again.'
  }

  if (lowerMessage.includes('relation "') && lowerMessage.includes('does not exist')) {
    return 'A required database table is missing. Please contact support or run the latest database migration.'
  }

  if (lowerMessage.includes('invalid input syntax') || lowerMessage.includes('cannot cast') || lowerMessage.includes('parse')) {
    return 'One of the numbers or fields contains an invalid value. Please check prices, stock, and any numeric fields.'
  }

  if (lowerMessage.includes('storage') || lowerMessage.includes('upload')) {
    return 'A file upload failed. Please try a smaller image or upload again.'
  }

  const looksTechnical = /(postgres|postgrest|sql|rpc|uuid|constraint|relation|foreign key|null value|duplicate key|syntax error)/i.test(message)
  return looksTechnical ? 'Something went wrong while saving. Please try again.' : message
}

const buildProductSaveErrorMessage = (stage: ProductSaveStage, error: unknown, productWasSaved: boolean): string => {
  const reason = getFriendlyProductError(error)

  if (stage === 'product details') {
    return `We couldn't save the product details. ${reason}`
  }

  if (productWasSaved) {
    return `The product details were saved, but the ${stage} could not be updated. ${reason}`
  }

  return `We couldn't save the ${stage}. ${reason}`
}

const buildProductUploadErrorMessage = (label: string, error: unknown): string => {
  const reason = getFriendlyProductError(error)
  return `We couldn't upload the ${label}. ${reason}`
}

const getTimeOfDayLabel = (date: Date) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const formatClock = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

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
  shipping_address?: { full_name?: string }
}

export default function ProductModal({
  product,
  onClose,
  onSaved,
  layout = 'modal',
  closeOnSave = true,
  stats = null,
  statsError = '',
}: Props) {
  const navigate = useNavigate()
  const isPageLayout = layout === 'page'
  const visibleTabs = TABS.filter((tab) => isPageLayout || !tab.pageOnly)
  const [activeTab, setActiveTab] = useState<ModalTab>('basics')
  const [form, setForm] = useState<Product>(() => buildProductForm(product))
  const [baselineForm, setBaselineForm] = useState<Product>(() => buildProductForm(product))
  const [sections, setSections] = useState<ProductSection[]>([])
  const [baselineSections, setBaselineSections] = useState<ProductSection[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [showChanges, setShowChanges] = useState(false)
  const [partnerStores, setPartnerStores] = useState<PartnerStoreOption[]>([])
  const [partnerStoresLoading, setPartnerStoresLoading] = useState(false)
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [activeLocationTab, setActiveLocationTab] = useState('UAE')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [recentOrders, setRecentOrders] = useState<HeaderOrder[]>([])
  const [now, setNow] = useState(() => new Date())
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isPageLayout) return

    const loadHeaderChrome = async () => {
      const [{ data: sessionData }, ordersResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from('orders')
          .select('id,order_code,customer_email,created_at,shipping_address')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const email = sessionData.session?.user?.email
      if (email) {
        const name = email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }

      if (!ordersResult.error && ordersResult.data) {
        setRecentOrders(ordersResult.data as HeaderOrder[])
      }
    }

    void loadHeaderChrome()
  }, [isPageLayout])

  useEffect(() => {
    if (!isPageLayout) return
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [isPageLayout])

  const newOrders = useMemo(() => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return recentOrders.filter((order) => new Date(order.created_at) > last24Hours)
  }, [recentOrders])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const selectedPartner = useMemo(
    () => partnerStores.find((store) => store.id === form.partner_store_id) || null,
    [partnerStores, form.partner_store_id],
  )
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === form.brand_id) || null,
    [brands, form.brand_id],
  )
  const partnerLockedLocations = useMemo(
    () => (selectedPartner ? normalizePartnerShippingLocations(selectedPartner.shipping_locations, selectedPartner) : []),
    [selectedPartner],
  )
  const fulfilmentLocations = useMemo(() => parseLocations(form.location), [form.location])
  const activeLocation = fulfilmentLocations.find((loc) => loc.name === activeLocationTab) || fulfilmentLocations[0] || null
  const activeLocationData = activeLocation
    ? form.fulfilment_by_location[activeLocation.name] || emptyLocationFulfilment(form.delivery_type)
    : emptyLocationFulfilment(form.delivery_type)

  const updateActiveLocationData = (patch: Partial<LocationFulfilmentData>) => {
    if (!activeLocation) return
    setForm((current) => {
      const nextByLocation = {
        ...current.fulfilment_by_location,
        [activeLocation.name]: {
          ...(current.fulfilment_by_location[activeLocation.name] || emptyLocationFulfilment(current.delivery_type)),
          ...patch,
        },
      }
      return applyFulfilmentToProductFields({
        ...current,
        fulfilment_by_location: nextByLocation,
      })
    })
  }

  const applyPartnerLocations = useCallback((store: PartnerStoreOption | null, currentForm: Product): Product => {
    if (!store) {
      return applyFulfilmentToProductFields({
        ...currentForm,
        partner_store_id: null,
        location: 'UAE',
        fulfilment_by_location: ensureLocationFulfilment(currentForm.fulfilment_by_location, [{ name: 'UAE', currency: 'AED' }]),
      })
    }
    const locked = normalizePartnerShippingLocations(store.shipping_locations, store)
    return applyFulfilmentToProductFields({
      ...currentForm,
      partner_store_id: store.id,
      seller_name: store.display_name || currentForm.seller_name,
      location: serializeLocations(locked),
      fulfilment_by_location: ensureLocationFulfilment(currentForm.fulfilment_by_location, locked, {
        delivery_type: currentForm.delivery_type,
      }),
    })
  }, [])

  const fetchSections = useCallback(async (productId: string) => {
    const { data } = await supabase.from('product_sections').select('*').eq('product_id', productId).order('sort_order')
    const mapped = (data || []).map((s: ProductSection) => ({
      ...s,
      manifesto_title: s.manifesto_title || '',
      manifesto_body: s.manifesto_body || '',
      breakdown_title: s.breakdown_title || '',
      breakdown_body: s.breakdown_body || '',
      breakdown_image: s.breakdown_image || '',
      breakdown_left_image: s.breakdown_left_image || '',
    }))
    setSections(mapped)
    setBaselineSections(mapped)
  }, [])

  const pendingChanges = useMemo(() => {
    const changes = collectProductChanges(baselineForm, form, baselineSections, sections)
    const storeLabel = (id: string | null) => {
      if (!id) return '—'
      return partnerStores.find((store) => store.id === id)?.display_name || id
    }
    const brandLabel = (id: string | null) => {
      if (!id) return '—'
      return brands.find((brand) => brand.id === id)?.name || id
    }
    return changes
      .filter((change) => change.field !== 'brand_name' && change.field !== 'brand_logo')
      .map((change) => {
        if (change.field === 'partner_store_id') {
          return {
            ...change,
            from: storeLabel(baselineForm.partner_store_id),
            to: storeLabel(form.partner_store_id),
          }
        }
        if (change.field === 'brand_id') {
          return {
            ...change,
            from: brandLabel(baselineForm.brand_id),
            to: brandLabel(form.brand_id),
          }
        }
        return change
      })
  }, [baselineForm, form, baselineSections, sections, partnerStores, brands])
  const hasChanges = pendingChanges.length > 0

  useEffect(() => {
    let cancelled = false
    const loadBrands = async () => {
      setBrandsLoading(true)
      try {
        const { data, error: brandsError } = await supabase
          .from('brands')
          .select('id, name, logo_url')
          .order('name', { ascending: true })
        if (brandsError) throw brandsError
        if (!cancelled) setBrands((data || []) as BrandOption[])
      } catch (loadError) {
        console.error('Failed to load brands:', loadError)
        if (!cancelled) setBrands([])
      } finally {
        if (!cancelled) setBrandsLoading(false)
      }
    }
    void loadBrands()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadPartnerStores = async () => {
      setPartnerStoresLoading(true)
      try {
        const { data, error: storesError } = await supabase
          .from('partner_stores')
          .select('id, display_name, status, approval_status, tenant_type, partner_applications(shipping_locations)')
          .order('display_name', { ascending: true })

        if (storesError) throw storesError
        if (!cancelled) {
          const mapped = (data || []).map((row) => {
            const record = row as {
              id: string
              display_name: string
              status: string
              approval_status: string
              tenant_type?: string | null
              partner_applications?: { shipping_locations?: string[] | null } | { shipping_locations?: string[] | null }[] | null
            }
            const application = Array.isArray(record.partner_applications)
              ? record.partner_applications[0]
              : record.partner_applications
            return {
              id: record.id,
              display_name: record.display_name,
              status: record.status,
              approval_status: record.approval_status,
              tenant_type: record.tenant_type,
              shipping_locations: application?.shipping_locations || [],
            } satisfies PartnerStoreOption
          })
          setPartnerStores(mapped)
        }
      } catch (storesError) {
        console.error('Failed to load partner stores:', storesError)
        if (!cancelled) setPartnerStores([])
      } finally {
        if (!cancelled) setPartnerStoresLoading(false)
      }
    }
    void loadPartnerStores()
    return () => {
      cancelled = true
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setImageUploading(true)
    const uploaded: string[] = []
    let uploadError: unknown = null

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('product-images').upload(path, file)

        if (error) {
          uploadError = error
          break
        }

        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }

      setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))

      if (uploadError) {
        throw uploadError
      }
    } catch (uploadError) {
      setError(buildProductUploadErrorMessage('product image', uploadError))
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handlePartnerStoreChange = (storeId: string) => {
    const store = storeId ? partnerStores.find((item) => item.id === storeId) || null : null
    setForm((current) => applyPartnerLocations(store, current))
    const locked = store
      ? normalizePartnerShippingLocations(store.shipping_locations, store)
      : [{ ...PLATFORM_STORE_LOCATION }]
    setActiveLocationTab(locked[0]?.name || 'UAE')
  }

  const handleBrandSelect = (brandId: string) => {
    const brand = brandId ? brands.find((item) => item.id === brandId) || null : null
    setForm((current) => ({
      ...current,
      brand_id: brand?.id || null,
      brand_name: brand?.name || '',
      brand_logo: brand?.logo_url || '',
    }))
  }

  useEffect(() => {
    if (fulfilmentLocations.length === 0) return
    if (!fulfilmentLocations.some((loc) => loc.name === activeLocationTab)) {
      setActiveLocationTab(fulfilmentLocations[0].name)
    }
  }, [fulfilmentLocations, activeLocationTab])

  useEffect(() => {
    if (!form.partner_store_id || partnerStores.length === 0) return
    const store = partnerStores.find((item) => item.id === form.partner_store_id)
    if (!store) return
    const locked = serializeLocations(normalizePartnerShippingLocations(store.shipping_locations, store))
    if (locked === form.location) return
    setForm((current) => applyPartnerLocations(store, current))
    setBaselineForm((current) => applyPartnerLocations(store, current))
    setActiveLocationTab(normalizePartnerShippingLocations(store.shipping_locations, store)[0]?.name || 'UAE')
  }, [partnerStores, form.partner_store_id, form.location, applyPartnerLocations])

  const handleSectionImageUpload = async (idx: number, field: 'breakdown_image' | 'breakdown_left_image', file: File) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, _uploading: true } : s))
    try {
      const ext = file.name.split('.').pop()
      const path = `product-sections/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)

      if (error) {
        throw error
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: data.publicUrl, _uploading: false } : s))
    } catch (uploadError) {
      setSections(prev => prev.map((s, i) => i === idx ? { ...s, _uploading: false } : s))
      setError(buildProductUploadErrorMessage('section image', uploadError))
    }
  }

  const addSection = (type: 'manifesto' | 'breakdown') => {
    setSections(prev => [...prev, {
      section_type: type,
      sort_order: prev.length,
      manifesto_title: '', manifesto_body: '',
      breakdown_title: '', breakdown_body: '',
      breakdown_image: '', breakdown_left_image: '',
    }])
  }

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx))

  useEffect(() => {
    const nextForm = buildProductForm(product)
    setForm(nextForm)
    setBaselineForm(nextForm)
    setShowChanges(false)
    if (!product?.id) {
      setSections([])
      setBaselineSections([])
      return
    }
    const timeoutId = window.setTimeout(() => {
      void fetchSections(product.id)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchSections, product])

  const updateSection = (idx: number, field: keyof ProductSection, value: string | number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Please add a product name before saving.')
      return
    }

    setSaving(true)
    setError('')

    let productId = product?.id
    let productWasSaved = Boolean(productId)
    let saveStage: ProductSaveStage = 'product details'
    const payload = applyFulfilmentToProductFields(form)

    try {
      if (productId) {
        const { data: updatedProduct, error } = await supabase.from('products').update({
          name: payload.name, subtitle: payload.subtitle, description: payload.description,
          how_to_use: payload.how_to_use, ingredients: payload.ingredients,
          brand_id: payload.brand_id, brand_name: payload.brand_name, brand_logo: payload.brand_logo,
          seller_name: payload.seller_name,
          partner_store_id: payload.partner_store_id,
          price: payload.price, price_pkr: payload.price_pkr, price_aed: payload.price_aed,
          compare_at_price: payload.compare_at_price, inventory: payload.inventory,
          low_stock_threshold: payload.low_stock_threshold, category: payload.category,
          location: payload.location, delivery_charge: payload.delivery_charge,
          delivery_type: payload.delivery_type,
          fulfilment_by_location: payload.fulfilment_by_location,
          images: payload.images, is_active: payload.is_active, is_featured: payload.is_featured,
          sku: payload.sku, weight: payload.weight, discount_percent: payload.discount_percent,
          tag1: payload.tag1, tag2: payload.tag2, skin_type: payload.skin_type,
          updated_at: new Date().toISOString(),
        }).eq('id', productId).select('id').maybeSingle()
        if (error) throw error
        if (!updatedProduct?.id) {
          throw new Error('No product record was updated. This usually means your account no longer has product edit permission, or the product no longer exists.')
        }
      } else {
        const { data: insertedProduct, error } = await supabase.from('products').insert({
          name: payload.name, subtitle: payload.subtitle, description: payload.description,
          how_to_use: payload.how_to_use, ingredients: payload.ingredients,
          brand_id: payload.brand_id, brand_name: payload.brand_name, brand_logo: payload.brand_logo,
          seller_name: payload.seller_name,
          partner_store_id: payload.partner_store_id,
          price: payload.price, price_pkr: payload.price_pkr, price_aed: payload.price_aed,
          compare_at_price: payload.compare_at_price, inventory: payload.inventory,
          low_stock_threshold: payload.low_stock_threshold, category: payload.category,
          location: payload.location, delivery_charge: payload.delivery_charge,
          delivery_type: payload.delivery_type,
          fulfilment_by_location: payload.fulfilment_by_location,
          images: payload.images, is_active: payload.is_active, is_featured: payload.is_featured,
          sku: payload.sku, weight: payload.weight, discount_percent: payload.discount_percent,
          tag1: payload.tag1, tag2: payload.tag2, skin_type: payload.skin_type,
        }).select('id').maybeSingle()
        if (error) throw error
        if (!insertedProduct?.id) {
          throw new Error('The product row was not created. Please check your product creation permissions and try again.')
        }
        productId = insertedProduct.id
      }

      if (!productId) throw new Error('No product ID after save')

      productWasSaved = true

      saveStage = 'page sections'
      const { error: deleteSectionsError } = await supabase.from('product_sections').delete().eq('product_id', productId)
      if (deleteSectionsError) throw deleteSectionsError

      if (sections.length > 0) {
        const toInsert = sections.map((s, i) => ({
          product_id: productId,
          section_type: s.section_type,
          sort_order: i,
          manifesto_title: s.manifesto_title || null,
          manifesto_body: s.manifesto_body || null,
          breakdown_title: s.breakdown_title || null,
          breakdown_body: s.breakdown_body || null,
          breakdown_image: s.breakdown_image || null,
          breakdown_left_image: s.breakdown_left_image || null,
        }))
        const { error } = await supabase.from('product_sections').insert(toInsert)
        if (error) throw error
      }

      setForm(payload)
      setBaselineForm({ ...payload })
      setBaselineSections(sections.map((s) => ({ ...s })))
      setShowChanges(false)
      onSaved(productId)
      if (closeOnSave) {
        onClose()
      }
    } catch (err: unknown) {
      console.error(`Product save failed while ${saveStage}:`, err)
      setError(buildProductSaveErrorMessage(saveStage, err, productWasSaved))
    } finally {
      setSaving(false)
    }
  }

  const actionButtons = (
    <div className="relative flex items-center gap-2 shrink-0">
      {hasChanges && (
        <button
          type="button"
          onClick={() => setShowChanges((open) => !open)}
          className={`inline-flex items-center gap-1.5 border border-amber-300 bg-amber-50 font-semibold text-amber-900 hover:bg-amber-100 transition-colors ${
            isPageLayout
              ? 'rounded-lg px-2.5 py-1.5 text-[11px]'
              : 'rounded-full px-2.5 py-1 text-xs'
          }`}
        >
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {pendingChanges.length}
          </span>
          pending
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChanges ? 'rotate-180' : ''}`} />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className={
          isPageLayout
            ? 'rounded-lg border border-[#D9D0C2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white/80 transition-colors'
            : 'px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors'
        }
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className={
          isPageLayout
            ? 'inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40'
            : 'inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:cursor-not-allowed'
        }
      >
        {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        {saving ? 'Saving…' : product?.id ? 'Save' : 'Create'}
      </button>

      {showChanges && hasChanges && (
        <div className="absolute right-0 top-full mt-1.5 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#D9D0C2] bg-white shadow-lg z-30 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#E8E0D4] bg-[#F7F2E8]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
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
      )}
    </div>
  )

  const imageGallery = (
    <div className={isPageLayout ? 'space-y-2.5' : undefined}>
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product images</label>
      {isPageLayout ? (
        <div className="mt-1.5 rounded-xl border border-[#D9D0C2] bg-white p-2.5 space-y-2.5">
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]">
            {form.images[0] ? (
              <img src={form.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-400">
                <Upload className="h-6 w-6" />
                <p className="text-[11px]">No image yet</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {form.images.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-[#D9D0C2] bg-[#F7F2E8] group"
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
            <label className="aspect-square border border-dashed border-[#D9D0C2] rounded-lg bg-[#FBF8F2] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
              {imageUploading ? (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-[9px] text-gray-400 mt-0.5">Upload</span>
                </>
              )}
              <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {form.images.length === 0 && (
            <p className="w-full text-[11px] text-gray-400">No images yet.</p>
          )}
          {form.images.map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border border-dashed border-[#D9D0C2] rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
            {imageUploading ? (
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-[9px] text-gray-400 mt-0.5">Upload</span>
              </>
            )}
            <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      )}
    </div>
  )

  return (
    <div className={isPageLayout ? 'w-full h-full' : 'fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:items-center'}>
      <div className={isPageLayout ? 'flex h-full w-full flex-col overflow-hidden bg-[#F7F2E8]' : 'my-8 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl'}>

        {/* Header — matches admin sticky chrome */}
        <div
          className={
            isPageLayout
              ? 'sticky top-0 z-20 shrink-0 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6'
              : 'flex shrink-0 items-center justify-between gap-3 border-b border-[#E8E0D4] px-6 py-4'
          }
        >
          {isPageLayout ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900">
                  {product?.id ? 'Edit product' : 'Add product'}
                </h1>
                <p className="text-[11px] text-gray-500 truncate">
                  {form.name?.trim()
                    ? form.name
                    : product?.id
                      ? 'Update catalog details, images, and fulfilment.'
                      : 'Create a new catalog product.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {actionButtons}

                <div className="flex flex-col items-end leading-tight border-l border-[#D9D0C2] pl-2.5">
                  <span className="hidden sm:inline text-[10px] font-medium text-gray-500">
                    {getTimeOfDayLabel(now)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-800 tabular-nums">
                    {formatClock(now)}
                  </span>
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
                    {newOrders.length > 0 && (
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
                        {newOrders.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                            <p className="text-[11px] text-gray-500">No new orders in the last 24 hours</p>
                          </div>
                        ) : (
                          newOrders.slice(0, 5).map((order) => (
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
                      setShowChanges(false)
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
          ) : (
            <>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  {product?.id ? 'Edit product' : 'Add product'}
                </h2>
                {product?.id && <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">ID: {product.id}</p>}
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {error && (
          <div className={`shrink-0 ${isPageLayout ? 'px-5 pt-3' : 'px-8 pt-4'}`}>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert" aria-live="polite">
              {error}
            </div>
          </div>
        )}

        {/* Modal: horizontal tabs */}
        {!isPageLayout && (
          <div className="flex shrink-0 gap-1 px-8 pt-4 border-b border-gray-100 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Page: left sections + content | Modal: content only */}
        <div className={isPageLayout ? 'flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden' : 'contents'}>
          {isPageLayout && (
            <aside className="md:w-48 lg:w-52 shrink-0 border-b md:border-b-0 md:border-r border-[#E8E0D4] bg-[#F0E9DC] p-2.5 md:overflow-y-auto">
              <p className="px-2 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">Sections</p>
              <nav className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap text-left px-2.5 py-1.5 rounded-md text-[12px] font-medium leading-snug transition-colors ${
                      activeTab === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-[#F7F2E8] hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          <div className={isPageLayout ? 'flex-1 min-w-0 min-h-0 overflow-y-auto px-3 py-3 sm:px-5 lg:px-6 pb-8' : 'flex-1 overflow-y-auto px-6 py-4'}>

          {/* ── TAB: BASICS ── */}
          {activeTab === 'basics' && (
            <div
              className={
                isPageLayout
                  ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 max-w-6xl items-start'
                  : 'space-y-3 max-w-3xl'
              }
            >
              {!isPageLayout && imageGallery}

              <div className={`space-y-3 ${isPageLayout ? 'min-w-0 order-2 lg:order-1' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                      placeholder="e.g. Moringa Soap Bar" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subtitle</label>
                    <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                      placeholder="e.g. Lavender Bergamot" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SKU</label>
                    <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                      placeholder="SKU-001" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={7}
                    className="mt-1 w-full px-3 py-2 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-y min-h-[10rem]"
                    placeholder="Short product description..." />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                    <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                      placeholder="Face, Body..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Skin type</label>
                    <div className="relative mt-1">
                      <select value={form.skin_type} onChange={e => setForm(f => ({ ...f, skin_type: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none">
                        <option value="">None</option>
                        <option value="Oily">Oily</option>
                        <option value="Dry">Dry</option>
                        <option value="Combo">Combo</option>
                        <option value="Sensitive">Sensitive</option>
                        <option value="Normal">Normal</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tag 1</label>
                    <input value={form.tag1} onChange={e => setForm(f => ({ ...f, tag1: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tag 2</label>
                    <input value={form.tag2} onChange={e => setForm(f => ({ ...f, tag2: e.target.value }))}
                      className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                    <span className="text-xs text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                    <span className="text-xs text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              {isPageLayout && (
                <aside className="order-1 lg:order-2 lg:sticky lg:top-3">
                  {imageGallery}
                </aside>
              )}
            </div>
          )}

          {/* ── TAB: BRAND ── */}
          {activeTab === 'brand' && (
            <div className="max-w-lg space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Brand</label>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Select one brand for this product. Clear to leave unassigned.
                </p>
              </div>

              {brandsLoading ? (
                <p className="text-xs text-gray-500">Loading brands…</p>
              ) : brands.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D9D0C2] bg-white px-4 py-6 text-center">
                  <p className="text-sm font-medium text-gray-800">No brands yet</p>
                  <p className="mt-1 text-[11px] text-gray-500">Add brands from the Brands page first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleBrandSelect('')}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      !form.brand_id
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/30'
                        : 'border-[#D9D0C2] bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg border border-[#E8E0D4] bg-[#F7F2E8] flex items-center justify-center text-[10px] text-gray-400">
                      None
                    </div>
                    <span className="text-xs font-medium text-gray-700">No brand</span>
                  </button>

                  {brands.map((brand) => {
                    const selected = form.brand_id === brand.id
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => handleBrandSelect(brand.id)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/30'
                            : 'border-[#D9D0C2] bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                              {brand.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-900 truncate">{brand.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedBrand && (
                <div className="rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 flex items-center gap-2.5">
                  <div className="h-8 w-8 overflow-hidden rounded-md border border-[#E8E0D4] bg-[#F7F2E8]">
                    {selectedBrand.logo_url ? (
                      <img src={selectedBrand.logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Selected</p>
                    <p className="text-xs font-medium text-gray-900 truncate">{selectedBrand.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PARTNER ── */}
          {activeTab === 'partner' && (
            <div className="max-w-md space-y-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Partner store</label>
              <div className="relative">
                <select
                  value={form.partner_store_id || ''}
                  onChange={(e) => handlePartnerStoreChange(e.target.value)}
                  disabled={partnerStoresLoading}
                  className="w-full px-3 py-2 border border-[#D9D0C2] rounded-lg text-sm bg-white appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select partner store</option>
                  {partnerStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.display_name}
                      {store.approval_status !== 'approved' || store.status !== 'active' ? ` (${store.status})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-[11px] text-gray-400">
                {partnerStoresLoading
                  ? 'Loading partner stores…'
                  : partnerStores.length === 0
                    ? 'No partner stores found yet.'
                    : 'Partner selection sets fulfilment locations for this product.'}
              </p>
              {selectedPartner && (
                <div className="rounded-lg border border-[#D9D0C2] bg-[#FBF8F2] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Fulfilment locations</p>
                  <p className="mt-1 text-xs text-gray-800">
                    {partnerLockedLocations.map((loc) => `${loc.name} (${loc.currency})`).join(' · ') || 'UAE (AED)'}
                  </p>
                  {isPlatformCareCraftzStore(selectedPartner) ? (
                    <p className="mt-1 text-[10px] text-gray-500">Matches My Store location (UAE).</p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: FULFILMENT ── */}
          {activeTab === 'fulfilment' && (
            <div className="space-y-3 max-w-3xl">
              {!form.partner_store_id ? (
                <div className="rounded-lg border border-dashed border-[#D9D0C2] bg-white px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-800">Select a partner first</p>
                  <p className="mt-1 text-[11px] text-gray-500">Fulfilment locations are filled and locked from the partner store.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('partner')}
                    className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Go to Partner
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fulfilment locations</label>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Locked from {selectedPartner?.display_name || 'partner'}. Switch tabs to fill each country.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {fulfilmentLocations.map((loc) => (
                        <span
                          key={loc.name}
                          className="inline-flex items-center gap-1 rounded-md border border-[#D9D0C2] bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700"
                        >
                          {loc.name}
                          <span className="text-[10px] text-gray-400">{loc.currency}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {fulfilmentLocations.length > 1 && (
                    <div className="flex gap-1 border-b border-[#E8E0D4]">
                      {fulfilmentLocations.map((loc) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => setActiveLocationTab(loc.name)}
                          className={`px-3 py-1.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                            activeLocation?.name === loc.name
                              ? 'border-indigo-600 text-indigo-700'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {loc.name}
                          <span className="ml-1 font-medium opacity-70">{loc.currency}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeLocation && (
                    <div className="space-y-3 rounded-lg border border-[#D9D0C2] bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {activeLocation.name} · {activeLocation.currency}
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price ({activeLocation.currency})</label>
                          <input
                            type="number"
                            value={activeLocationData.price || ''}
                            onChange={(e) => updateActiveLocationData({ price: parseFloat(e.target.value) || 0 })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Compare-at</label>
                          <input
                            type="number"
                            value={activeLocationData.compare_at_price ?? ''}
                            onChange={(e) => updateActiveLocationData({ compare_at_price: e.target.value ? parseFloat(e.target.value) : null })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Inventory</label>
                          <input
                            type="number"
                            value={activeLocationData.inventory}
                            onChange={(e) => updateActiveLocationData({ inventory: parseInt(e.target.value) || 0 })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Low stock</label>
                          <input
                            type="number"
                            value={activeLocationData.low_stock_threshold}
                            onChange={(e) => updateActiveLocationData({ low_stock_threshold: parseInt(e.target.value) || 10 })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Weight (g)</label>
                          <input
                            type="number"
                            value={activeLocationData.weight ?? ''}
                            onChange={(e) => updateActiveLocationData({ weight: e.target.value ? parseFloat(e.target.value) : null })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Discount %</label>
                          <input
                            type="number"
                            value={activeLocationData.discount_percent}
                            onChange={(e) => updateActiveLocationData({ discount_percent: parseFloat(e.target.value) || 0 })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Delivery type</label>
                          <div className="relative mt-1">
                            <select
                              value={activeLocationData.delivery_type}
                              onChange={(e) => updateActiveLocationData({ delivery_type: normalizeDeliveryType(e.target.value) })}
                              className="w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                            >
                              <option value="carecraftz">CareCraftz delivery</option>
                              <option value="partner">Partner own delivery</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Delivery charge ({activeLocation.currency})</label>
                          <input
                            type="number"
                            value={activeLocationData.delivery_charge}
                            onChange={(e) => updateActiveLocationData({ delivery_charge: parseFloat(e.target.value) || 0 })}
                            className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB: DETAILS ── */}
          {activeTab === 'details' && (
            <div className="space-y-3 max-w-3xl">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">How to use</label>
                <textarea value={form.how_to_use} onChange={e => setForm(f => ({ ...f, how_to_use: e.target.value }))} rows={6}
                  className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none font-mono"
                  placeholder="Step 1: Apply a small amount to damp skin..." />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ingredients</label>
                <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} rows={6}
                  className="mt-1 w-full px-3 py-1.5 border border-[#D9D0C2] rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none font-mono"
                  placeholder="Aqua, Sodium Palmate, Glycerin..." />
              </div>
            </div>
          )}

          {/* ── TAB: SECTIONS ── */}
          {activeTab === 'sections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Add Manifesto or Breakdown sections to display below the product detail.</p>
                <div className="flex gap-2">
                  <button onClick={() => addSection('manifesto')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Manifesto
                  </button>
                  <button onClick={() => addSection('breakdown')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Breakdown
                  </button>
                </div>
              </div>

              {sections.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm">No sections yet. Add a Manifesto or Breakdown section above.</p>
                </div>
              )}

              {sections.map((section, idx) => (
                <div key={idx} className={`border-2 rounded-2xl p-5 space-y-4 ${section.section_type === 'manifesto' ? 'border-indigo-200 bg-indigo-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${section.section_type === 'manifesto' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {section.section_type} — #{idx + 1}
                    </span>
                    <button onClick={() => removeSection(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {section.section_type === 'manifesto' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Title</label>
                        <input value={section.manifesto_title} onChange={e => updateSection(idx, 'manifesto_title', e.target.value)}
                          className="mt-1 w-full px-4 py-2.5 border border-[#D9D0C2] rounded-xl text-sm bg-white outline-none focus:border-indigo-400"
                          placeholder="e.g. Multipurpose Manifesto" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Body Text</label>
                        <textarea value={section.manifesto_body} onChange={e => updateSection(idx, 'manifesto_body', e.target.value)} rows={3}
                          className="mt-1 w-full px-4 py-2.5 border border-[#D9D0C2] rounded-xl text-sm bg-white outline-none focus:border-indigo-400 resize-none"
                          placeholder="Not just for your underarms, freshen up your décolletage (neck and chest) and feet." />
                      </div>
                    </>
                  )}

                  {section.section_type === 'breakdown' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Title</label>
                        <input value={section.breakdown_title} onChange={e => updateSection(idx, 'breakdown_title', e.target.value)}
                          className="mt-1 w-full px-4 py-2.5 border border-[#D9D0C2] rounded-xl text-sm bg-white outline-none focus:border-emerald-400"
                          placeholder="e.g. The Breakdown" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Body Text</label>
                        <textarea value={section.breakdown_body} onChange={e => updateSection(idx, 'breakdown_body', e.target.value)} rows={4}
                          className="mt-1 w-full px-4 py-2.5 border border-[#D9D0C2] rounded-xl text-sm bg-white outline-none focus:border-emerald-400 resize-none"
                          placeholder="Paper Tube + Seal: Compost (Backyard Or Municipal)&#10;Applicator: Recycle" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Left Lifestyle Image</label>
                          <div className="mt-2">
                            {section.breakdown_left_image ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={section.breakdown_left_image} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => updateSection(idx, 'breakdown_left_image', '')}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                                {section._uploading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                  : <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400 mt-1">Upload image</span></>}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleSectionImageUpload(idx, 'breakdown_left_image', e.target.files[0]) }} />
                              </label>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Right Detail Image (optional)</label>
                          <div className="mt-2">
                            {section.breakdown_image ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={section.breakdown_image} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => updateSection(idx, 'breakdown_image', '')}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                                {section._uploading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                  : <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400 mt-1">Upload image</span></>}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleSectionImageUpload(idx, 'breakdown_image', e.target.files[0]) }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: STATS ── */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {!product?.id ? (
                <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Save the product first to see performance stats.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">From completed orders and approved reviews.</p>
                  </div>

                  {statsError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
                      {statsError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { icon: Package2, label: 'Units sold', value: formatStatNumber(stats?.unitsSold ?? 0), tone: 'bg-indigo-50 text-indigo-600' },
                      { icon: ShoppingBag, label: 'Orders', value: formatStatNumber(stats?.orderCount ?? 0), tone: 'bg-emerald-50 text-emerald-600' },
                      { icon: Star, label: 'Avg rating', value: formatStatRating(stats?.averageRating ?? 0), tone: 'bg-amber-50 text-amber-600' },
                      { icon: MessageSquareText, label: 'Approved reviews', value: formatStatNumber(stats?.approvedReviews ?? 0), tone: 'bg-violet-50 text-violet-600' },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                          <div className={`rounded-lg p-1.5 ${card.tone}`}>
                            <card.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-gray-900">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 space-y-2.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Last sale</span>
                      <span className="font-medium text-gray-900">{formatStatDate(stats?.lastSoldAt ?? null)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Latest review</span>
                      <span className="font-medium text-gray-900">{formatStatDate(stats?.latestReviewAt ?? null)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Sales basis</span>
                      <span className="font-medium text-gray-900">Delivered orders only</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          </div>
        </div>

        {/* Footer — modal only; page actions live in the header */}
        {!isPageLayout && (
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  )
}
