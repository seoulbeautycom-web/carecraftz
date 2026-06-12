import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, Plus, Edit, Trash2, LogOut, Shield, Mail, User } from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  email: string
  full_name: string
  role: string
  permissions: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function StaffManagement() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'staff',
    is_active: true
  })

  useEffect(() => {
    checkAuth()
    fetchStaff()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/admin/login')
    }
  }

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (error: any) {
      console.error('Error fetching staff:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const handleAddStaff = () => {
    setEditingStaff(null)
    setFormData({ email: '', full_name: '', role: 'staff', is_active: true })
    setShowModal(true)
  }

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      is_active: member.is_active
    })
    setShowModal(true)
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const { error } = await supabase.from('staff').delete().eq('id', id)
      if (error) throw error
      fetchStaff()
    } catch (error: any) {
      console.error('Error deleting staff:', error.message)
      alert('Failed to delete staff member')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            is_active: formData.is_active
          })
          .eq('id', editingStaff.id)

        if (error) throw error
      } else {
        // Create new staff member (this would require creating a Supabase user first)
        // For now, we'll just insert into staff table
        const { error } = await supabase
          .from('staff')
          .insert({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            is_active: formData.is_active
          })

        if (error) throw error
      }

      setShowModal(false)
      fetchStaff()
    } catch (error: any) {
      console.error('Error saving staff:', error.message)
      alert('Failed to save staff member')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                ← Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.filter(s => s.is_active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{staff.filter(s => s.role === 'admin').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
            <button
              onClick={handleAddStaff}
              className="flex items-center gap-2 bg-forest text-white px-4 py-2 rounded-lg hover:bg-forest-dark transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Staff</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {staff.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No staff members found. Add your first staff member to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingStaff}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent outline-none"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-forest border-gray-300 rounded focus:ring-forest"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
