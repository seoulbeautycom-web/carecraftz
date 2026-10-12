import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Eye,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import {
  PERMISSION_GROUPS,
  ROLE_CATEGORY_OPTIONS,
  ROLE_OPTIONS,
} from '../../lib/rbac'

interface RoleRow {
  id: string
  code: string
  name: string
  description: string
  category: 'governance' | 'content' | 'operations' | 'reporting' | 'general'
  is_system: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PermissionRow {
  id: string
  code: string
  name: string
  description: string
  module: string
  sort_order: number
  created_at: string
  updated_at: string
}

interface RolePermissionRow {
  role_id: string
  permission_id: string
}

interface StaffRow {
  id: string
  role: string
}

interface StaffRoleRow {
  staff_id: string
  role_code: string
  assigned_at: string
  updated_at: string
}

interface AuditRow {
  id: string
  table_name: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  performed_by_name: string | null
  performed_by_email: string | null
  performed_at: string
}

interface RoleFormState {
  name: string
  description: string
  category: RoleRow['category']
}

interface CreateRoleFormState {
  code: string
  name: string
  description: string
  category: RoleRow['category']
  clone_permissions: boolean
}

const defaultCreateRoleForm: CreateRoleFormState = {
  code: '',
  name: '',
  description: '',
  category: 'general',
  clone_permissions: true,
}

const defaultRoleForm: RoleFormState = {
  name: '',
  description: '',
  category: 'general',
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const fallbackRoleMeta = (code: string) => {
  const predefined = ROLE_OPTIONS.find((role) => role.value === code)
  if (predefined) return predefined

  return {
    value: code,
    label: code
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' '),
    color: 'bg-[#F0E9DC] text-gray-700',
    ringClass: 'ring-slate-200',
    permissions: 'Custom role',
  }
}

const normalizeRoleCode = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s_-]/g, '')
  .replace(/[\s-]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_+|_+$/g, '')

type RoleDetailTab = 'settings' | 'permissions' | 'audit'

const getAuditTitle = (row: AuditRow) => {
  const primarySnapshot = row.new_data ?? row.old_data ?? {}
  const candidateTitle =
    (primarySnapshot.title as string | undefined) ??
    (primarySnapshot.name as string | undefined) ??
    (primarySnapshot.code as string | undefined) ??
    (primarySnapshot.role_code as string | undefined) ??
    (primarySnapshot.permission_code as string | undefined)

  return candidateTitle ?? row.table_name
}

const AUDIT_TABLE_LABELS: Record<string, string> = {
  roles: 'Role',
  permissions: 'Permission',
  role_permissions: 'Role permission',
  staff_roles: 'Staff assignment',
}

const AUDIT_SKIP_FIELDS = new Set(['updated_at', 'created_at', 'id'])

const formatAuditFieldLabel = (key: string) =>
  key
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const formatAuditValue = (value: unknown) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const buildAuditChangeLines = (row: AuditRow) => {
  const tableLabel = AUDIT_TABLE_LABELS[row.table_name] ?? row.table_name
  const subject = getAuditTitle(row)

  if (row.action === 'DELETE') {
    return [`Removed ${tableLabel.toLowerCase()}: ${subject}`]
  }

  if (row.action === 'CREATE') {
    return [`Added ${tableLabel.toLowerCase()}: ${subject}`]
  }

  if (row.action === 'UPDATE' && row.old_data && row.new_data) {
    const lines: string[] = []
    const keys = new Set([...Object.keys(row.old_data), ...Object.keys(row.new_data)])

    for (const key of keys) {
      if (AUDIT_SKIP_FIELDS.has(key)) continue
      const oldValue = row.old_data[key]
      const newValue = row.new_data[key]
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue
      lines.push(`${formatAuditFieldLabel(key)}: ${formatAuditValue(oldValue)} → ${formatAuditValue(newValue)}`)
    }

    if (lines.length > 0) {
      return lines.map((line) => `${tableLabel} “${subject}” — ${line}`)
    }
  }

  return [`Updated ${tableLabel.toLowerCase()}: ${subject}`]
}

interface AuditEventBatch {
  key: string
  performedBy: string
  performedByEmail: string | null
  performedAt: string
  changeLines: string[]
  changeCount: number
}

const formatAuditWhen = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const groupAuditRowsIntoBatches = (rows: AuditRow[]): AuditEventBatch[] => {
  const batchMap = new Map<string, AuditEventBatch>()

  for (const row of rows) {
    const performedBy = row.performed_by_name?.trim() || row.performed_by_email?.trim() || 'System'
    const performedByEmail = row.performed_by_email?.trim() || null
    const batchKey = `${performedByEmail ?? performedBy}|${row.performed_at}`

    const existing = batchMap.get(batchKey)
    const rowLines = buildAuditChangeLines(row)

    if (existing) {
      existing.changeLines.push(...rowLines)
      existing.changeCount = existing.changeLines.length
      if (new Date(row.performed_at).getTime() > new Date(existing.performedAt).getTime()) {
        existing.performedAt = row.performed_at
      }
      continue
    }

    batchMap.set(batchKey, {
      key: batchKey,
      performedBy,
      performedByEmail,
      performedAt: row.performed_at,
      changeLines: rowLines,
      changeCount: rowLines.length,
    })
  }

  return Array.from(batchMap.values()).sort(
    (left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime(),
  )
}

export default function AccessControl() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRow[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [staffRoles, setStaffRoles] = useState<StaffRoleRow[]>([])
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [selectedRoleCode, setSelectedRoleCode] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createRoleForm, setCreateRoleForm] = useState<CreateRoleFormState>(defaultCreateRoleForm)
  const [roleForm, setRoleForm] = useState<RoleFormState>(defaultRoleForm)
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([])
  const [creatingRole, setCreatingRole] = useState(false)
  const [deletingRoleCode, setDeletingRoleCode] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [detailTab, setDetailTab] = useState<RoleDetailTab>('settings')
  const [showRoleChangesList, setShowRoleChangesList] = useState(false)
  const [showPermissionChangesList, setShowPermissionChangesList] = useState(false)
  const [openAuditBatchKey, setOpenAuditBatchKey] = useState<string | null>(null)

  const selectedRoleCodeRef = useRef('')

  const applyRoleSelection = useCallback((role: RoleRow | null, permissionRows: RolePermissionRow[]) => {
    if (!role) {
      selectedRoleCodeRef.current = ''
      setSelectedRoleCode('')
      setRoleForm(defaultRoleForm)
      setDraftPermissionIds([])
      return
    }

    selectedRoleCodeRef.current = role.code
    setSelectedRoleCode(role.code)
    setRoleForm({
      name: role.name,
      description: role.description,
      category: role.category,
    })
    setDraftPermissionIds(
      permissionRows
        .filter((entry) => entry.role_id === role.id)
        .map((entry) => entry.permission_id),
    )
  }, [])

  const openCreateModal = () => {
    setCreateRoleForm({
      ...defaultCreateRoleForm,
      category: selectedRole?.category ?? 'general',
      code: selectedRole ? normalizeRoleCode(`${selectedRole.name} copy`) : '',
    })
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateRoleForm(defaultCreateRoleForm)
  }

  const selectedRole = roles.find((role) => role.code === selectedRoleCode) ?? null

  const staffRoleLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of staffRoles) {
      map.set(row.staff_id, row.role_code)
    }
    return map
  }, [staffRoles])

  const staffAssignmentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const role of roles) {
      counts[role.code] = 0
    }
    for (const row of staff) {
      const resolvedRole = staffRoleLookup.get(row.id) ?? row.role
      counts[resolvedRole] = (counts[resolvedRole] ?? 0) + 1
    }
    return counts
  }, [roles, staff, staffRoleLookup])

  const selectedPermissionSet = useMemo(() => new Set(draftPermissionIds), [draftPermissionIds])

  const groupedPermissions = useMemo(() => {
    const groupLookup = new Map(
      PERMISSION_GROUPS.map((group) => [group.module, group]),
    )
    const grouped = new Map<string, PermissionRow[]>()

    for (const permission of permissions) {
      const bucket = grouped.get(permission.module) ?? []
      bucket.push(permission)
      grouped.set(permission.module, bucket)
    }

    return Array.from(grouped.entries())
      .map(([module, modulePermissions]) => {
        const template = groupLookup.get(module)
        return {
          module,
          label: template?.label ?? module.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          permissions: modulePermissions.sort((left, right) => left.sort_order - right.sort_order),
        }
      })
      .sort((left, right) => {
        const leftIndex = PERMISSION_GROUPS.findIndex((group) => group.module === left.module)
        const rightIndex = PERMISSION_GROUPS.findIndex((group) => group.module === right.module)

        if (leftIndex === -1 && rightIndex === -1) {
          return left.label.localeCompare(right.label)
        }

        if (leftIndex === -1) return 1
        if (rightIndex === -1) return -1
        return leftIndex - rightIndex
      })
  }, [permissions])

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase()
    return roles.filter((role) => {
      if (!query) return true
      return [role.name, role.code, role.description, role.category].some((value) =>
        value.toLowerCase().includes(query),
      )
    })
  }, [roles, roleSearch])

  const savedPermissionIds = useMemo(() => {
    if (!selectedRole) return new Set<string>()
    return new Set(
      rolePermissions
        .filter((entry) => entry.role_id === selectedRole.id)
        .map((entry) => entry.permission_id),
    )
  }, [selectedRole, rolePermissions])

  const roleSettingsChanges = useMemo(() => {
    if (!selectedRole) return [] as string[]

    const changes: string[] = []
    const trimmedName = roleForm.name.trim()
    const trimmedDescription = roleForm.description.trim()

    if (trimmedName !== selectedRole.name) {
      changes.push(`Name: “${selectedRole.name}” → “${trimmedName}”`)
    }
    if (trimmedDescription !== selectedRole.description) {
      changes.push('Description updated')
    }
    if (roleForm.category !== selectedRole.category) {
      const label = (value: RoleRow['category']) =>
        ROLE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value
      changes.push(`Category: ${label(selectedRole.category)} → ${label(roleForm.category)}`)
    }

    return changes
  }, [selectedRole, roleForm])

  const permissionChanges = useMemo(() => {
    if (!selectedRole) return [] as string[]

    const changes: string[] = []
    for (const permission of permissions) {
      const enabled = selectedPermissionSet.has(permission.id)
      const wasEnabled = savedPermissionIds.has(permission.id)
      if (enabled && !wasEnabled) {
        changes.push(`Added: ${permission.name}`)
      } else if (!enabled && wasEnabled) {
        changes.push(`Removed: ${permission.name}`)
      }
    }

    return changes.sort((left, right) => left.localeCompare(right))
  }, [permissions, savedPermissionIds, selectedPermissionSet, selectedRole])

  const roleSettingsChangeCount = roleSettingsChanges.length
  const permissionChangeCount = permissionChanges.length

  const auditBatches = useMemo(() => groupAuditRowsIntoBatches(auditRows), [auditRows])
  const auditChangeTotal = useMemo(
    () => auditBatches.reduce((sum, batch) => sum + batch.changeCount, 0),
    [auditBatches],
  )

  useEffect(() => {
    setShowRoleChangesList(false)
    setShowPermissionChangesList(false)
    setOpenAuditBatchKey(null)
  }, [selectedRoleCode, detailTab])

  const stats = useMemo(() => [
    {
      label: 'Roles',
      value: roles.length,
      icon: ShieldCheck,
      hint: 'system + custom',
      tone: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Permissions',
      value: permissions.length,
      icon: KeyRound,
      hint: 'atomic actions',
      tone: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Audit entries',
      value: auditRows.length,
      icon: Eye,
      hint: 'security events',
      tone: 'bg-[#F0E9DC] text-gray-600',
    },
  ], [auditRows.length, permissions.length, roles.length])

  const loadData = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const [rolesResult, permissionsResult, rolePermissionsResult, staffResult, staffRolesResult, auditResult] = await Promise.all([
        supabase.from('roles').select('*').order('sort_order', { ascending: true }),
        supabase.from('permissions').select('*').order('module', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('role_permissions').select('*'),
        supabase.from('staff').select('id, role'),
        supabase.from('staff_roles').select('*').order('assigned_at', { ascending: false }),
        supabase
          .from('audit_logs')
          .select('id, table_name, action, old_data, new_data, performed_by_name, performed_by_email, performed_at')
          .in('table_name', ['roles', 'permissions', 'role_permissions', 'staff_roles'])
          .order('performed_at', { ascending: false })
          .limit(12),
      ])

      if (rolesResult.error) throw rolesResult.error
      if (permissionsResult.error) throw permissionsResult.error
      if (rolePermissionsResult.error) throw rolePermissionsResult.error
      if (staffResult.error) throw staffResult.error
      if (staffRolesResult.error) throw staffRolesResult.error
      if (auditResult.error) throw auditResult.error

      const nextRoles = rolesResult.data ?? []
      const nextPermissions = permissionsResult.data ?? []
      const nextRolePermissions = rolePermissionsResult.data ?? []
      const nextStaff = staffResult.data ?? []
      const nextStaffRoles = staffRolesResult.data ?? []

      setRoles(nextRoles)
      setPermissions(nextPermissions)
      setRolePermissions(nextRolePermissions)
      setStaff(nextStaff)
      setStaffRoles(nextStaffRoles)
      setAuditRows(auditResult.data ?? [])

      const activeRoleCode = selectedRoleCodeRef.current
      const nextSelectedRole = nextRoles.find((role) => role.code === activeRoleCode) ?? nextRoles[0] ?? null
      applyRoleSelection(nextSelectedRole, nextRolePermissions)

      return {
        roles: nextRoles,
        permissions: nextPermissions,
        rolePermissions: nextRolePermissions,
        staff: nextStaff,
        staffRoles: nextStaffRoles,
        auditRows: auditResult.data ?? [],
      }
    } catch (error) {
      console.error('Failed to load RBAC data:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to load RBAC data')
      return null
    } finally {
      setLoading(false)
    }
  }, [applyRoleSelection])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 2500)
  }

  const handleCreateRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const code = normalizeRoleCode(createRoleForm.code)
    if (!code) {
      setPageError('Role code is required and must contain only letters, numbers, underscores, or hyphens.')
      return
    }

    if (!createRoleForm.name.trim()) {
      setPageError('Role name is required.')
      return
    }

    setCreatingRole(true)
    setPageError('')

    try {
      const { error } = await supabase.from('roles').insert({
        code,
        name: createRoleForm.name.trim(),
        description: createRoleForm.description.trim(),
        category: createRoleForm.category,
        is_system: false,
        sort_order: roles.length + 1,
      })

      if (error) throw error

      if (createRoleForm.clone_permissions && selectedRole) {
        const selectedCodes = permissions
          .filter((permission) => selectedPermissionSet.has(permission.id))
          .map((permission) => permission.code)

        if (selectedCodes.length > 0) {
          const { error: permissionError } = await supabase.rpc('replace_role_permissions', {
            target_role_code: code,
            target_permission_codes: selectedCodes,
          })

          if (permissionError) throw permissionError
        }
      }

      const refreshed = await loadData()
      const createdRole = refreshed?.roles.find((role) => role.code === code) ?? null
      if (createdRole) {
        applyRoleSelection(createdRole, refreshed?.rolePermissions ?? [])
      }
      setShowCreateModal(false)
      showSuccess(`Role ${code} created successfully.`)
    } catch (error) {
      console.error('Failed to create role:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to create role')
    } finally {
      setCreatingRole(false)
    }
  }

  const handleSaveRole = async () => {
    if (!selectedRole) return

    if (!roleForm.name.trim()) {
      setPageError('Role name is required.')
      return
    }

    setSavingRole(true)
    setPageError('')

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: roleForm.name.trim(),
          description: roleForm.description.trim(),
          category: roleForm.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRole.id)

      if (error) throw error

      setRoles((current) =>
        current.map((role) =>
          role.id === selectedRole.id
            ? {
                ...role,
                name: roleForm.name.trim(),
                description: roleForm.description.trim(),
                category: roleForm.category,
              }
            : role,
        ),
      )

      showSuccess(`Role ${selectedRole.code} updated.`)
      setShowRoleChangesList(false)
    } catch (error) {
      console.error('Failed to save role:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to save role')
    } finally {
      setSavingRole(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    setSavingPermissions(true)
    setPageError('')

    try {
      const selectedPermissionCodes = permissions
        .filter((permission) => selectedPermissionSet.has(permission.id))
        .map((permission) => permission.code)

      const { error } = await supabase.rpc('replace_role_permissions', {
        target_role_code: selectedRole.code,
        target_permission_codes: selectedPermissionCodes,
      })

      if (error) throw error

      const updatedRolePermissions = rolePermissions.filter((entry) => entry.role_id !== selectedRole.id)
      const permissionIdLookup = new Set(
        permissions
          .filter((permission) => selectedPermissionSet.has(permission.id))
          .map((permission) => permission.id),
      )

      const replacementRows = Array.from(permissionIdLookup).map((permissionId) => ({
        role_id: selectedRole.id,
        permission_id: permissionId,
      }))

      setRolePermissions([...updatedRolePermissions, ...replacementRows])
      showSuccess(`Permissions updated for ${selectedRole.code}.`)
      setShowPermissionChangesList(false)
    } catch (error) {
      console.error('Failed to save permissions:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to save permissions')
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleDeleteRole = async (role: RoleRow) => {
    if (role.is_system) {
      setPageError('System roles cannot be deleted.')
      return
    }

    const assignedCount = staffAssignmentCounts[role.code] ?? 0
    if (assignedCount > 0) {
      setPageError(`Reassign the ${assignedCount} staff member(s) currently using ${role.code} before deleting it.`)
      return
    }

    if (!window.confirm(`Delete role ${role.name}? This cannot be undone.`)) return

    setDeletingRoleCode(role.code)
    setPageError('')

    try {
      const { error } = await supabase.from('roles').delete().eq('id', role.id)
      if (error) throw error

      setRoles((current) => current.filter((entry) => entry.id !== role.id))
      if (selectedRole?.id === role.id) {
        const nextRole = roles.find((entry) => entry.id !== role.id) ?? null
        applyRoleSelection(nextRole, rolePermissions.filter((entry) => entry.role_id !== role.id))
      }
      showSuccess(`Role ${role.code} deleted.`)
    } catch (error) {
      console.error('Failed to delete role:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to delete role')
    } finally {
      setDeletingRoleCode(null)
    }
  }

  const rolePermissionSummary = selectedRole
    ? {
        assignedStaff: staffAssignmentCounts[selectedRole.code] ?? 0,
        permissions: selectedPermissionSet.size,
        sensitivePermissions: permissions.filter((permission) =>
          selectedPermissionSet.has(permission.id) && ['roles', 'staff', 'settings', 'audit'].includes(permission.module),
        ).length,
      }
    : null

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Access Control</h1>
              <p className="text-[11px] text-gray-500">Roles and permissions.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D0C2] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white/80"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                New role
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 space-y-4">
          {pageError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{pageError}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-xl border border-[#D9D0C2] bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500">{stat.label}</p>
                      <p className="mt-0.5 text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${stat.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">{stat.hint}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[min(300px,100%)_minmax(0,1fr)] gap-3 items-start">
            <aside className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden xl:sticky xl:top-[4.25rem] xl:flex xl:max-h-[calc(100vh-5.25rem)] xl:flex-col">
              <div className="border-b border-[#E8E0D4] bg-[#FBF8F2] px-3 py-3">
                <p className="text-xs font-semibold text-gray-800">Roles</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{filteredRoles.length} templates</p>
                <div className="relative mt-2.5">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Search roles"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto xl:flex-1">
                {filteredRoles.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-gray-500">No roles found</p>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = role.code === selectedRole?.code
                    const assignedCount = staffAssignmentCounts[role.code] ?? 0

                    return (
                      <div key={role.id} className="relative">
                        <button
                          type="button"
                          onClick={() => applyRoleSelection(role, rolePermissions)}
                          className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200/80'
                              : 'border-transparent hover:border-[#E8E0D4] hover:bg-[#F7F2E8]/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`min-w-0 truncate text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {role.name}
                            </p>
                            {isSelected ? (
                              <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500">{role.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {role.is_system ? (
                              <span className="rounded-md bg-[#F0E9DC] px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                System
                              </span>
                            ) : null}
                            <span className="text-[10px] text-gray-500">{assignedCount} staff</span>
                          </div>
                        </button>
                        {!role.is_system && assignedCount === 0 ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteRole(role)}
                            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete role"
                          >
                            {deletingRoleCode === role.code ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden flex flex-col min-h-[min(32rem,70vh)]">
                <div className="border-b border-[#E8E0D4] bg-[#FBF8F2] px-4 pt-3 pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800">Role configuration</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {selectedRole ? selectedRole.name : 'Select a role on the left'}
                      </p>
                    </div>
                    {detailTab === 'permissions' && selectedRole ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {permissionChangeCount > 0 ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowPermissionChangesList((current) => !current)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                                {permissionChangeCount}
                              </span>
                              pending
                            </button>
                            {showPermissionChangesList ? (
                              <div className="absolute right-0 top-full z-30 mt-1.5 w-72 max-h-64 overflow-y-auto rounded-xl border border-[#D9D0C2] bg-white p-2 shadow-lg">
                                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                  Permission changes
                                </p>
                                <ul className="space-y-1">
                                  {permissionChanges.map((change) => (
                                    <li key={change} className="rounded-lg bg-[#F7F2E8]/80 px-2.5 py-1.5 text-[11px] text-gray-700">
                                      {change}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleSavePermissions()}
                          disabled={savingPermissions || permissionChangeCount === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingPermissions ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save permissions
                        </button>
                      </div>
                    ) : null}
                    {detailTab === 'settings' && selectedRole ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {roleSettingsChangeCount > 0 ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowRoleChangesList((current) => !current)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                                {roleSettingsChangeCount}
                              </span>
                              pending
                            </button>
                            {showRoleChangesList ? (
                              <div className="absolute right-0 top-full z-30 mt-1.5 w-72 max-h-64 overflow-y-auto rounded-xl border border-[#D9D0C2] bg-white p-2 shadow-lg">
                                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                  Role changes
                                </p>
                                <ul className="space-y-1">
                                  {roleSettingsChanges.map((change) => (
                                    <li key={change} className="rounded-lg bg-[#F7F2E8]/80 px-2.5 py-1.5 text-[11px] text-gray-700">
                                      {change}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleSaveRole()}
                          disabled={savingRole || roleSettingsChangeCount === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingRole ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save role
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { key: 'settings' as const, label: 'Role settings' },
                        { key: 'permissions' as const, label: 'Permissions' },
                        { key: 'audit' as const, label: 'Audit trail' },
                      ] as const
                    ).map((tab) => {
                      const isActive = detailTab === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDetailTab(tab.key)}
                          className={`px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                            isActive
                              ? 'bg-white border-[#D9D0C2] text-indigo-700'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-0">
                  {detailTab === 'settings' && (
                    <>
                      {!selectedRole ? (
                        <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 p-8 text-center text-sm text-gray-500">
                          Select a role on the left to view and edit its settings.
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                            {selectedRole.is_system ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">
                                System role
                              </span>
                            ) : null}
                            <span>{rolePermissionSummary?.assignedStaff ?? 0} staff assigned</span>
                            <span className="text-gray-300">·</span>
                            <span>{rolePermissionSummary?.permissions ?? 0} permissions</span>
                            {rolePermissionSummary && rolePermissionSummary.sensitivePermissions > 0 ? (
                              <>
                                <span className="text-gray-300">·</span>
                                <span>{rolePermissionSummary.sensitivePermissions} sensitive</span>
                              </>
                            ) : null}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-gray-700">Role name</label>
                              <input
                                type="text"
                                value={roleForm.name}
                                onChange={(event) =>
                                  setRoleForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                              <select
                                value={roleForm.category}
                                onChange={(event) =>
                                  setRoleForm((current) => ({
                                    ...current,
                                    category: event.target.value as RoleRow['category'],
                                  }))
                                }
                                className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                              >
                                {ROLE_CATEGORY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                value={roleForm.description}
                                onChange={(event) =>
                                  setRoleForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                rows={4}
                                className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {!selectedRole.is_system ? (
                            <div className="mt-6 pt-4 border-t border-[#E8E0D4]">
                              <button
                                type="button"
                                onClick={() => void handleDeleteRole(selectedRole)}
                                disabled={deletingRoleCode === selectedRole.code}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingRoleCode === selectedRole.code ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete role
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </>
                  )}

                  {detailTab === 'permissions' && (
                    <>
                      {!selectedRole ? (
                        <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/40 py-10 text-center text-xs text-gray-500">
                          Select a role to edit its permission matrix.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groupedPermissions.map((group) => (
                            <div key={group.module} className="rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">{group.label}</h4>
                                  <p className="text-xs text-gray-500">{group.permissions.length} permissions</p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {group.permissions.map((permission) => {
                                  const checked = selectedPermissionSet.has(permission.id)
                                  const sensitive = ['roles', 'staff', 'settings', 'audit'].includes(permission.module)

                                  return (
                                    <label
                                      key={permission.id}
                                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                                        checked ? 'border-indigo-300 bg-indigo-50' : 'border-[#D9D0C2] bg-white hover:bg-[#F7F2E8]'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          setDraftPermissionIds((current) =>
                                            checked
                                              ? current.filter((permissionId) => permissionId !== permission.id)
                                              : [...current, permission.id],
                                          )
                                        }
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                          {sensitive && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                              Sensitive
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">{permission.description}</p>
                                      </div>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {detailTab === 'audit' && (
                    <div className="space-y-3">
                      {auditBatches.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 p-6 text-sm text-gray-500">
                          No RBAC audit entries yet.
                        </div>
                      ) : (
                        <>
                          <div className="rounded-lg border border-[#E8E0D4] bg-[#FBF8F2] px-3 py-2.5 text-[11px] text-gray-600">
                            <span className="font-semibold text-gray-800">{auditChangeTotal}</span> recorded change
                            {auditChangeTotal === 1 ? '' : 's'} across{' '}
                            <span className="font-semibold text-gray-800">{auditBatches.length}</span> update
                            {auditBatches.length === 1 ? '' : 's'}
                          </div>
                          {auditBatches.map((batch) => {
                            const isOpen = openAuditBatchKey === batch.key
                            const initials = batch.performedBy
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() ?? '')
                              .join('')

                            return (
                              <div
                                key={batch.key}
                                className="rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/40 px-3 py-3"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white">
                                      {initials || 'SY'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                        Changes by
                                      </p>
                                      <p className="text-sm font-semibold text-gray-900 truncate">{batch.performedBy}</p>
                                      {batch.performedByEmail ? (
                                        <p className="text-[11px] text-gray-500 truncate">{batch.performedByEmail}</p>
                                      ) : null}
                                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                        Changed on
                                      </p>
                                      <p className="text-xs font-medium text-gray-800">{formatAuditWhen(batch.performedAt)}</p>
                                      <p className="text-[11px] text-gray-500">{formatTimeAgo(batch.performedAt)}</p>
                                    </div>
                                  </div>
                                  <div className="relative shrink-0 sm:text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenAuditBatchKey((current) => (current === batch.key ? null : batch.key))
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                                    >
                                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                                        {batch.changeCount}
                                      </span>
                                      change{batch.changeCount === 1 ? '' : 's'}
                                    </button>
                                    {isOpen ? (
                                      <div className="absolute right-0 top-full z-30 mt-1.5 w-80 max-h-64 overflow-y-auto rounded-xl border border-[#D9D0C2] bg-white p-2 text-left shadow-lg sm:w-96">
                                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                          What changed
                                        </p>
                                        <ul className="space-y-1">
                                          {batch.changeLines.map((line, index) => (
                                            <li
                                              key={`${batch.key}-${index}`}
                                              className="rounded-lg bg-[#F7F2E8]/80 px-2.5 py-1.5 text-[11px] leading-snug text-gray-700"
                                            >
                                              {line}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Create new role</h2>
                  <p className="text-sm text-gray-500">Add a custom role template and then tune its permissions.</p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-[#F0E9DC] hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateRole(event)}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={createRoleForm.code}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="content_lead"
                    className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={createRoleForm.name}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        name: event.target.value,
                        code: current.code || normalizeRoleCode(event.target.value),
                      }))
                    }
                    placeholder="Content Lead"
                    className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={createRoleForm.category}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        category: event.target.value as RoleRow['category'],
                      }))
                    }
                    className="w-full rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {ROLE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={createRoleForm.description}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Describe what this role can do"
                    className="w-full rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-[#E8E0D4] bg-[#F7F2E8]/50 p-4">
                  <input
                    type="checkbox"
                    checked={createRoleForm.clone_permissions}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        clone_permissions: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Clone the selected role's permissions</p>
                    <p className="text-xs text-gray-500">The new role will inherit the current permission matrix and can be adjusted later.</p>
                  </div>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex-1 rounded-xl border border-[#D9D0C2] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-[#F7F2E8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingRole}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingRole ? 'Creating...' : 'Create role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F7F2E8]/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl border border-[#D9D0C2] bg-white px-5 py-4 shadow-lg">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Loading RBAC data...</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
