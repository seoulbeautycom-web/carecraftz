import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronDown, 
  Bell,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Users,
  Shield,
  Edit2,
  Trash2,
  Settings,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { ROLE_OPTIONS } from '../../lib/rbac'

interface Order {
  id: string
  order_code: string
  customer_email: string
  status: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
}

interface TeamMember {
  id: string
  user_id: string
  full_name: string
  email: string
  role: string
  permissions: Record<string, boolean>
  is_active: boolean
  last_signed_in: string | null
  created_at: string
  status: 'online' | 'offline'
  initials: string
  avatarColor: string
  roleColor: string
  permissionsDisplay: string
  last_active: string
}

const AVATAR_COLORS = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500']

export default function Staff() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Admin')
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'offline'>('all')
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<TeamMember | null>(null)
  
  // Add Staff form states
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newRole, setNewRole] = useState('staff')
  const [newIsActive, setNewIsActive] = useState(true)
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Edit Staff form states
  const [editPassword, setEditPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editError, setEditError] = useState('')

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Notification and profile states
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    fetchData()
    fetchUserName()
    fetchOrdersForNotifications()
  }, [])

  const fetchOrdersForNotifications = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      const ordersWithTime = data.map((order: Order) => ({
        ...order,
        time_ago: getTimeAgo(order.created_at)
      }))
      setAllOrders(ordersWithTime)
      
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentOrders = data.filter((o: Order) => new Date(o.created_at) > last24Hours)
      setNewOrdersCount(recentOrders.length)
    }
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })

      if (staffError) {
        console.error('Error fetching staff:', staffError)
      } else {
        const processedStaff = (staffData || []).map((member, index) => processStaffMember(member, index))
        setStaff(processedStaff)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const processStaffMember = (member: any, index: number): TeamMember => {
    const names = member.full_name?.split(' ') || [member.email.split('@')[0]]
    const initials = names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase()
    
    const roleOption = ROLE_OPTIONS.find(r => r.value === member.role) || ROLE_OPTIONS.find(r => r.value === 'staff') || ROLE_OPTIONS[ROLE_OPTIONS.length - 1]
    
    // Determine online status based on last_signed_in
    const lastSignIn = member.last_signed_in ? new Date(member.last_signed_in) : null
    const isOnline = lastSignIn && (new Date().getTime() - lastSignIn.getTime()) < 5 * 60 * 1000 // 5 minutes
    
    // Format last active
    let lastActive = 'Never'
    if (lastSignIn) {
      const diff = new Date().getTime() - lastSignIn.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) lastActive = 'Now'
      else if (minutes < 60) lastActive = `${minutes}m ago`
      else if (hours < 24) lastActive = `${hours}h ago`
      else if (days < 7) lastActive = `${days}d ago`
      else lastActive = lastSignIn.toLocaleDateString()
    }

    return {
      ...member,
      initials,
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      roleColor: roleOption.color,
      permissionsDisplay: roleOption.permissions,
      status: isOnline ? 'online' : 'offline',
      last_active: lastActive
    }
  }

  const resetAddForm = () => {
    setNewFullName('')
    setNewEmail('')
    setNewPassword('')
    setShowPassword(false)
    setNewRole('staff')
    setNewIsActive(true)
    setAddError('')
  }

  const callEdgeFunction = async (action: string, payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbxiureeqjywsabxrckv.supabase.co'
    const res = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ action, ...payload }),
    })
    return res.json()
  }

  const handleAddStaff = async () => {
    if (!newFullName.trim()) { setAddError('Full name is required'); return }
    if (!newEmail.trim()) { setAddError('Email is required'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) { setAddError('Enter a valid email address'); return }
    if (!newPassword.trim()) { setAddError('Password is required'); return }
    if (newPassword.length < 6) { setAddError('Password must be at least 6 characters'); return }

    setAdding(true)
    setAddError('')
    try {
      // Step 1: Create auth.users entry via Edge Function (service role)
      const edgeResult = await callEdgeFunction('create_user', {
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
      })

      if (edgeResult.error) {
        setAddError(edgeResult.error === 'User already exists'
          ? 'A user with this email already exists.'
          : edgeResult.error)
        return
      }

      const authUserId = edgeResult.user?.id

      // Step 2: Insert into public.staff with the real auth user_id
      const { data, error } = await supabase
        .from('staff')
        .insert({
          user_id: authUserId,
          full_name: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          is_active: newIsActive,
          permissions: {},
        })
        .select()
        .single()

      if (error) {
        // Auth user was created but staff row failed — still show success but warn
        setAddError(`Auth user created but staff record failed: ${error.message}. Contact support.`)
        return
      }

      const { error: syncError } = await supabase.rpc('sync_staff_role_assignment', {
        target_staff_id: data.id,
        target_role_code: newRole,
      })

      if (syncError) {
        console.warn('Failed to sync staff role assignment:', syncError)
      }

      const processed = processStaffMember(data, staff.length)
      setStaff(prev => [processed, ...prev])
      setShowAddModal(false)
      resetAddForm()
      showToast(`${newFullName.trim()} was added successfully.`, 'success')
    } catch (err: any) {
      setAddError(err?.message || 'Unexpected error. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return

    setActionLoading(true)
    try {
      // Step 1: Delete from auth.users via Edge Function
      const edgeResult = await callEdgeFunction('delete_user', {
        email: selectedStaff.email,
      })

      // If user not found in auth, that's fine — just clean up the staff row
      if (edgeResult.error && edgeResult.error !== 'User not found') {
        const errDetail = edgeResult.full ? `${edgeResult.error} | ${JSON.stringify(edgeResult.full)}` : String(edgeResult.error)
        showToast(`Auth error: ${errDetail}`, 'error')
        return
      }

      // Step 2: Delete from public.staff
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', selectedStaff.id)

      if (error) {
        showToast(`Auth account deleted but staff record failed: ${error.message}`, 'error')
        return
      }

      const deletedName = selectedStaff.full_name
      setStaff(staff.filter(s => s.id !== selectedStaff.id))
      setShowDeleteModal(false)
      setSelectedStaff(null)
      showToast(`${deletedName} was removed successfully.`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Unexpected error. Please try again.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return

    setActionLoading(true)
    setEditError('')
    try {
      // Step 1: If password provided, update auth.users via Edge Function
      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          setEditError('Password must be at least 6 characters')
          setActionLoading(false)
          return
        }

        const edgeResult = await callEdgeFunction('reset_password', {
          email: selectedStaff.email,
          newPassword: editPassword,
        })

        if (edgeResult.error) {
          setEditError(`Password update failed: ${edgeResult.error}`)
          setActionLoading(false)
          return
        }
      }

      // Step 2: Update role/active status in public.staff
      const { error } = await supabase
        .from('staff')
        .update({
          role: selectedStaff.role,
          is_active: selectedStaff.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id)

      if (error) {
        setEditError(error.message || 'Failed to update staff record.')
        return
      }

      const { error: syncError } = await supabase.rpc('sync_staff_role_assignment', {
        target_staff_id: selectedStaff.id,
        target_role_code: selectedStaff.role,
      })

      if (syncError) {
        console.warn('Failed to sync updated staff role assignment:', syncError)
      }

      const updatedStaff = staff.map(s =>
        s.id === selectedStaff.id ? processStaffMember({ ...s, ...selectedStaff }, 0) : s
      )
      setStaff(updatedStaff)
      setShowEditModal(false)
      setSelectedStaff(null)
      setEditPassword('')
      setShowEditPassword(false)
      showToast('Staff member updated successfully.', 'success')
    } catch (err: any) {
      setEditError(err?.message || 'Unexpected error. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter staff based on active filter
  const filteredStaff = staff.filter(member => {
    if (activeFilter === 'all') return true
    return member.status === activeFilter
  })

  // Calculate stats
  const totalStaff = staff.length
  const onlineStaff = staff.filter(s => s.status === 'online').length

  const stats = [
    { 
      label: 'Total Staff', 
      value: totalStaff, 
      color: 'text-blue-600',
      filter: 'all' as const,
      icon: Users
    },
    { 
      label: 'Online Now', 
      value: onlineStaff, 
      color: 'text-emerald-600',
      filter: 'online' as const,
      icon: CheckCircle2
    }
  ]

  const getStatusIndicator = (status: string) => {
    if (status === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Online
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Offline
      </span>
    )
  }

  const openEditModal = (member: TeamMember) => {
    setSelectedStaff(member)
    setEditPassword('')
    setShowEditPassword(false)
    setEditError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (member: TeamMember) => {
    setSelectedStaff(member)
    setShowDeleteModal(true)
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Staff</h1>
              <p className="text-[11px] text-gray-500">Manage your team and access permissions.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { resetAddForm(); setShowAddModal(true) }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add staff
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

        <div className="px-4 py-5 sm:px-6 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat) => (
              <button
                key={stat.label}
                type="button"
                onClick={() => setActiveFilter(stat.filter)}
                className={`rounded-xl border bg-white p-3.5 text-left transition-all ${
                  activeFilter === stat.filter
                    ? 'border-indigo-400 ring-1 ring-indigo-500/20 shadow-sm'
                    : 'border-[#D9D0C2] hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('600', '50')}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-800">Team members</p>
                {activeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                  >
                    {activeFilter === 'online' ? 'Online only' : 'Offline only'}
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-gray-500">{filteredStaff.length} shown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0D4] bg-[#FBF8F2]/60">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Member</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Role</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Permissions</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Last active</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                        Loading team members…
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No team members found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr key={member.id} className="border-b border-[#F0E9DC] last:border-0 hover:bg-[#F7F2E8]/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 ${member.avatarColor} rounded-full flex items-center justify-center text-white text-[11px] font-semibold`}>
                              {member.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{member.full_name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${member.roleColor}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 text-[11px] text-gray-600">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[10rem]">{member.permissionsDisplay}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">{getStatusIndicator(member.status)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] text-gray-500">{member.last_active}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(member)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-[#F7F2E8] rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(member)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showAddModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); resetAddForm() } }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#D9D0C2] bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Add staff member</h2>
                <button type="button" onClick={() => { setShowAddModal(false); resetAddForm() }} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Full name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jane@carecraftz.com"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} — {option.permissions}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-[#E8E0D4] bg-[#F7F2E8] px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Active account</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {ROLE_OPTIONS.find((r) => r.value === newRole)?.permissions}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsActive((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newIsActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${newIsActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                {addError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{addError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <button type="button" onClick={() => { setShowAddModal(false); resetAddForm() }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleAddStaff()}
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {adding ? 'Adding…' : 'Add staff'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedStaff && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false) }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#D9D0C2] bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Edit staff member</h2>
                <button type="button" onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 ${selectedStaff.avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {selectedStaff.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{selectedStaff.full_name}</p>
                    <p className="text-[11px] text-gray-500">{selectedStaff.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={selectedStaff.role}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-[#E8E0D4] bg-[#F7F2E8] px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStaff.is_active}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, is_active: e.target.checked })}
                    className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">Account active</span>
                </label>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">New password (optional)</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <button type="button" onClick={() => setShowEditPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {editError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{editError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdateStaff()}
                  disabled={actionLoading}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedStaff && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#D9D0C2] bg-white shadow-xl overflow-hidden">
              <div className="px-4 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Remove staff member</h2>
                <p className="mt-1.5 text-xs text-gray-600">
                  Remove <span className="font-medium text-gray-900">“{selectedStaff.full_name}”</span> from your team? This can’t be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[#E8E0D4] bg-[#FBF8F2] px-4 py-3">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white" disabled={actionLoading}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteStaff()}
                  disabled={actionLoading}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

