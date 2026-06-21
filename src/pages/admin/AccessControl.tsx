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
  Users,
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
  full_name: string
  email: string
  role: string
  is_active: boolean
  last_signed_in: string | null
  created_at: string
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

const formatLastSignedIn = (dateString: string | null) => {
  if (!dateString) return 'Never'
  return formatTimeAgo(dateString)
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
    color: 'bg-slate-100 text-slate-700',
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

const buildStaffAssignmentDraft = (staffRows: StaffRow[], staffRoleRows: StaffRoleRow[]) => {
  const draft: Record<string, string> = {}
  const roleLookup = new Map(staffRoleRows.map((entry) => [entry.staff_id, entry.role_code]))

  for (const member of staffRows) {
    draft[member.id] = roleLookup.get(member.id) ?? member.role
  }

  return draft
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
  const [staffSearch, setStaffSearch] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [savingStaffId, setSavingStaffId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createRoleForm, setCreateRoleForm] = useState<CreateRoleFormState>(defaultCreateRoleForm)
  const [roleForm, setRoleForm] = useState<RoleFormState>(defaultRoleForm)
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([])
  const [creatingRole, setCreatingRole] = useState(false)
  const [deletingRoleCode, setDeletingRoleCode] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

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

  const rolePermissionLookup = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const role of roles) {
      map.set(role.id, new Set())
    }
    for (const entry of rolePermissions) {
      const bucket = map.get(entry.role_id)
      if (bucket) bucket.add(entry.permission_id)
    }
    return map
  }, [roles, rolePermissions])

  const rolePermissionCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const role of roles) {
      counts[role.id] = rolePermissionLookup.get(role.id)?.size ?? 0
    }
    return counts
  }, [roles, rolePermissionLookup])

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

  const [staffAssignmentDraft, setStaffAssignmentDraft] = useState<Record<string, string>>({})

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

  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase()
    return staff.filter((member) => {
      const resolvedRole = staffRoleLookup.get(member.id) ?? member.role
      const roleMeta = fallbackRoleMeta(resolvedRole)
      return (
        !query ||
        [member.full_name, member.email, member.role, resolvedRole, roleMeta.label].some((value) =>
          value.toLowerCase().includes(query),
        )
      )
    })
  }, [staff, staffRoleLookup, staffSearch])

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
      label: 'Staff assignments',
      value: staffRoles.length,
      icon: Users,
      hint: 'normalized links',
      tone: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Audit entries',
      value: auditRows.length,
      icon: Eye,
      hint: 'security events',
      tone: 'bg-slate-100 text-slate-600',
    },
  ], [auditRows.length, permissions.length, roles.length, staffRoles.length])

  const loadData = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const [rolesResult, permissionsResult, rolePermissionsResult, staffResult, staffRolesResult, auditResult] = await Promise.all([
        supabase.from('roles').select('*').order('sort_order', { ascending: true }),
        supabase.from('permissions').select('*').order('module', { ascending: true }).order('sort_order', { ascending: true }),
        supabase.from('role_permissions').select('*'),
        supabase.from('staff').select('id, full_name, email, role, is_active, last_signed_in, created_at').order('full_name', { ascending: true }),
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
      setStaffAssignmentDraft(buildStaffAssignmentDraft(nextStaff, nextStaffRoles))

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

  const handleAssignStaffRole = async (staffId: string) => {
    const targetRoleCode = staffRoleLookup.get(staffId) ?? staff.find((member) => member.id === staffId)?.role ?? 'staff'
    const nextRoleCode = staffAssignmentDraft[staffId] ?? targetRoleCode

    setSavingStaffId(staffId)
    setPageError('')

    try {
      const { error } = await supabase.rpc('sync_staff_role_assignment', {
        target_staff_id: staffId,
        target_role_code: nextRoleCode,
      })

      if (error) throw error

      setStaff((current) => current.map((member) => (member.id === staffId ? { ...member, role: nextRoleCode } : member)))
      setStaffRoles((current) => {
        const remaining = current.filter((entry) => entry.staff_id !== staffId)
        return [
          ...remaining,
          {
            staff_id: staffId,
            role_code: nextRoleCode,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      })
      setStaffAssignmentDraft((current) => ({
        ...current,
        [staffId]: nextRoleCode,
      }))
      showSuccess('Staff role updated.')
    } catch (error) {
      console.error('Failed to assign staff role:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to assign staff role')
    } finally {
      setSavingStaffId(null)
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
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 py-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="h-4 w-4" />
                Enterprise RBAC
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">Access Control</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Manage roles, atomic permissions, and staff assignments through normalized Supabase tables with RLS-backed enforcement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                New Role
              </button>
            </div>
          </div>

          {pageError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{pageError}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${stat.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{stat.hint}</p>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Roles</h2>
                    <p className="text-sm text-slate-500">System roles and custom templates</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Search roles"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {filteredRoles.map((role) => {
                    const meta = fallbackRoleMeta(role.code)
                    const isSelected = role.code === selectedRole?.code
                    const assignedCount = staffAssignmentCounts[role.code] ?? 0
                    const permissionCount = rolePermissionCount[role.id] ?? 0

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => applyRoleSelection(role, rolePermissions)}
                        className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.color}`}>
                                {role.name}
                              </span>
                              {role.is_system && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  System
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-500 line-clamp-2">{role.description}</p>
                          </div>
                          {!role.is_system && assignedCount === 0 && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleDeleteRole(role)
                              }}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete role"
                            >
                              {deletingRoleCode === role.code ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                          <span>{assignedCount} staff</span>
                          <span>{permissionCount} permissions</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Staff assignments</h2>
                    <p className="text-sm text-slate-500">Assign one role to each staff member</p>
                  </div>
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(event) => setStaffSearch(event.target.value)}
                    placeholder="Search staff"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredStaff.map((member) => {
                    const currentRoleCode = staffRoleLookup.get(member.id) ?? member.role
                    const currentRole = fallbackRoleMeta(currentRoleCode)
                    const initials = member.full_name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{member.full_name}</p>
                                <p className="truncate text-xs text-slate-500">{member.email}</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">Last signed in {formatLastSignedIn(member.last_signed_in)}</p>

                            <div className="mt-3 flex items-center gap-2">
                              <select
                                value={staffAssignmentDraft[member.id] ?? currentRoleCode}
                                onChange={(event) =>
                                  setStaffAssignmentDraft((current) => ({
                                    ...current,
                                    [member.id]: event.target.value,
                                  }))
                                }
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                              >
                                {roles.map((role) => (
                                  <option key={role.id} value={role.code}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => void handleAssignStaffRole(member.id)}
                                disabled={savingStaffId === member.id}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingStaffId === member.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Assign
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className={`rounded-full px-2.5 py-1 font-medium ${currentRole.color}`}>
                                {currentRole.label}
                              </span>
                              <span>{currentRole.permissions}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {selectedRole ? (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${fallbackRoleMeta(selectedRole.code).color}`}>
                            {selectedRole.name}
                          </span>
                          {selectedRole.is_system && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                              System role
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {selectedRole.code}
                          </span>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">Role details</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                          Edit the role profile and permission matrix. Writes go through Supabase helpers so the RLS layer stays authoritative.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Staff</p>
                          <p className="mt-1 font-semibold text-slate-900">{rolePermissionSummary?.assignedStaff ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Permissions</p>
                          <p className="mt-1 font-semibold text-slate-900">{rolePermissionSummary?.permissions ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Sensitive</p>
                          <p className="mt-1 font-semibold text-slate-900">{rolePermissionSummary?.sensitivePermissions ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Code</label>
                        <input
                          type="text"
                          value={selectedRole.code}
                          disabled
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                        <select
                          value={roleForm.category}
                          onChange={(event) =>
                            setRoleForm((current) => ({
                              ...current,
                              category: event.target.value as RoleRow['category'],
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                        >
                          {ROLE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Role name</label>
                        <input
                          type="text"
                          value={roleForm.name}
                          onChange={(event) =>
                            setRoleForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                          value={roleForm.description}
                          onChange={(event) =>
                            setRoleForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          rows={4}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveRole()}
                        disabled={savingRole}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingRole ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save role details
                      </button>
                      {!selectedRole.is_system && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteRole(selectedRole)}
                          disabled={deletingRoleCode === selectedRole.code}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingRoleCode === selectedRole.code ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete role
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Select a role to view and edit its permissions.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      <KeyRound className="h-4 w-4" />
                      Permission matrix
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">Atomic permissions</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Toggle permissions by module. The selected set is persisted through the `replace_role_permissions` RPC.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSavePermissions()}
                    disabled={!selectedRole || savingPermissions}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPermissions ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save permissions
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {groupedPermissions.map((group) => (
                    <div key={group.module} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{group.label}</h4>
                          <p className="text-xs text-slate-500">{group.permissions.length} permissions</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.permissions.map((permission) => {
                          const checked = selectedPermissionSet.has(permission.id)
                          const sensitive = ['roles', 'staff', 'settings', 'audit'].includes(permission.module)

                          return (
                            <label
                              key={permission.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                                checked ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
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
                                  <span className="text-sm font-medium text-slate-900">{permission.name}</span>
                                  {sensitive && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                      Sensitive
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">{permission.code}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Eye className="h-4 w-4" />
                      Audit trail
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">Security-sensitive changes</h3>
                    <p className="mt-2 text-sm text-slate-500">Latest changes to roles, permissions, and staff-role assignments.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {auditRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No RBAC audit entries yet.
                    </div>
                  ) : (
                    auditRows.map((row) => (
                      <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                                {row.table_name}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.action === 'DELETE' ? 'bg-red-100 text-red-700' : row.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {row.action}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">{getAuditTitle(row)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.performed_by_name ?? row.performed_by_email ?? 'System'} · {formatTimeAgo(row.performed_at)}
                            </p>
                          </div>
                          <div className="max-w-md rounded-xl bg-white p-3 text-xs text-slate-500">
                            <p className="font-medium text-slate-700">Snapshot</p>
                            <p className="mt-1 line-clamp-3">
                              {JSON.stringify(row.new_data ?? row.old_data ?? {}, null, 2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
            <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create new role</h2>
                  <p className="text-sm text-slate-500">Add a custom role template and then tune its permissions.</p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateRole(event)}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Code</label>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select
                    value={createRoleForm.category}
                    onChange={(event) =>
                      setCreateRoleForm((current) => ({
                        ...current,
                        category: event.target.value as RoleRow['category'],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {ROLE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                    <p className="text-sm font-medium text-slate-900">Clone the selected role's permissions</p>
                    <p className="text-xs text-slate-500">The new role will inherit the current permission matrix and can be adjusted later.</p>
                  </div>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Loading RBAC data...</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
