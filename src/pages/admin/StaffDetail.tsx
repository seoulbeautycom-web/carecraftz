import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  History,
  LogOut,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { ROLE_OPTIONS } from '../../lib/rbac'
import {
  callStaffAuthEdgeFunction,
  processStaffMember,
  type TeamMember,
} from '../../lib/staffMembers'

type DetailTab = 'account' | 'login' | 'changes'

interface AuditRow {
  id: string
  table_name: string
  record_id: string | null
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  performed_by: string | null
  performed_by_name: string | null
  performed_by_email: string | null
  performed_at: string
  ip_address: string | null
  user_agent: string | null
}

const SKIP_AUDIT_FIELDS = new Set(['updated_at', 'created_at', 'id', 'user_id', 'permissions'])

const formatWhen = (dateString: string) =>
  new Date(dateString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const formatFieldLabel = (key: string) =>
  key
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const buildChangeLines = (row: AuditRow) => {
  if (row.action === 'CREATE') {
    const name = (row.new_data?.full_name as string | undefined) ?? 'staff member'
    return [`Created account for ${name}`]
  }
  if (row.action === 'DELETE') {
    const name = (row.old_data?.full_name as string | undefined) ?? 'staff member'
    return [`Removed ${name}`]
  }

  if (row.table_name === 'staff_roles') {
    const oldRole = (row.old_data?.role_code as string | undefined) ?? null
    const newRole = (row.new_data?.role_code as string | undefined) ?? null
    if (oldRole && newRole && oldRole !== newRole) {
      return [`Role assignment: ${oldRole} → ${newRole}`]
    }
    if (newRole && !oldRole) return [`Assigned role: ${newRole}`]
    if (oldRole && !newRole) return [`Cleared role: ${oldRole}`]
  }

  if (row.old_data && row.new_data) {
    const lines: string[] = []
    const keys = new Set([...Object.keys(row.old_data), ...Object.keys(row.new_data)])
    for (const key of keys) {
      if (SKIP_AUDIT_FIELDS.has(key)) continue
      const before = row.old_data[key]
      const after = row.new_data[key]
      if (JSON.stringify(before) === JSON.stringify(after)) continue
      if (key === 'last_signed_in') continue
      lines.push(`${formatFieldLabel(key)}: ${formatValue(before)} → ${formatValue(after)}`)
    }
    if (lines.length > 0) return lines
  }

  return [`${row.action} on ${row.table_name}`]
}

const isLoginAudit = (row: AuditRow) => {
  if (row.action === 'LOGIN' || row.action === 'LOGOUT') return true
  if (row.table_name !== 'staff' || row.action !== 'UPDATE' || !row.old_data || !row.new_data) return false
  const before = row.old_data.last_signed_in
  const after = row.new_data.last_signed_in
  if (!after || JSON.stringify(before) === JSON.stringify(after)) return false
  const otherKeys = Object.keys(row.new_data).filter((key) => !SKIP_AUDIT_FIELDS.has(key) && key !== 'last_signed_in')
  return otherKeys.every((key) => JSON.stringify(row.old_data?.[key]) === JSON.stringify(row.new_data?.[key]))
}

export default function StaffDetail() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [detailTab, setDetailTab] = useState<DetailTab>('account')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('staff')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<
    { id: string; order_code: string; customer_email: string; created_at: string; time_ago?: string; shipping_address?: { full_name: string } }[]
  >([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const bootstrapHeader = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        const name = session.user.email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }

      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (data) {
        const ordersWithTime = data.map((order) => ({
          ...order,
          time_ago: formatTimeAgo(order.created_at),
        }))
        setAllOrders(ordersWithTime)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
        setNewOrdersCount(data.filter((order) => new Date(order.created_at) > last24Hours).length)
      }
    }

    void bootstrapHeader()
  }, [])

  const loadMember = useCallback(async () => {
    if (!staffId) return

    setLoading(true)
    setLoadError('')

    try {
      const { data, error } = await supabase.from('staff').select('*').eq('id', staffId).maybeSingle()
      if (error) throw error
      if (!data) {
        setMember(null)
        setLoadError('Staff member not found.')
        return
      }

      const processed = processStaffMember(data as Record<string, unknown>, 0)
      setMember(processed)
      setFullName(processed.full_name)
      setRole(processed.role)
      setIsActive(processed.is_active)
      setPassword('')
      setSaveError('')
    } catch (error) {
      console.error('Failed to load staff member:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load staff member.')
    } finally {
      setLoading(false)
    }
  }, [staffId])

  const loadAudit = useCallback(async (target: TeamMember) => {
    setAuditLoading(true)
    try {
      const queries = [
        supabase
          .from('audit_logs')
          .select('id, table_name, record_id, action, old_data, new_data, performed_by, performed_by_name, performed_by_email, performed_at, ip_address, user_agent')
          .eq('table_name', 'staff')
          .eq('record_id', target.id)
          .order('performed_at', { ascending: false })
          .limit(80),
        supabase
          .from('audit_logs')
          .select('id, table_name, record_id, action, old_data, new_data, performed_by, performed_by_name, performed_by_email, performed_at, ip_address, user_agent')
          .eq('table_name', 'staff_roles')
          .eq('record_id', target.id)
          .order('performed_at', { ascending: false })
          .limit(40),
      ]

      if (target.user_id) {
        queries.push(
          supabase
            .from('audit_logs')
            .select('id, table_name, record_id, action, old_data, new_data, performed_by, performed_by_name, performed_by_email, performed_at, ip_address, user_agent')
            .eq('performed_by', target.user_id)
            .in('action', ['LOGIN', 'LOGOUT'])
            .order('performed_at', { ascending: false })
            .limit(40),
        )
      }

      const results = await Promise.all(queries)
      const firstError = results.find((result) => result.error)?.error
      if (firstError) throw firstError

      const merged = new Map<string, AuditRow>()
      for (const result of results) {
        for (const row of (result.data ?? []) as AuditRow[]) {
          merged.set(row.id, row)
        }
      }

      setAuditRows(
        Array.from(merged.values()).sort(
          (left, right) => new Date(right.performed_at).getTime() - new Date(left.performed_at).getTime(),
        ),
      )
    } catch (error) {
      console.error('Failed to load staff audit history:', error)
      setAuditRows([])
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMember()
  }, [loadMember])

  useEffect(() => {
    if (!member) return
    void loadAudit(member)
  }, [loadAudit, member])

  const pendingChanges = useMemo(() => {
    if (!member) return [] as string[]

    const changes: string[] = []
    const trimmedName = fullName.trim()
    if (trimmedName !== member.full_name) {
      changes.push(`Name: “${member.full_name}” → “${trimmedName}”`)
    }
    if (role !== member.role) {
      const label = (value: string) => ROLE_OPTIONS.find((option) => option.value === value)?.label ?? value
      changes.push(`Role: ${label(member.role)} → ${label(role)}`)
    }
    if (isActive !== member.is_active) {
      changes.push(isActive ? 'Account activated' : 'Account deactivated')
    }
    if (password.trim()) {
      changes.push('Password will be reset')
    }
    return changes
  }, [fullName, isActive, member, password, role])

  const hasPendingChanges = pendingChanges.length > 0

  const loginHistory = useMemo(() => {
    const rows = auditRows.filter(isLoginAudit)
    if (rows.length > 0) return rows
    if (member?.last_signed_in) {
      return [
        {
          id: 'last-signed-in',
          table_name: 'staff',
          record_id: member.id,
          action: 'LOGIN',
          old_data: null,
          new_data: null,
          performed_by: member.user_id,
          performed_by_name: member.full_name,
          performed_by_email: member.email,
          performed_at: member.last_signed_in,
          ip_address: null,
          user_agent: null,
        } satisfies AuditRow,
      ]
    }
    return [] as AuditRow[]
  }, [auditRows, member])

  const changesHistory = useMemo(
    () =>
      auditRows.filter((row) => {
        if (isLoginAudit(row)) return false
        if (row.table_name === 'staff' || row.table_name === 'staff_roles') return true
        return false
      }),
    [auditRows],
  )

  const handleSave = async () => {
    if (!member) return

    const trimmedName = fullName.trim()
    if (!trimmedName) {
      setSaveError('Full name is required.')
      setDetailTab('account')
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      if (password.trim()) {
        if (password.length < 6) {
          setSaveError('Password must be at least 6 characters')
          setDetailTab('account')
          return
        }

        const edgeResult = await callStaffAuthEdgeFunction('reset_password', {
          email: member.email,
          newPassword: password,
        })

        if (edgeResult.error) {
          setSaveError(`Password update failed: ${edgeResult.error}`)
          setDetailTab('account')
          return
        }
      }

      const { error } = await supabase
        .from('staff')
        .update({
          full_name: trimmedName,
          role,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)

      if (error) {
        setSaveError(error.message || 'Failed to update staff record.')
        setDetailTab('account')
        return
      }

      const { error: syncError } = await supabase.rpc('sync_staff_role_assignment', {
        target_staff_id: member.id,
        target_role_code: role,
      })

      if (syncError) {
        console.warn('Failed to sync staff role assignment:', syncError)
      }

      showToast('Staff member updated successfully.', 'success')
      await loadMember()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unexpected error. Please try again.')
      setDetailTab('account')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!member) return

    setDeleting(true)
    try {
      const edgeResult = await callStaffAuthEdgeFunction('delete_user', {
        email: member.email,
      })

      if (edgeResult.error && edgeResult.error !== 'User not found') {
        showToast(`Auth error: ${String(edgeResult.error)}`, 'error')
        return
      }

      const { error } = await supabase.from('staff').delete().eq('id', member.id)
      if (error) {
        showToast(`Failed to remove staff record: ${error.message}`, 'error')
        return
      }

      navigate('/staff', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unexpected error.', 'error')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const statusBadge =
    member?.status === 'online' ? (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Online
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        Offline
      </span>
    )

  const tabs: { key: DetailTab; label: string; icon: typeof UserRound }[] = [
    { key: 'account', label: 'Account', icon: UserRound },
    { key: 'login', label: 'Login history', icon: Clock3 },
    { key: 'changes', label: 'Changes history', icon: History },
  ]

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        {toast ? (
          <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ) : null}

        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900">{member?.full_name ?? 'Staff member'}</h1>
              <p className="truncate text-[11px] text-gray-500">{member?.email ?? 'Team profile & access'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                        allOrders.slice(0, 5).map((order) => (
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

        <div className="px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
              Loading staff member…
            </div>
          ) : loadError || !member ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
              <p className="text-sm text-rose-700">{loadError || 'Staff member not found.'}</p>
              <Link to="/staff" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                Back to staff list
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[min(320px,100%)_minmax(0,1fr)] gap-3 items-start">
              <aside className="rounded-xl border border-[#D9D0C2] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ${member.avatarColor}`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{fullName.trim() || member.full_name}</p>
                    <p className="truncate text-[11px] text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Status</span>
                    {statusBadge}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Last active</span>
                    <span className="font-medium text-gray-800">{member.last_active}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Joined</span>
                    <span className="font-medium text-gray-800">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="text-gray-500 shrink-0">Access</span>
                    <span className="inline-flex items-start gap-1 text-right font-medium text-gray-800">
                      <Shield className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                      {member.permissionsDisplay}
                    </span>
                  </div>
                </div>
              </aside>

              <section className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden min-h-[min(28rem,70vh)] flex flex-col">
                <div className="border-b border-[#E8E0D4] bg-[#FBF8F2] px-4 pt-3 pb-0">
                  <div className="flex flex-wrap gap-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      const isActiveTab = detailTab === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDetailTab(tab.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                            isActiveTab
                              ? 'bg-white border-[#D9D0C2] text-indigo-700'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-0">
                  {detailTab === 'account' && (
                    <div className="space-y-4 max-w-xl">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">Full name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="Jane Smith"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">Email</label>
                        <input
                          type="email"
                          value={member.email}
                          disabled
                          className="w-full rounded-lg border border-[#D9D0C2] bg-[#F0E9DC] px-3 py-2 text-sm text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">Role</label>
                        <select
                          value={role}
                          onChange={(event) => setRole(event.target.value)}
                          className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} — {option.permissions}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 rounded-lg border border-[#E8E0D4] bg-[#F7F2E8] px-3 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(event) => setIsActive(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                        />
                        <span className="text-xs text-gray-700">Account active</span>
                      </label>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">New password (optional)</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Leave blank to keep current"
                            className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {hasPendingChanges ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Pending changes</p>
                          <ul className="mt-1.5 space-y-1">
                            {pendingChanges.map((change) => (
                              <li key={change} className="text-[11px] text-amber-950">
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {saveError ? (
                        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{saveError}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E0D4] pt-4">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove staff
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSave()}
                          disabled={saving || !hasPendingChanges}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save changes
                        </button>
                      </div>
                    </div>
                  )}

                  {detailTab === 'login' && (
                    <div className="space-y-3">
                      {auditLoading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                          Loading login history…
                        </div>
                      ) : loginHistory.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 py-10 text-center">
                          <Clock3 className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                          <p className="text-sm text-gray-600">No login history yet</p>
                          <p className="mt-1 text-[11px] text-gray-500">Sign-ins will appear here after this person uses the admin portal.</p>
                        </div>
                      ) : (
                        loginHistory.map((row) => (
                          <div key={row.id} className="rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/40 px-3 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-900">
                                  {row.action === 'LOGOUT' ? 'Signed out' : 'Signed in'}
                                </p>
                                <p className="mt-1 text-[11px] text-gray-600">{formatWhen(row.performed_at)}</p>
                                <p className="text-[10px] text-gray-400">{formatTimeAgo(row.performed_at)}</p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  row.action === 'LOGOUT'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {row.action === 'LOGOUT' ? 'Logout' : 'Login'}
                              </span>
                            </div>
                            {(row.ip_address || row.user_agent) && (
                              <div className="mt-2 space-y-0.5 text-[10px] text-gray-500">
                                {row.ip_address ? <p>IP · {row.ip_address}</p> : null}
                                {row.user_agent ? <p className="line-clamp-1">Device · {row.user_agent}</p> : null}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'changes' && (
                    <div className="space-y-3">
                      {auditLoading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                          Loading changes…
                        </div>
                      ) : changesHistory.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 py-10 text-center">
                          <History className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                          <p className="text-sm text-gray-600">No account changes yet</p>
                          <p className="mt-1 text-[11px] text-gray-500">Role, name, and access updates for this staff member will show here.</p>
                        </div>
                      ) : (
                        changesHistory.map((row) => {
                          const lines = buildChangeLines(row)
                          const actor = row.performed_by_name ?? row.performed_by_email ?? 'System'

                          return (
                            <div key={row.id} className="rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/40 px-3 py-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Changed by</p>
                                  <p className="text-sm font-semibold text-gray-900 truncate">{actor}</p>
                                  {row.performed_by_email && row.performed_by_name ? (
                                    <p className="text-[11px] text-gray-500 truncate">{row.performed_by_email}</p>
                                  ) : null}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Changed on</p>
                                  <p className="text-xs font-medium text-gray-800">{formatWhen(row.performed_at)}</p>
                                  <p className="text-[11px] text-gray-500">{formatTimeAgo(row.performed_at)}</p>
                                </div>
                              </div>
                              <ul className="mt-3 space-y-1.5 border-t border-[#E8E0D4] pt-3">
                                {lines.map((line) => (
                                  <li
                                    key={line}
                                    className="rounded-lg border border-[#E8E0D4] bg-white px-2.5 py-1.5 text-[11px] leading-snug text-gray-700"
                                  >
                                    {line}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {showDeleteConfirm && member ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#D9D0C2] bg-white shadow-xl overflow-hidden">
              <div className="px-4 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Remove staff member</h2>
                <p className="mt-1.5 text-xs text-gray-600">
                  Remove <span className="font-medium text-gray-900">“{member.full_name}”</span> from your team? This can’t be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
