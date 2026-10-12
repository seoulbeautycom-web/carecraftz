import { supabase } from './supabase'
import { ROLE_OPTIONS } from './rbac'

export interface TeamMember {
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

export const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-rose-500',
]

export const processStaffMember = (member: Record<string, unknown>, index: number): TeamMember => {
  const fullName = String(member.full_name ?? '')
  const email = String(member.email ?? '')
  const names = fullName.split(' ').filter(Boolean)
  const initials =
    names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : (names[0] || email.split('@')[0] || '?').substring(0, 2).toUpperCase()

  const role = String(member.role ?? 'staff')
  const roleOption =
    ROLE_OPTIONS.find((option) => option.value === role) ??
    ROLE_OPTIONS.find((option) => option.value === 'staff') ??
    ROLE_OPTIONS[ROLE_OPTIONS.length - 1]

  const lastSignIn = member.last_signed_in ? new Date(String(member.last_signed_in)) : null
  const isOnline =
    lastSignIn !== null && Date.now() - lastSignIn.getTime() < 5 * 60 * 1000

  let lastActive = 'Never'
  if (lastSignIn) {
    const diff = Date.now() - lastSignIn.getTime()
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
    id: String(member.id),
    user_id: String(member.user_id ?? ''),
    full_name: fullName,
    email,
    role,
    permissions: (member.permissions as Record<string, boolean>) ?? {},
    is_active: Boolean(member.is_active),
    last_signed_in: member.last_signed_in ? String(member.last_signed_in) : null,
    created_at: String(member.created_at ?? ''),
    initials,
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    roleColor: roleOption.color,
    permissionsDisplay: roleOption.permissions,
    status: isOnline ? 'online' : 'offline',
    last_active: lastActive,
  }
}

export async function callStaffAuthEdgeFunction(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbxiureeqjywsabxrckv.supabase.co'
  const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({ action, ...payload }),
  })
  return response.json()
}
