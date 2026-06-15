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

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-700', permissions: 'Full access' },
  { value: 'editor', label: 'Editor', color: 'bg-purple-100 text-purple-700', permissions: 'Products, Content' },
  { value: 'support', label: 'Support', color: 'bg-emerald-100 text-emerald-700', permissions: 'Orders, Customers' },
  { value: 'analyst', label: 'Analyst', color: 'bg-pink-100 text-pink-700', permissions: 'Analytics only' },
  { value: 'staff', label: 'Staff', color: 'bg-gray-100 text-gray-700', permissions: 'Limited access' }
]

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
    navigate('/login')
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
    
    const roleOption = ROLE_OPTIONS.find(r => r.value === member.role) || ROLE_OPTIONS[4]
    
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
      const { data, error } = await supabase
        .from('staff')
        .insert({
          full_name: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
          is_active: newIsActive,
          permissions: {},
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setAddError('A staff member with this email already exists.')
        } else {
          setAddError(error.message)
        }
        return
      }

      const processed = processStaffMember(data, staff.length)
      setStaff(prev => [processed, ...prev])
      setShowAddModal(false)
      resetAddForm()
    } catch (err) {
      setAddError('Unexpected error. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return
    
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', selectedStaff.id)
      
      if (error) {
        console.error('Error deleting staff:', error)
        alert('Failed to delete staff member.')
      } else {
        setStaff(staff.filter(s => s.id !== selectedStaff.id))
        setShowDeleteModal(false)
        setSelectedStaff(null)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return
    
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          role: selectedStaff.role,
          is_active: selectedStaff.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id)
      
      if (error) {
        console.error('Error updating staff:', error)
        alert('Failed to update staff member.')
      } else {
        const updatedStaff = staff.map(s => 
          s.id === selectedStaff.id ? processStaffMember({ ...s, ...selectedStaff }, 0) : s
        )
        setStaff(updatedStaff)
        setShowEditModal(false)
        setSelectedStaff(null)
      }
    } catch (error) {
      console.error('Error:', error)
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
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Online
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
        Offline
      </span>
    )
  }

  const openEditModal = (member: TeamMember) => {
    setSelectedStaff(member)
    setShowEditModal(true)
  }

  const openDeleteModal = (member: TeamMember) => {
    setSelectedStaff(member)
    setShowDeleteModal(true)
  }

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar - No New button, No Search */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
              <p className="text-sm text-gray-500">Manage your team and access permissions.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Button with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {newOrdersCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">New Orders</h3>
                      <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {newOrdersCount === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No new orders in the last 24 hours</p>
                        </div>
                      ) : (
                        allOrders.slice(0, 5).map((order) => (
                          <div 
                            key={order.id}
                            onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{order.order_code}</span>
                              <span className="text-xs text-gray-500">{order.time_ago}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{order.shipping_address?.full_name || order.customer_email}</p>
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate('/orders'); }}
                        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                      >
                        View all orders
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Button with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">Store Owner</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Clickable Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {stats.map((stat, index) => (
              <button
                key={index}
                onClick={() => stat.filter && setActiveFilter(stat.filter)}
                className={`bg-white rounded-2xl p-6 shadow-sm border text-left transition-all hover:shadow-md ${
                  stat.filter && activeFilter === stat.filter ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('600', '100')}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                {activeFilter !== 'all' && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {activeFilter === 'online' ? 'Online Only' : 'Offline Only'}
                    <button 
                      onClick={() => setActiveFilter('all')}
                      className="ml-2 text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <button 
                onClick={() => { resetAddForm(); setShowAddModal(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Permissions</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading team members...
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr key={member.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${member.avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                              {member.initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${member.roleColor}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            {member.permissionsDisplay}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusIndicator(member.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{member.last_active}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditModal(member)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(member)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Staff Member</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jane@carecraftz.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} — {option.permissions}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active Account</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ROLE_OPTIONS.find(r => r.value === newRole)?.permissions}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsActive(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      newIsActive ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      newIsActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {addError && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{addError}</p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  disabled={adding}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Staff Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Staff Member</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 ${selectedStaff.avatarColor} rounded-full flex items-center justify-center text-white text-lg font-medium`}>
                    {selectedStaff.initials}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStaff.full_name}</p>
                    <p className="text-sm text-gray-500">{selectedStaff.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={selectedStaff.role}
                    onChange={(e) => setSelectedStaff({...selectedStaff, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={selectedStaff.is_active}
                    onChange={(e) => setSelectedStaff({...selectedStaff, is_active: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Account Active
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStaff}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Remove Staff Member?</h2>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove <strong>{selectedStaff.full_name}</strong> from your team? 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {actionLoading ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
