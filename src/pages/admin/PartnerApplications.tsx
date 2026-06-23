import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Store,
  XCircle,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

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
  slug: string | null
  reviewed_by_staff_id: string | null
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
}

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
  approved_by_staff_id: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

type ApplicationFilter = 'all' | PartnerApplicationRow['status']
type MarketplaceSection = 'applications' | 'stores'
type SaveAction = 'review' | 'approve' | 'reject' | null
type StoreSaveAction = 'create' | 'update' | null

interface StoreFormState {
  slug: string
  displayName: string
  legalName: string
  primaryEmail: string
  ownerInviteEmail: string
  status: PartnerStoreRow['status']
  approvalStatus: PartnerStoreRow['approval_status']
  commissionRate: string
}

interface ProvisionStoreResult {
  partner_store_id?: string
  slug?: string
  display_name?: string
  legal_name?: string
  primary_email?: string
  tenant_type?: string
  status?: string
  approval_status?: string
  invite_id?: string | null
  invite_url?: string | null
}

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

const emptyStoreForm = (): StoreFormState => ({
  slug: '',
  displayName: '',
  legalName: '',
  primaryEmail: '',
  ownerInviteEmail: '',
  status: 'active',
  approvalStatus: 'approved',
  commissionRate: '0',
})

const storeFormFromRow = (store: PartnerStoreRow): StoreFormState => ({
  slug: store.slug,
  displayName: store.display_name,
  legalName: store.legal_name,
  primaryEmail: store.primary_email,
  ownerInviteEmail: '',
  status: store.status,
  approvalStatus: store.approval_status,
  commissionRate: String(store.commission_rate ?? 0),
})

export default function PartnerApplications() {
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [pageSuccess, setPageSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slugInput, setSlugInput] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [savingAction, setSavingAction] = useState<SaveAction>(null)
  const [activeSection, setActiveSection] = useState<MarketplaceSection>('applications')
  const [stores, setStores] = useState<PartnerStoreRow[]>([])
  const [storesLoading, setStoresLoading] = useState(true)
  const [storesError, setStoresError] = useState('')
  const [storesSuccess, setStoresSuccess] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storeForm, setStoreForm] = useState<StoreFormState>(emptyStoreForm())
  const [storeSavingAction, setStoreSavingAction] = useState<StoreSaveAction>(null)
  const [createdInviteUrl, setCreatedInviteUrl] = useState('')

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
      setPageError(error instanceof Error ? error.message : 'Failed to load partner applications')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStores = useCallback(async (preferredId?: string | null) => {
    setStoresLoading(true)
    setStoresError('')

    try {
      const { data, error } = await supabase
        .from('partner_stores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const rows = (data ?? []) as PartnerStoreRow[]
      setStores(rows)

      const nextStore = preferredId
        ? rows.find((store) => store.id === preferredId) ?? null
        : rows[0] ?? null

      if (!nextStore) {
        setSelectedStoreId(null)
        setStoreForm(emptyStoreForm())
        return
      }

      setSelectedStoreId(nextStore.id)
      setStoreForm(storeFormFromRow(nextStore))
    } catch (error) {
      console.error('Failed to load partner stores:', error)
      setStoresError(error instanceof Error ? error.message : 'Failed to load partner stores')
    } finally {
      setStoresLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications()
    })
  }, [loadApplications])

  useEffect(() => {
    queueMicrotask(() => {
      void loadStores()
    })
  }, [loadStores])

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
        return
      }

      setSlugInput(selectedApplication.slug ?? slugifyPreview(selectedApplication.company_name))
      setReviewNotes(selectedApplication.review_notes ?? '')
    })
  }, [selectedApplication])

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  )

  const metrics = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter((application) => application.status === 'submitted').length,
      inReview: applications.filter((application) => application.status === 'in_review').length,
      needsInfo: applications.filter((application) => application.status === 'needs_info').length,
      approved: applications.filter((application) => application.status === 'approved').length,
    }
  }, [applications])

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
      setPageError(error instanceof Error ? error.message : 'Failed to mark partner application as in review')
    } finally {
      setSavingAction(null)
    }
  }

  const handleApprove = async () => {
    if (!selectedApplication) return

    setSavingAction('approve')
    setPageError('')
    setPageSuccess('')

    try {
      const { data, error } = await supabase.rpc('approve_partner_application', {
        application_id: selectedApplication.id,
        slug_override: slugInput.trim() || null,
        p_review_notes: reviewNotes.trim() || null,
      })

      if (error) throw error

      const result = data as { slug?: string } | null
      const approvedSlug = result?.slug ?? slugInput.trim() ?? selectedApplication.slug ?? slugifyPreview(selectedApplication.company_name)
      setPageSuccess(`Approved ${selectedApplication.company_name} and provisioned store slug ${approvedSlug}.`)
      await loadApplications(selectedApplication.id)
    } catch (error) {
      console.error('Failed to approve partner application:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to approve partner application')
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
      setPageError(error instanceof Error ? error.message : 'Failed to reject partner application')
    } finally {
      setSavingAction(null)
    }
  }

  const startNewStoreDraft = () => {
    setSelectedStoreId(null)
    setStoreForm(emptyStoreForm())
    setCreatedInviteUrl('')
    setStoresError('')
    setStoresSuccess('')
    setActiveSection('stores')
  }

  const selectStoreForEdit = (store: PartnerStoreRow) => {
    setSelectedStoreId(store.id)
    setStoreForm(storeFormFromRow(store))
    setCreatedInviteUrl('')
    setStoresError('')
    setStoresSuccess('')
    setActiveSection('stores')
  }

  const handleSaveStore = async () => {
    const normalizedSlug = slugifyPreview(storeForm.slug || storeForm.displayName || 'partner-store')
    const displayName = storeForm.displayName.trim()
    const legalName = storeForm.legalName.trim()
    const primaryEmail = storeForm.primaryEmail.trim().toLowerCase()
    const ownerEmail = storeForm.ownerInviteEmail.trim().toLowerCase()
    const commissionRate = Number.parseFloat(storeForm.commissionRate)

    if (!displayName) {
      setStoresError('Display name is required.')
      return
    }

    if (!legalName) {
      setStoresError('Legal name is required.')
      return
    }

    if (!primaryEmail) {
      setStoresError('Primary email is required.')
      return
    }

    setStoresError('')
    setStoresSuccess('')
    setCreatedInviteUrl('')

    if (selectedStoreId) {
      setStoreSavingAction('update')

      try {
        const { data, error } = await supabase
          .from('partner_stores')
          .update({
            slug: normalizedSlug,
            display_name: displayName,
            legal_name: legalName,
            primary_email: primaryEmail,
            status: storeForm.status,
            approval_status: storeForm.approvalStatus,
            commission_rate: Number.isFinite(commissionRate) ? commissionRate : 0,
          })
          .eq('id', selectedStoreId)
          .select('*')
          .maybeSingle()

        if (error) throw error

        if (!data?.id) {
          throw new Error('No partner store record was updated.')
        }

        const updatedStore = data as PartnerStoreRow
        setStoresSuccess(`Updated /org/${updatedStore.slug}.`)
        setSelectedStoreId(updatedStore.id)
        setStoreForm(storeFormFromRow(updatedStore))
        await loadStores(updatedStore.id)
      } catch (error) {
        console.error('Failed to update partner store:', error)
        setStoresError(error instanceof Error ? error.message : 'Failed to update partner store')
      } finally {
        setStoreSavingAction(null)
      }

      return
    }

    setStoreSavingAction('create')

    try {
      const { data, error } = await supabase.rpc('provision_partner_store', {
        target_slug: normalizedSlug,
        display_name: displayName,
        legal_name: legalName,
        primary_email: primaryEmail,
        owner_email: ownerEmail || null,
        invite_role_code: 'store_owner',
        tenant_type: 'partner',
        status: storeForm.status,
        approval_status: storeForm.approvalStatus,
        commission_rate: Number.isFinite(commissionRate) ? commissionRate : 0,
        branding_json: {},
        settings_json: {},
      })

      if (error) throw error

      const result = data as ProvisionStoreResult | null
      const createdSlug = result?.slug ?? normalizedSlug
      const createdStoreId = result?.partner_store_id ?? null

      setStoresSuccess(result?.invite_url
        ? `Created /org/${createdSlug} and generated an owner invite link.`
        : `Created /org/${createdSlug}.`)
      setCreatedInviteUrl(result?.invite_url ?? '')

      if (createdStoreId) {
        await loadStores(createdStoreId)
      } else {
        await loadStores()
      }

      setStoreForm((current) => ({
        ...current,
        ownerInviteEmail: '',
      }))
      setActiveSection('stores')
    } catch (error) {
      console.error('Failed to create partner store:', error)
      setStoresError(error instanceof Error ? error.message : 'Failed to create partner store')
    } finally {
      setStoreSavingAction(null)
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="px-8 py-8 border-b border-slate-200 bg-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                <Store className="w-3.5 h-3.5" /> Partner Marketplace
              </div>
              <h1 className="text-3xl font-semibold text-slate-900">Partner marketplace</h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Review incoming partner applications, or jump into store setup to create a partner slug directly and manage the tenant record from the master control plane.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard icon={FileText} label="Total" value={metrics.total} tone="bg-slate-900 text-white" />
              <MetricCard icon={Clock3} label="Submitted" value={metrics.submitted} tone="bg-sky-50 text-sky-700" />
              <MetricCard icon={ShieldCheck} label="In review" value={metrics.inReview} tone="bg-amber-50 text-amber-700" />
              <MetricCard icon={BadgeCheck} label="Approved" value={metrics.approved} tone="bg-emerald-50 text-emerald-700" />
              <MetricCard icon={AlertTriangle} label="Needs info" value={metrics.needsInfo} tone="bg-orange-50 text-orange-700" />
            </div>
          </div>
        </div>

        <div className="px-8 py-8 space-y-6">
          {pageError ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{pageError}</p>
            </div>
          ) : null}

          {pageSuccess ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{pageSuccess}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('applications')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeSection === 'applications'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Application review
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('stores')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeSection === 'stores'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Store setup
            </button>
          </div>

          <div className={activeSection === 'applications' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search company, email, or slug"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['all', 'submitted', 'in_review', 'needs_info', 'approved', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {status === 'all' ? 'All' : STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">Loading partner applications...</div>
                ) : filteredApplications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No partner applications match the current filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredApplications.map((application) => {
                      const isSelected = application.id === selectedId

                      return (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedId(application.id)}
                          className={`w-full text-left px-4 py-4 transition-colors ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
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
                                  <Store className="w-3.5 h-3.5" /> /org/{application.slug}
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

            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {selectedApplication ? (
                <div className="h-full flex flex-col">
                  <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold text-slate-900">{selectedApplication.company_name}</h2>
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
                      <div className="mt-1 font-mono text-xs">{selectedApplication.slug ? `/org/${selectedApplication.slug}` : 'Pending approval'}</div>
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
                          placeholder="Add approval notes, compliance checks, or rejection reasons here..."
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
                        <li>Creates the partner store record</li>
                        <li>Reserves the slug as the tenant identifier</li>
                        <li>Marks the application as approved for audit purposes</li>
                        <li>Sets us up to invite the partner owner into their own store</li>
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
                        onClick={handleReject}
                        disabled={savingAction !== null || selectedApplication.status === 'approved'}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAction === 'reject' ? 'Rejecting...' : <><XCircle className="w-4 h-4" /> Reject</>}
                      </button>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={savingAction !== null || selectedApplication.status === 'approved'}
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

          <div className={activeSection === 'stores' ? 'block' : 'hidden'}>
            {storesError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{storesError}</p>
              </div>
            ) : null}

            {storesSuccess ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p>{storesSuccess}</p>
                  {createdInviteUrl ? (
                    <Link to={createdInviteUrl} className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50">
                      Open owner invite <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
              <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Partner stores</h2>
                      <p className="mt-1 text-sm text-slate-500">Create a store slug and keep its public tenant record in sync.</p>
                    </div>
                    <button
                      type="button"
                      onClick={startNewStoreDraft}
                      className="rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-black"
                    >
                      New store
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                      <div className="font-semibold text-slate-500 uppercase tracking-[0.18em]">Total</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{stores.length}</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2.5">
                      <div className="font-semibold text-emerald-700 uppercase tracking-[0.18em]">Active</div>
                      <div className="mt-1 text-lg font-bold text-emerald-900">{stores.filter((store) => store.status === 'active').length}</div>
                    </div>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {storesLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading partner stores...</div>
                  ) : stores.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No partner stores yet. Use the form on the right to create your first slug.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {stores.map((store) => {
                        const isSelected = store.id === selectedStoreId

                        return (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => selectStoreForEdit(store)}
                            className={`w-full text-left px-4 py-4 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">{store.display_name}</h3>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${store.status === 'active' ? 'bg-emerald-100 text-emerald-700' : store.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {store.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{store.primary_email}</p>
                                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                  <Store className="w-3.5 h-3.5" /> /org/{store.slug}
                                </div>
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

              <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {selectedStore ? `Edit /org/${selectedStore.slug}` : 'Create a partner store'}
                      </h2>
                      {selectedStore ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {selectedStore.approval_status}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedStore ? 'Update the slug or tenant metadata for an existing partner store.' : 'Create your own slug, optional owner invite, and a partner tenant record.'}
                    </p>
                  </div>

                  {selectedStore ? (
                    <Link
                      to={`/org/${selectedStore.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Open tenant portal <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : null}
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> Slug-based partner setup
                    </div>
                    <p>
                      The slug becomes the public tenant key for /org/:slug. If you provide an owner email, the master admin flow will also generate the first invite link so you can claim the tenant immediately.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Store slug</label>
                      <input
                        value={storeForm.slug}
                        onChange={(event) => setStoreForm((current) => ({ ...current, slug: event.target.value }))}
                        placeholder="my-partner-store"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">Normalized to a safe slug automatically. The final tenant URL becomes /org/slug.</p>
                      <p className="mt-1 text-xs font-medium text-slate-700">
                        Preview: <span className="font-mono">/org/{slugifyPreview(storeForm.slug || storeForm.displayName || 'partner-store')}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Display name</label>
                      <input
                        value={storeForm.displayName}
                        onChange={(event) => setStoreForm((current) => ({ ...current, displayName: event.target.value }))}
                        placeholder="Partner store name"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Legal name</label>
                      <input
                        value={storeForm.legalName}
                        onChange={(event) => setStoreForm((current) => ({ ...current, legalName: event.target.value }))}
                        placeholder="Registered legal entity"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Primary email</label>
                      <input
                        value={storeForm.primaryEmail}
                        onChange={(event) => setStoreForm((current) => ({ ...current, primaryEmail: event.target.value }))}
                        placeholder="store@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Owner invite email (new store only)</label>
                      <input
                        value={storeForm.ownerInviteEmail}
                        disabled={selectedStoreId !== null}
                        onChange={(event) => setStoreForm((current) => ({ ...current, ownerInviteEmail: event.target.value }))}
                        placeholder="Optional invite email for the first owner"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Leave this blank if you only want to reserve the slug for now.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Commission rate</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={storeForm.commissionRate}
                        onChange={(event) => setStoreForm((current) => ({ ...current, commissionRate: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                      <select
                        value={storeForm.status}
                        onChange={(event) => setStoreForm((current) => ({ ...current, status: event.target.value as PartnerStoreRow['status'] }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Approval status</label>
                      <select
                        value={storeForm.approvalStatus}
                        onChange={(event) => setStoreForm((current) => ({ ...current, approvalStatus: event.target.value as PartnerStoreRow['approval_status'] }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                    {selectedStore ? (
                      <button
                        type="button"
                        onClick={startNewStoreDraft}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Create new store
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleSaveStore}
                      disabled={storeSavingAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {storeSavingAction === 'create'
                        ? 'Creating...'
                        : storeSavingAction === 'update'
                          ? 'Saving...'
                          : selectedStore
                            ? 'Save store'
                            : storeForm.ownerInviteEmail.trim()
                              ? 'Create store & invite owner'
                              : 'Create store'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  tone: string
}) {
  return (
    <div className={`rounded-2xl px-4 py-3 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
    </div>
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
