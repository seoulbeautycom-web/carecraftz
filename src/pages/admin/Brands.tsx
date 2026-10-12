import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { supabase } from '../../lib/supabase'

interface Brand {
  id: string
  name: string
  logo_url: string
  created_at: string
}

interface HeaderOrder {
  id: string
  order_code: string
  customer_email: string
  created_at: string
  time_ago?: string
  shipping_address?: { full_name: string }
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) return message
  }
  return fallback
}

export default function Brands() {
  const navigate = useNavigate()
  const { hasAnyPermission } = useAdminAccess()
  const canCreate = hasAnyPermission(['products.create', 'products.edit', 'roles.manage'])
  const canEdit = hasAnyPermission(['products.edit', 'roles.manage'])
  const canDelete = hasAnyPermission(['products.delete', 'roles.manage'])

  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [pageSuccess, setPageSuccess] = useState('')
  const [userName, setUserName] = useState('Admin')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [allOrders, setAllOrders] = useState<HeaderOrder[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const fetchUserName = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) {
      const part = session.user.email.split('@')[0]
      setUserName(part.charAt(0).toUpperCase() + part.slice(1))
    }
  }, [])

  const fetchOrdersForNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_code, customer_email, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setAllOrders(data.map((order: HeaderOrder) => ({ ...order, time_ago: getTimeAgo(order.created_at) })))
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNewOrdersCount(data.filter((order: HeaderOrder) => new Date(order.created_at) > last24h).length)
    }
  }, [])

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url, created_at')
        .order('name', { ascending: true })

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Failed to load brands:', error)
      setPageError(getErrorMessage(error, 'Failed to load brands'))
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUserName()
    void fetchOrdersForNotifications()
    void fetchBrands()
  }, [fetchUserName, fetchOrdersForNotifications, fetchBrands])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName('')
    setLogoUrl('')
  }

  const openCreate = () => {
    setEditingId(null)
    setName('')
    setLogoUrl('')
    setShowForm(true)
    setPageError('')
    setPageSuccess('')
  }

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id)
    setName(brand.name)
    setLogoUrl(brand.logo_url || '')
    setShowForm(true)
    setPageError('')
    setPageSuccess('')
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!canCreate && !canEdit) {
      setPageError('You need product edit permission to upload logos.')
      return
    }

    setLogoUploading(true)
    setPageError('')

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `brand-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch (error) {
      console.error('Failed to upload brand logo:', error)
      setPageError(getErrorMessage(error, 'Failed to upload brand logo'))
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setPageError('Brand name is required.')
      return
    }
    if (!logoUrl.trim()) {
      setPageError('Brand logo is required.')
      return
    }

    if (editingId && !canEdit) {
      setPageError('You need products.edit permission to update brands.')
      return
    }
    if (!editingId && !canCreate) {
      setPageError('You need products.create permission to add brands.')
      return
    }

    setSaving(true)
    setPageError('')
    setPageSuccess('')

    try {
      if (editingId) {
        const { error } = await supabase
          .from('brands')
          .update({
            name: trimmedName,
            logo_url: logoUrl.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
        if (error) throw error
        setPageSuccess('Brand updated.')
      } else {
        const { error } = await supabase.from('brands').insert({
          name: trimmedName,
          logo_url: logoUrl.trim(),
        })
        if (error) throw error
        setPageSuccess('Brand added.')
      }
      resetForm()
      await fetchBrands()
    } catch (error) {
      console.error('Failed to save brand:', error)
      setPageError(getErrorMessage(error, 'Failed to save brand'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (brand: Brand) => {
    if (!canDelete) {
      setPageError('You need products.delete permission to remove brands.')
      return
    }
    if (!window.confirm(`Delete brand “${brand.name}”?`)) return

    setPageError('')
    setPageSuccess('')
    try {
      const { error } = await supabase.from('brands').delete().eq('id', brand.id)
      if (error) throw error
      setPageSuccess('Brand deleted.')
      if (editingId === brand.id) resetForm()
      await fetchBrands()
    } catch (error) {
      console.error('Failed to delete brand:', error)
      setPageError(getErrorMessage(error, 'Failed to delete brand'))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F7F2E8]">
        <div className="sticky top-0 z-20 border-b border-[#E8E0D4] bg-[#F7F2E8]/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Brand</h1>
              <p className="text-[11px] text-gray-500">Manage brand names and logos.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add brand
                </button>
              )}

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
                      <p className="text-[10px] text-gray-500">Store Owner</p>
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
                        onClick={handleLogout}
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
          {(pageError || pageSuccess) && (
            <div
              className={`rounded-xl border px-3 py-2 text-xs ${
                pageError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {pageError || pageSuccess}
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-[#D9D0C2] bg-white p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingId ? 'Edit brand' : 'Add brand'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-[#F7F2E8] rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
                <div>
                  <p className="text-[11px] font-medium text-gray-600 mb-1.5">Logo</p>
                  <label className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8] hover:border-indigo-300 transition-colors">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Brand logo preview" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-gray-400">
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-[10px]">{logoUploading ? 'Uploading…' : 'Upload'}</span>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                      disabled={logoUploading || saving}
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="brand-name" className="block text-[11px] font-medium text-gray-600 mb-1.5">
                    Name
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CareCraftz"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    disabled={saving}
                  />
                  <p className="mt-3 text-[11px] text-gray-500">Only name and one logo image.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-[#F7F2E8]"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || logoUploading}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add brand'}
                </button>
              </div>
            </form>
          )}

          <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-800">Brands</p>
              <span className="text-[11px] text-gray-500">{brands.length} total</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-gray-500">Loading brands…</div>
            ) : brands.length === 0 ? (
              <div className="p-10 text-center">
                <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">No brands yet</p>
                <p className="text-[11px] text-gray-500 mt-1">Add a brand with a name and logo.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F0E9DC]">
                {brands.map((brand) => (
                  <li key={brand.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#E8E0D4] bg-[#F7F2E8]">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Tag className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{brand.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(brand)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-[#F7F2E8] rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(brand)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
