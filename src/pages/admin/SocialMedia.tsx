import { useEffect, useState } from 'react'
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Link2, Phone, MessageCircle, Plus, Trash2, CheckCircle, XCircle, Globe } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
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

const platformIcons: Record<string, React.ComponentType<{className?: string}>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Link2,
  pinterest: Link2
}

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  pinterest: 'Pinterest'
}

export default function SocialMedia() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'social' | 'contact'>('social')
  
  // New social link form
  const [showAddSocial, setShowAddSocial] = useState(false)
  const [newSocial, setNewSocial] = useState({
    platform: 'facebook',
    url: '',
    username: '',
    notes: ''
  })

  // Edit contact form
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editContactValue, setEditContactValue] = useState('')
  const [editContactLabel, setEditContactLabel] = useState('')
  const [editContactNotes, setEditContactNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_media_settings')
        .select('*')
        .order('display_order', { ascending: true })

      if (socialError) throw socialError
      setSocialLinks(socialData || [])

      // Fetch contact info
      const { data: contactData, error: contactError } = await supabase
        .from('contact_info')
        .select('*')
        .order('display_order', { ascending: true })

      if (contactError) throw contactError
      setContactInfo(contactData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('social_media_settings')
        .insert([{
          ...newSocial,
          is_active: true,
          display_order: socialLinks.length
        }])

      if (error) throw error
      setShowAddSocial(false)
      setNewSocial({ platform: 'facebook', url: '', username: '', notes: '' })
      fetchData()
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
      fetchData()
    } catch (err) {
      console.error('Error updating social link:', err)
    }
  }

  const deleteSocialLink = async (id: string) => {
    if (!confirm('Are you sure you want to remove this social link?')) return
    
    try {
      const { error } = await supabase
        .from('social_media_settings')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
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
          notes: editContactNotes
        })
        .eq('id', id)

      if (error) throw error
      setEditingContact(null)
      fetchData()
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
      fetchData()
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

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return MessageCircle
      case 'phone': return Phone
      default: return Globe
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Social Media & Contact</h1>
          <p className="text-gray-600 mt-1">Manage social media links and contact information displayed on your website.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('social')}
            className={`pb-3 px-4 text-sm font-medium transition ${
              activeTab === 'social'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Social Media Links
            </span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-4 text-sm font-medium transition ${
              activeTab === 'contact'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : activeTab === 'social' ? (
          <div>
            {/* Add Social Link Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  {socialLinks.filter(s => s.is_active).length} of {socialLinks.length} links active
                </p>
              </div>
              <button
                onClick={() => setShowAddSocial(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Social Link
              </button>
            </div>

            {/* Social Links List */}
            <div className="space-y-4">
              {socialLinks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No social media links added yet</p>
                </div>
              ) : (
                socialLinks.map((link) => {
                  const Icon = platformIcons[link.platform] || Link2
                  return (
                    <div key={link.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            link.is_active ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              link.is_active ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{platformLabels[link.platform]}</h3>
                            <p className="text-sm text-gray-500">@{link.username || 'No username'}</p>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {link.url}
                            </a>
                            {link.notes && (
                              <p className="text-xs text-gray-400 mt-1">{link.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSocialStatus(link.id, link.is_active)}
                            className={`p-2 rounded-lg transition ${
                              link.is_active 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={link.is_active ? 'Active' : 'Inactive'}
                          >
                            {link.is_active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => deleteSocialLink(link.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Add Social Link Modal */}
            {showAddSocial && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
                <div className="my-8 max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Add Social Media Link</h2>
                  <form onSubmit={handleAddSocial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                      <select
                        value={newSocial.platform}
                        onChange={(e) => setNewSocial({...newSocial, platform: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {Object.entries(platformLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile URL *</label>
                      <input
                        type="url"
                        required
                        value={newSocial.url}
                        onChange={(e) => setNewSocial({...newSocial, url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="https://facebook.com/carecraftz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={newSocial.username}
                        onChange={(e) => setNewSocial({...newSocial, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="@carecraftz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        rows={2}
                        value={newSocial.notes}
                        onChange={(e) => setNewSocial({...newSocial, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddSocial(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Add Link
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Contact Info List */}
            <div className="space-y-4">
              {contactInfo.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contact information configured</p>
                </div>
              ) : (
                contactInfo.map((contact) => {
                  const Icon = getContactIcon(contact.type)
                  const isEditing = editingContact === contact.id

                  return (
                    <div key={contact.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <Icon className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 capitalize">{contact.type}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                            <input
                              type="text"
                              value={editContactValue}
                              onChange={(e) => setEditContactValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
                            <input
                              type="text"
                              value={editContactLabel}
                              onChange={(e) => setEditContactLabel(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="e.g., WhatsApp Us, Call Us"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              rows={2}
                              value={editContactNotes}
                              onChange={(e) => setEditContactNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setEditingContact(null)}
                              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => updateContactInfo(contact.id)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              contact.is_active ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-6 h-6 ${
                                contact.is_active ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 capitalize">{contact.type}</h3>
                              <p className="text-lg text-gray-900 font-semibold">{contact.value}</p>
                              <p className="text-sm text-gray-500">{contact.display_label}</p>
                              {contact.notes && (
                                <p className="text-xs text-gray-400 mt-1">{contact.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditingContact(contact)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleContactStatus(contact.id, contact.is_active)}
                              className={`p-2 rounded-lg transition ${
                                contact.is_active 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title={contact.is_active ? 'Active' : 'Inactive'}
                            >
                              {contact.is_active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> These contact details will be displayed on your website's footer and contact page. 
                Make sure the WhatsApp number includes the country code (e.g., +971501234567).
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
