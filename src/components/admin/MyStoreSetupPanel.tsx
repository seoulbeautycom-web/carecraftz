import { FormEvent, useEffect, useState } from 'react'
import {
  CheckCircle,
  ChevronDown,
  Facebook,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Twitter,
  XCircle,
  Youtube,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SocialLink {
  id: string
  platform: string
  url: string
  username: string
  is_active: boolean
  display_order: number
  notes: string
}

interface ContactInfo {
  id: string
  type: string
  value: string
  display_label: string
  is_active: boolean
  display_order: number
  notes: string
}

type SetupSubTab = 'store' | 'social' | 'contact'

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Link2,
  pinterest: Link2,
}

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
}

const getContactIcon = (type: string) => {
  switch (type) {
    case 'whatsapp':
      return MessageCircle
    case 'phone':
      return Phone
    default:
      return Globe
  }
}

export default function MyStoreSetupPanel() {
  const [subTab, setSubTab] = useState<SetupSubTab>('store')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSocial, setShowAddSocial] = useState(false)
  const [newSocial, setNewSocial] = useState({
    platform: 'facebook',
    url: '',
    username: '',
    notes: '',
  })
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editContactValue, setEditContactValue] = useState('')
  const [editContactLabel, setEditContactLabel] = useState('')
  const [editContactNotes, setEditContactNotes] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: socialData }, { data: contactData }] = await Promise.all([
        supabase.from('social_media_settings').select('*').order('display_order', { ascending: true }),
        supabase.from('contact_info').select('*').order('display_order', { ascending: true }),
      ])
      setSocialLinks(socialData || [])
      setContactInfo(contactData || [])
    } catch (err) {
      console.error('Error fetching store setup data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const handleAddSocial = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('social_media_settings').insert([
        {
          ...newSocial,
          is_active: true,
          display_order: socialLinks.length,
        },
      ])
      if (error) throw error
      setShowAddSocial(false)
      setNewSocial({ platform: 'facebook', url: '', username: '', notes: '' })
      await fetchData()
    } catch (err) {
      console.error('Error adding social link:', err)
      alert('Failed to add social link')
    }
  }

  const toggleSocialStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('social_media_settings')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error updating social link:', err)
    }
  }

  const deleteSocialLink = async (id: string) => {
    if (!confirm('Remove this social link?')) return
    try {
      const { error } = await supabase.from('social_media_settings').delete().eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error deleting social link:', err)
    }
  }

  const updateContactInfo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_info')
        .update({
          value: editContactValue,
          display_label: editContactLabel,
          notes: editContactNotes,
        })
        .eq('id', id)
      if (error) throw error
      setEditingContact(null)
      await fetchData()
    } catch (err) {
      console.error('Error updating contact info:', err)
    }
  }

  const toggleContactStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_info')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error updating contact info:', err)
    }
  }

  const startEditingContact = (contact: ContactInfo) => {
    setEditingContact(contact.id)
    setEditContactValue(contact.value)
    setEditContactLabel(contact.display_label || '')
    setEditContactNotes(contact.notes || '')
  }

  const subTabs: { key: SetupSubTab; label: string }[] = [
    { key: 'store', label: 'Store details' },
    { key: 'social', label: 'Social media' },
    { key: 'contact', label: 'Contact' },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2]">
          <p className="text-xs font-semibold text-gray-800">My Store setup</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Store details, social links, and contact info shown on CareCraftz.
          </p>
        </div>

        <div className="px-4 pt-3 flex flex-wrap gap-1.5 border-b border-[#E8E0D4]">
          {subTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSubTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                subTab === tab.key
                  ? 'bg-white border-[#D9D0C2] text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {subTab === 'store' && (
            <div className="max-w-2xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Store name</label>
                  <input
                    type="text"
                    defaultValue="CareCraftz"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Store URL</label>
                  <input
                    type="text"
                    defaultValue="carecraftz.com"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue="hello@carecraftz.com"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    defaultValue="+971 50 000 0000"
                    className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Currency</label>
                  <div className="relative">
                    <select
                      defaultValue="AED"
                      className="w-full appearance-none rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    >
                      <option value="AED">AED — UAE Dirham</option>
                      <option value="PKR">PKR — Pakistani Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Timezone</label>
                  <div className="relative">
                    <select
                      defaultValue="Asia/Dubai"
                      className="w-full appearance-none rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    >
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Asia/Karachi">Asia/Karachi</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8E0D4] pt-4">
                <h3 className="text-xs font-semibold text-gray-800 mb-3">Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Street address</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">City</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Emirate / region</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="Dubai"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Postal code</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="00000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Save store details
                </button>
              </div>
            </div>
          )}

          {subTab === 'social' && (
            <div>
              {loading ? (
                <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-[11px] text-gray-500">
                      {socialLinks.filter((s) => s.is_active).length} of {socialLinks.length} links active
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddSocial(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add social link
                    </button>
                  </div>

                  {socialLinks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 py-10 text-center">
                      <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No social media links yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {socialLinks.map((link) => {
                        const Icon = platformIcons[link.platform] || Link2
                        return (
                          <div
                            key={link.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#D9D0C2] bg-white px-3 py-2.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  link.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900">
                                  {platformLabels[link.platform] || link.platform}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">@{link.username || 'No username'}</p>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-indigo-600 hover:underline truncate block"
                                >
                                  {link.url}
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => void toggleSocialStatus(link.id, link.is_active)}
                                className={`p-1.5 rounded-lg ${
                                  link.is_active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {link.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteSocialLink(link.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {subTab === 'contact' && (
            <div>
              {loading ? (
                <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
              ) : contactInfo.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D9D0C2] bg-[#F7F2E8]/50 py-10 text-center">
                  <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No contact information configured</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactInfo.map((contact) => {
                    const Icon = getContactIcon(contact.type)
                    const isEditing = editingContact === contact.id
                    return (
                      <div key={contact.id} className="rounded-xl border border-[#D9D0C2] bg-white px-3 py-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-900 capitalize">{contact.type}</p>
                            <input
                              type="text"
                              value={editContactValue}
                              onChange={(e) => setEditContactValue(e.target.value)}
                              className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
                              placeholder="Value"
                            />
                            <input
                              type="text"
                              value={editContactLabel}
                              onChange={(e) => setEditContactLabel(e.target.value)}
                              className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
                              placeholder="Display label"
                            />
                            <textarea
                              rows={2}
                              value={editContactNotes}
                              onChange={(e) => setEditContactNotes(e.target.value)}
                              className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
                              placeholder="Notes"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingContact(null)}
                                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-[#F7F2E8]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateContactInfo(contact.id)}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  contact.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 capitalize">{contact.type}</p>
                                <p className="text-sm font-medium text-gray-800 truncate">{contact.value}</p>
                                <p className="text-[11px] text-gray-500">{contact.display_label}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingContact(contact)}
                                className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-gray-700 bg-[#F7F2E8] hover:bg-[#EFE7DA]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void toggleContactStatus(contact.id, contact.is_active)}
                                className={`p-1.5 rounded-lg ${
                                  contact.is_active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {contact.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddSocial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setShowAddSocial(false)} />
          <form
            onSubmit={handleAddSocial}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[#D9D0C2] bg-white shadow-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-gray-900">Add social media link</h3>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Platform</label>
              <select
                value={newSocial.platform}
                onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
              >
                {Object.entries(platformLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Profile URL *</label>
              <input
                type="url"
                required
                value={newSocial.url}
                onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
                className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
                placeholder="https://instagram.com/carecraftz"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Username</label>
              <input
                type="text"
                value={newSocial.username}
                onChange={(e) => setNewSocial({ ...newSocial, username: e.target.value })}
                className="w-full rounded-lg border border-[#D9D0C2] px-3 py-2 text-sm"
                placeholder="@carecraftz"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAddSocial(false)} className="rounded-lg px-3 py-1.5 text-xs text-gray-600">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">
                Add link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
