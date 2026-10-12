import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  LogOut,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Store,
  X,
  XCircle,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import MyStoreSetupPanel from '../../components/admin/MyStoreSetupPanel'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { supabase } from '../../lib/supabase'

interface VerificationChecklist {
  identity_business?: boolean
  formula_safety?: boolean
  claims_accuracy?: boolean
  packaging?: boolean
  docs_reviewed?: boolean
}

interface PartnerApplicationRow {
  id: string
  company_name: string
  business_type: string
  website: string
  founded_year: number | null
  company_size: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_role: string
  product_categories: string[]
  product_description: string
  certifications: string[]
  testing_methods: string[]
  ingredients_policy: string
  packaging_sustainability: string
  wholesale_margin: string
  minimum_order: string
  lead_time: string
  shipping_locations: string[]
  why_partner: string
  other_info: string
  terms_accepted: boolean
  terms_accepted_at: string | null
  status: 'submitted' | 'in_review' | 'needs_info' | 'approved' | 'rejected'
  review_notes: string
  verification_checklist: VerificationChecklist
  slug: string | null
  reviewed_by_staff_id: string | null
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
}

interface PartnerApplicationDocument {
  id: string
  application_id: string
  document_type: 'business_license' | 'certifications' | 'lab_reports'
  file_name: string
  storage_path: string
  mime_type: string
  file_size: number
  uploaded_at: string
}

const CHECKLIST_ITEMS: { key: keyof VerificationChecklist; label: string }[] = [
  { key: 'identity_business', label: 'Business identity & license verified' },
  { key: 'formula_safety', label: 'Formula safety & testing methods reviewed' },
  { key: 'claims_accuracy', label: 'Claims accuracy checked against evidence' },
  { key: 'packaging', label: 'Packaging & sustainability standards reviewed' },
  { key: 'docs_reviewed', label: 'Uploaded documents reviewed' },
]

const DOC_TYPE_LABELS: Record<PartnerApplicationDocument['document_type'], string> = {
  business_license: 'Business license',
  certifications: 'Certifications',
  lab_reports: 'Lab / testing reports',
}

const emptyChecklist = (): VerificationChecklist => ({
  identity_business: false,
  formula_safety: false,
  claims_accuracy: false,
  packaging: false,
  docs_reviewed: false,
})

const isChecklistComplete = (checklist: VerificationChecklist) =>
  CHECKLIST_ITEMS.every((item) => Boolean(checklist[item.key]))

interface PartnerStoreRow {
  id: string
  application_id: string | null
  slug: string
  tenant_type: 'flagship' | 'partner'
  display_name: string
  legal_name: string
  primary_email: string
  status: 'pending' | 'active' | 'suspended' | 'closed'
  approval_status: 'pending' | 'approved' | 'rejected'
  commission_rate: number
  branding_json: Record<string, unknown>
  settings_json: Record<string, unknown>
  master_admin_email: string | null
  master_admin_user_id: string | null
  approved_by_staff_id: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

type ApplicationFilter = 'all' | PartnerApplicationRow['status']
type MarketplaceSection = 'applications' | 'stores' | 'store_setup'
type SaveAction = 'review' | 'approve' | 'reject' | 'needs_info' | 'checklist' | null

const STATUS_LABELS: Record<PartnerApplicationRow['status'], string> = {
  submitted: 'Submitted',
  in_review: 'In review',
  needs_info: 'Needs info',
  approved: 'Approved',
  rejected: 'Rejected',
}

const STATUS_CLASSES: Record<PartnerApplicationRow['status'], string> = {
  submitted: 'bg-sky-100 text-sky-700 border-sky-200',
  in_review: 'bg-amber-100 text-amber-700 border-amber-200',
  needs_info: 'bg-orange-100 text-orange-700 border-orange-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
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
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) {
      return message
    }
  }

  return fallback
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

export default function PartnerApplications() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasAnyPermission: hasAdminAnyPermission } = useAdminAccess()
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [pageSuccess, setPageSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slugInput, setSlugInput] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [checklist, setChecklist] = useState<VerificationChecklist>(emptyChecklist())
  const [documents, setDocuments] = useState<PartnerApplicationDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [savingAction, setSavingAction] = useState<SaveAction>(null)
  const [activeSection, setActiveSection] = useState<MarketplaceSection>('stores')
  const [sectionInitialized, setSectionInitialized] = useState(false)
  const [stores, setStores] = useState<PartnerStoreRow[]>([])
  const [storesLoading, setStoresLoading] = useState(true)
  const [storesError, setStoresError] = useState('')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [recentOrders, setRecentOrders] = useState<HeaderOrder[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  const loadApplications = useCallback(async (preferredId?: string | null) => {
    setLoading(true)
    setPageError('')

    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const rows = (data ?? []) as PartnerApplicationRow[]
      setApplications(rows)

      if (rows.length === 0) {
        setSelectedId(null)
        return
      }

      if (preferredId && rows.some((row) => row.id === preferredId)) {
        setSelectedId(preferredId)
        return
      }

      setSelectedId((current) => {
        if (current && rows.some((row) => row.id === current)) {
          return current
        }

        return rows[0]?.id ?? null
      })
    } catch (error) {
      console.error('Failed to load partner applications:', error)
      setPageError(getErrorMessage(error, 'Failed to load partner applications'))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStores = useCallback(async () => {
    setStoresLoading(true)
    setStoresError('')

    try {
      const { data, error } = await supabase
        .from('partner_stores')
        .select('*')
        .order('display_name', { ascending: true })

      if (error) throw error
      setStores((data ?? []) as PartnerStoreRow[])
    } catch (error) {
      console.error('Failed to load partner stores:', error)
      setStoresError(getErrorMessage(error, 'Failed to load partner stores'))
    } finally {
      setStoresLoading(false)
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

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications()
      void loadStores()
      void fetchUserName()
      void fetchOrdersForNotifications()
    })
  }, [loadApplications, loadStores, fetchUserName, fetchOrdersForNotifications])

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter
      if (!matchesStatus) return false

      if (!query) return true

      return [
        application.company_name,
        application.contact_name,
        application.contact_email,
        application.business_type,
        application.slug ?? '',
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [applications, searchQuery, statusFilter])

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) ?? null,
    [applications, selectedId],
  )

  useEffect(() => {
    queueMicrotask(() => {
      if (!filteredApplications.length) {
        if (selectedId !== null) {
          setSelectedId(null)
        }

        return
      }

      if (!selectedId || !filteredApplications.some((application) => application.id === selectedId)) {
        setSelectedId(filteredApplications[0].id)
      }
    })
  }, [filteredApplications, selectedId])

  useEffect(() => {
    queueMicrotask(() => {
      if (!selectedApplication) {
        setSlugInput('')
        setReviewNotes('')
        setChecklist(emptyChecklist())
        setDocuments([])
        return
      }

      setSlugInput(selectedApplication.slug ?? slugifyPreview(selectedApplication.company_name))
      setReviewNotes(selectedApplication.review_notes ?? '')
      setChecklist({
        ...emptyChecklist(),
        ...(selectedApplication.verification_checklist ?? {}),
      })
    })
  }, [selectedApplication])

  useEffect(() => {
    const applicationId = selectedApplication?.id
    if (!applicationId) {
      setDocuments([])
      return
    }

    let cancelled = false

    const loadDocuments = async () => {
      setDocumentsLoading(true)
      try {
        const { data, error } = await supabase
          .from('partner_application_documents')
          .select('*')
          .eq('application_id', applicationId)
          .order('uploaded_at', { ascending: true })

        if (error) throw error
        if (!cancelled) {
          setDocuments((data ?? []) as PartnerApplicationDocument[])
        }
      } catch (error) {
        console.error('Failed to load partner application documents:', error)
        if (!cancelled) {
          setDocuments([])
        }
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [selectedApplication?.id])

  const canManagePartnerStores = hasAdminAnyPermission(['partners.provision', 'partners.manage', 'roles.manage'])

  const filteredStores = useMemo(() => {
    const query = partnerSearch.trim().toLowerCase()
    if (!query) return stores
    return stores.filter((store) =>
      [
        store.display_name,
        store.legal_name,
        store.primary_email,
        store.slug,
        store.master_admin_email ?? '',
        store.status,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [partnerSearch, stores])

  const partnersCount = stores.length
  const pendingReviewCount = useMemo(
    () =>
      applications.filter((application) =>
        application.status === 'submitted' ||
        application.status === 'in_review' ||
        application.status === 'needs_info'
      ).length,
    [applications],
  )
  const applicationsBadgeCount = pendingReviewCount > 0 ? pendingReviewCount : applications.length

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'setup' || tab === 'store_setup') {
      setActiveSection('store_setup')
      setSectionInitialized(true)
      return
    }
    if (sectionInitialized || storesLoading || loading) return
    if (partnersCount > 0) {
      setActiveSection('stores')
    } else if (applications.length > 0) {
      setActiveSection('applications')
    } else {
      setActiveSection('stores')
    }
    setSectionInitialized(true)
  }, [sectionInitialized, storesLoading, loading, partnersCount, applications.length, searchParams])

  const selectSection = (section: MarketplaceSection) => {
    setActiveSection(section)
    if (section === 'store_setup') {
      setSearchParams({ tab: 'setup' }, { replace: true })
    } else if (searchParams.has('tab')) {
      setSearchParams({}, { replace: true })
    }
  }

  const handleMoveToReview = async () => {
    if (!selectedApplication) return

    setSavingAction('review')
    setPageError('')
    setPageSuccess('')

    try {
      const { data, error } = await supabase.rpc('mark_partner_application_in_review', {
        application_id: selectedApplication.id,
        p_review_notes: reviewNotes.trim() || null,
      })

      if (error) throw error

      const result = data as { status?: string } | null
      setPageSuccess(`Moved ${selectedApplication.company_name}${result?.status ? ` (${result.status})` : ''} into review.`)
      await loadApplications(selectedApplication.id)
    } catch (error) {
      console.error('Failed to mark partner application as in review:', error)
      setPageError(getErrorMessage(error, 'Failed to mark partner application as in review'))
    } finally {
      setSavingAction(null)
    }
  }

  const handleSaveChecklist = async () => {
    if (!selectedApplication) return

    setSavingAction('checklist')
    setPageError('')
    setPageSuccess('')

    try {
      const { error } = await supabase.rpc('save_partner_verification_checklist', {
        application_id: selectedApplication.id,
        p_checklist: checklist,
      })

      if (error) throw error

      setPageSuccess(`Saved verification checklist for ${selectedApplication.company_name}.`)
      await loadApplications(selectedApplication.id)
    } catch (error) {
      console.error('Failed to save verification checklist:', error)
      setPageError(getErrorMessage(error, 'Failed to save verification checklist'))
    } finally {
      setSavingAction(null)
    }
  }

  const handleNeedsInfo = async () => {
    if (!selectedApplication) return

    if (!reviewNotes.trim()) {
      setPageError('Add review notes explaining what information is still needed.')
      return
    }

    setSavingAction('needs_info')
    setPageError('')
    setPageSuccess('')

    try {
      const { data, error } = await supabase.rpc('mark_partner_application_needs_info', {
        application_id: selectedApplication.id,
        p_review_notes: reviewNotes.trim(),
      })

      if (error) throw error

      const result = data as { status?: string } | null
      setPageSuccess(`Marked ${selectedApplication.company_name} as needs info${result?.status ? ` (${result.status})` : ''}.`)
      await loadApplications(selectedApplication.id)
    } catch (error) {
      console.error('Failed to mark partner application as needs info:', error)
      setPageError(getErrorMessage(error, 'Failed to mark partner application as needs info'))
    } finally {
      setSavingAction(null)
    }
  }

  const handleApprove = async () => {
    if (!selectedApplication) return

    if (!isChecklistComplete(checklist)) {
      setPageError('Complete the verification checklist before approving.')
      return
    }

    if (!documents.some((doc) => doc.document_type === 'business_license')) {
      setPageError('A business license document is required before approval.')
      return
    }

    setSavingAction('approve')
    setPageError('')
    setPageSuccess('')

    try {
      const { data, error } = await supabase.rpc('approve_partner_application', {
        application_id: selectedApplication.id,
        slug_override: slugInput.trim() || null,
        p_review_notes: reviewNotes.trim() || null,
        p_verification_checklist: checklist,
      })

      if (error) throw error

      const result = data as { slug?: string } | null
      const approvedSlug = result?.slug ?? slugInput.trim() ?? selectedApplication.slug ?? slugifyPreview(selectedApplication.company_name)
      setPageSuccess(`Approved ${selectedApplication.company_name} and provisioned verified store slug ${approvedSlug}.`)
      await loadApplications(selectedApplication.id)
      await loadStores()
    } catch (error) {
      console.error('Failed to approve partner application:', error)
      setPageError(getErrorMessage(error, 'Failed to approve partner application'))
    } finally {
      setSavingAction(null)
    }
  }

  const handleReject = async () => {
    if (!selectedApplication) return

    setSavingAction('reject')
    setPageError('')
    setPageSuccess('')

    try {
      const { data, error } = await supabase.rpc('reject_partner_application', {
        application_id: selectedApplication.id,
        p_review_notes: reviewNotes.trim() || null,
      })

      if (error) throw error

      const result = data as { status?: string } | null
      setPageSuccess(`Rejected ${selectedApplication.company_name}${result?.status ? ` (${result.status})` : ''}.`)
      await loadApplications(selectedApplication.id)
    } catch (error) {
      console.error('Failed to reject partner application:', error)
      setPageError(getErrorMessage(error, 'Failed to reject partner application'))
    } finally {
      setSavingAction(null)
    }
  }

  const openDocument = async (doc: PartnerApplicationDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .createSignedUrl(doc.storage_path, 60 * 10)

      if (error) throw error
      if (!data?.signedUrl) throw new Error('Could not create a signed URL for this document.')

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to open partner document:', error)
      setPageError(getErrorMessage(error, 'Failed to open document'))
    }
  }

  const openPartnerEditor = (id?: string) => {
    navigate(id ? `/partners/${id}` : '/partners/new')
  }

  const sectionTabs: {
    key: MarketplaceSection
    label: string
    count?: number
    emptyLabel?: string
    allowEmpty: boolean
  }[] = [
    {
      key: 'stores',
      label: 'Partner stores',
      count: partnersCount,
      emptyLabel: 'No partner stores yet',
      allowEmpty: true,
    },
    {
      key: 'applications',
      label: 'Application review',
      count: applicationsBadgeCount,
      emptyLabel: 'No applications yet',
      allowEmpty: false,
    },
    {
      key: 'store_setup',
      label: 'My Store setup',
      allowEmpty: true,
    },
  ]

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Partner Stores</h1>
              <p className="text-[11px] text-gray-500">Partner stores, applications, and CareCraftz store setup.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeSection !== 'store_setup' ? (
                <button
                  type="button"
                  onClick={() => openPartnerEditor()}
                  disabled={!canManagePartnerStores}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New partner
                </button>
              ) : null}

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
          {pageError ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">{pageError}</p>
            </div>
          ) : null}

          {pageSuccess ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">{pageSuccess}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E8E0D4] pb-2">
            {sectionTabs.map((tab) => {
              const hasCount = typeof tab.count === 'number'
              const isEmpty = hasCount && tab.count === 0
              const isDisabled = Boolean(isEmpty && !tab.allowEmpty)
              const isActive = activeSection === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={isDisabled}
                  title={isEmpty ? tab.emptyLabel : undefined}
                  onClick={() => {
                    if (!isDisabled) selectSection(tab.key)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                    isDisabled
                      ? 'border-transparent bg-transparent text-gray-400 cursor-not-allowed opacity-45'
                      : isActive
                        ? 'border-indigo-300 bg-indigo-600 text-white'
                        : isEmpty
                          ? 'border-[#E8E0D4] bg-[#F0E9DC]/60 text-gray-400'
                          : 'border-[#D9D0C2] bg-white text-gray-600 hover:bg-[#F0E9DC]'
                  }`}
                >
                  {tab.label}
                  {hasCount ? (
                    tab.count! > 0 ? (
                      <span
                        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tab.count}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-medium ${isActive ? 'text-white/70' : 'text-gray-400'}`}>0</span>
                    )
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className={activeSection === 'applications' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-3">
            <section className="bg-white rounded-xl border border-[#D9D0C2] overflow-hidden">
              <div className="p-3 border-b border-[#E8E0D4] space-y-2.5 bg-[#F7F2E8]/40">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search company, email, or slug"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white pl-8 pr-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {(['all', 'submitted', 'in_review', 'needs_info', 'approved', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                        statusFilter === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-[#D9D0C2] text-gray-600 hover:bg-[#F7F2E8]'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {status === 'all' ? 'All' : STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-xs text-gray-500">Loading partner applications…</div>
                ) : filteredApplications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No partner applications match the current filters.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0E9DC]">
                    {filteredApplications.map((application) => {
                      const isSelected = application.id === selectedId

                      return (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedId(application.id)}
                          className={`w-full text-left px-3 py-3 transition-colors ${
                            isSelected ? 'bg-indigo-50/70' : 'hover:bg-[#F7F2E8]/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{application.company_name}</h3>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[application.status]}`}>
                                  {STATUS_LABELS[application.status]}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{application.contact_name} · {application.contact_email}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Globe className="w-3.5 h-3.5" />
                                <span>{application.website}</span>
                              </div>
                              {application.slug ? (
                                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                  <Store className="w-3.5 h-3.5" /> /{application.slug}
                                </div>
                              ) : null}
                            </div>
                            <ArrowUpRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-[#D9D0C2] overflow-hidden">
              {selectedApplication ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#F7F2E8]/40 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-900">{selectedApplication.company_name}</h2>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[selectedApplication.status]}`}>
                            {STATUS_LABELS[selectedApplication.status]}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> {selectedApplication.contact_email}</span>
                          <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {selectedApplication.contact_phone}</span>
                          <a href={selectedApplication.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700">
                            Visit website <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">Current slug</div>
                      <div className="mt-1 font-mono text-xs">{selectedApplication.slug ? `/${selectedApplication.slug}` : 'Pending approval'}</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailField label="Business type" value={selectedApplication.business_type} />
                      <DetailField label="Company size" value={selectedApplication.company_size} />
                      <DetailField label="Founded year" value={selectedApplication.founded_year?.toString() ?? '—'} />
                      <DetailField label="Contact role" value={selectedApplication.contact_role} />
                      <DetailField label="Lead time" value={selectedApplication.lead_time} />
                      <DetailField label="Wholesale margin" value={selectedApplication.wholesale_margin} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DataBlock label="Product categories" values={selectedApplication.product_categories} />
                      <DataBlock label="Certifications" values={selectedApplication.certifications} />
                      <DataBlock label="Testing methods" values={selectedApplication.testing_methods} />
                      <DataBlock label="Shipping locations" values={selectedApplication.shipping_locations} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <TextBlock label="Product description" value={selectedApplication.product_description} />
                      <TextBlock label="Ingredients policy" value={selectedApplication.ingredients_policy} />
                      <TextBlock label="Packaging sustainability" value={selectedApplication.packaging_sustainability} />
                      <TextBlock label="Why they want to partner" value={selectedApplication.why_partner} />
                      <TextBlock label="Other information" value={selectedApplication.other_info || '—'} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                        <FileText className="w-4 h-4 text-indigo-600" /> Uploaded documents
                      </div>
                      {documentsLoading ? (
                        <p className="text-sm text-slate-500">Loading documents...</p>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => void openDocument(doc)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{DOC_TYPE_LABELS[doc.document_type]}</p>
                                <p className="text-xs text-slate-500">{doc.file_name}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" /> Verification checklist
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleSaveChecklist()}
                          disabled={savingAction !== null || selectedApplication.status === 'approved'}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {savingAction === 'checklist' ? 'Saving...' : 'Save checklist'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {CHECKLIST_ITEMS.map((item) => (
                          <label key={item.key} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(checklist[item.key])}
                              disabled={selectedApplication.status === 'approved'}
                              onChange={(event) =>
                                setChecklist((current) => ({
                                  ...current,
                                  [item.key]: event.target.checked,
                                }))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-slate-300"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                      {!isChecklistComplete(checklist) && selectedApplication.status !== 'approved' ? (
                        <p className="mt-3 text-xs text-amber-700">All checklist items must be complete before approval.</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Provisioned store slug</label>
                        <input
                          value={slugInput}
                          onChange={(event) => setSlugInput(event.target.value)}
                          placeholder={slugifyPreview(selectedApplication.company_name)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          This becomes the store’s public tenant key. Leave it as-is to use the suggested slug.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Review notes</label>
                        <textarea
                          value={reviewNotes}
                          onChange={(event) => setReviewNotes(event.target.value)}
                          rows={4}
                          placeholder="Add approval notes, compliance checks, needs-info requests, or rejection reasons here..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <DetailField label="Submitted at" value={formatDateTime(selectedApplication.created_at)} />
                      <DetailField label="Terms accepted" value={selectedApplication.terms_accepted ? 'Yes' : 'No'} />
                      <DetailField label="Accepted at" value={formatDateTime(selectedApplication.terms_accepted_at)} />
                      <DetailField label="Reviewed at" value={formatDateTime(selectedApplication.reviewed_at)} />
                      <DetailField label="Approved at" value={formatDateTime(selectedApplication.approved_at)} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" /> What approval does
                      </div>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Requires a complete verification checklist and business license</li>
                        <li>Creates an active verified partner store</li>
                        <li>Reserves the slug as the tenant identifier</li>
                        <li>Stamps verified_at for storefront trust badges</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-6 bg-white">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                      <button
                        type="button"
                        onClick={handleMoveToReview}
                        disabled={savingAction !== null || selectedApplication.status === 'approved'}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAction === 'review' ? 'Updating...' : <><ShieldCheck className="w-4 h-4" /> Move to review</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleNeedsInfo()}
                        disabled={savingAction !== null || selectedApplication.status === 'approved'}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAction === 'needs_info' ? 'Updating...' : <><AlertTriangle className="w-4 h-4" /> Needs info</>}
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={savingAction !== null || selectedApplication.status === 'approved'}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAction === 'reject' ? 'Rejecting...' : <><XCircle className="w-4 h-4" /> Reject</>}
                      </button>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={savingAction !== null || selectedApplication.status === 'approved' || !isChecklistComplete(checklist)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAction === 'approve' ? 'Approving...' : <><BadgeCheck className="w-4 h-4" /> Approve & provision store</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex h-full items-center justify-center p-12 text-slate-500">Loading selected application...</div>
              ) : (
                <div className="flex h-full items-center justify-center p-12 text-slate-500">
                  Select an application to inspect its full details.
                </div>
              )}
            </section>
          </div>
          </div>

          <div className={activeSection === 'stores' ? 'block space-y-3' : 'hidden'}>
            {storesError ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">{storesError}</p>
              </div>
            ) : null}

            <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#E8E0D4] bg-[#F7F2E8]/50">
                <div className="relative max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(event) => setPartnerSearch(event.target.value)}
                    placeholder="Search partners by name, email, slug…"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D9D0C2] rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E0D4] bg-[#F7F2E8]/40">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">Loading partners…</td>
                      </tr>
                    ) : filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                          {stores.length === 0 ? 'No partners yet. Create the first partner store.' : 'No partners match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((store) => (
                        <tr
                          key={store.id}
                          tabIndex={0}
                          onClick={() => openPartnerEditor(store.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openPartnerEditor(store.id)
                            }
                          }}
                          className="group border-b border-[#F0E9DC] last:border-0 cursor-pointer hover:bg-[#F7F2E8]/70 transition-colors focus:bg-[#F7F2E8] focus:outline-none"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <Store className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 truncate">{store.display_name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{store.legal_name || store.tenant_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-mono text-gray-600">/{store.slug}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs text-gray-700 truncate max-w-[12rem]">{store.primary_email}</p>
                            {store.master_admin_email ? (
                              <p className="text-[10px] text-gray-400 truncate max-w-[12rem]">Admin: {store.master_admin_email}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${
                              store.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : store.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {store.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs capitalize text-gray-600">{store.approval_status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-xs font-semibold text-gray-900">{Number(store.commission_rate || 0)}%</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={activeSection === 'store_setup' ? 'block' : 'hidden'}>
            <MyStoreSetupPanel />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

function DataBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>
    </div>
  )
}
