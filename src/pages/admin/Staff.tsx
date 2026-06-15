import { useEffect, useState } from 'react'
import { 
  Search, 
  ChevronDown, 
  Bell,
  Plus,
  Mail
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'

interface TeamMember {
  id: string
  name: string
  initials: string
  avatarColor: string
  email: string
  role: string
  roleColor: string
  permissions: string
  status: 'online' | 'offline'
  lastActive: string
}

interface PendingInvite {
  id: string
  email: string
  role: string
  invitedBy: string
  date: string
}

export default function Staff() {
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    fetchUserName()
  }, [])

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const name = session.user.email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  // Sample team members
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Alex M.',
      initials: 'AM',
      avatarColor: 'bg-orange-500',
      email: 'alex@petalandroot.co',
      role: 'Owner',
      roleColor: 'bg-amber-100 text-amber-700',
      permissions: 'Full access',
      status: 'online',
      lastActive: 'Now'
    },
    {
      id: '2',
      name: 'Jordan Lee',
      initials: 'JL',
      avatarColor: 'bg-blue-500',
      email: 'jordan@petalandroot.co',
      role: 'Admin',
      roleColor: 'bg-blue-100 text-blue-700',
      permissions: 'Full access',
      status: 'online',
      lastActive: '2h ago'
    },
    {
      id: '3',
      name: 'Taylor W.',
      initials: 'TW',
      avatarColor: 'bg-purple-500',
      email: 'taylor@petalandroot.co',
      role: 'Editor',
      roleColor: 'bg-purple-100 text-purple-700',
      permissions: 'Products, Content',
      status: 'offline',
      lastActive: 'Yesterday'
    },
    {
      id: '4',
      name: 'Sam C.',
      initials: 'SC',
      avatarColor: 'bg-emerald-500',
      email: 'sam@petalandroot.co',
      role: 'Support',
      roleColor: 'bg-emerald-100 text-emerald-700',
      permissions: 'Orders, Customers',
      status: 'offline',
      lastActive: '3d ago'
    },
    {
      id: '5',
      name: 'Morgan B.',
      initials: 'MB',
      avatarColor: 'bg-pink-500',
      email: 'morgan@petalandroot.co',
      role: 'Analyst',
      roleColor: 'bg-pink-100 text-pink-700',
      permissions: 'Analytics only',
      status: 'offline',
      lastActive: '1w ago'
    }
  ]

  // Sample pending invites
  const pendingInvites: PendingInvite[] = [
    {
      id: '1',
      email: 'riley@example.com',
      role: 'Editor',
      invitedBy: 'Admin',
      date: 'Sent Jun 12, 2026'
    }
  ]

  const stats = [
    { label: 'Total Staff', value: 5, color: 'text-blue-600' },
    { label: 'Online Now', value: 2, color: 'text-emerald-600' },
    { label: 'Pending Invites', value: 1, color: 'text-amber-600' }
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

  return (
    <AdminLayout>
      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
              <p className="text-sm text-gray-500">Manage your team and access permissions.</p>
            </div>
            
            {/* Right - Search & Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
              <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                New
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userName.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Invite Staff
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
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${member.avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                            {member.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${member.roleColor}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {member.permissions}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusIndicator(member.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{member.lastActive}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invites Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Pending Invites</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                      <p className="text-xs text-gray-500">Invited as {invite.role} · {invite.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      Resend
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
