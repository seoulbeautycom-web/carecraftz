import { type FormEvent, useEffect, useMemo, useState } from 'react'
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
import {
  DEFAULT_STORE_SETTINGS,
  LOCATION_META,
  type StoreLocationCode,
  fetchPlatformStoreSettings,
  formatFullPhone,
  savePlatformStoreSettings,
  stripDialCode,
} from '../../lib/storeSettings'

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

type StoreDraft = {
  name: string
  url: string
  email: string
  phoneLocal: string
  location: StoreLocationCode
  street: string
  city: string
  region: string
  postal: string
}

const settingsToDraft = (settings: typeof DEFAULT_STORE_SETTINGS): StoreDraft => {
  const dial = LOCATION_META[settings.location_code].dialCode
  return {
    name: settings.name,
    url: settings.website_url,
    email: settings.email,
    phoneLocal: stripDialCode(settings.phone, dial),
    location: settings.location_code,
    street: settings.street,
    city: settings.city,
    region: settings.region,
    postal: settings.postal,
  }
}

const EMPTY_DRAFT = settingsToDraft(DEFAULT_STORE_SETTINGS)

export default function MyStoreSetupPanel() {
  const [subTab, setSubTab] = useState<SetupSubTab>('store')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [storeSaveError, setStoreSaveError] = useState('')
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
  const [storeName, setStoreName] = useState(EMPTY_DRAFT.name)
  const [storeUrl, setStoreUrl] = useState(EMPTY_DRAFT.url)
  const [storeEmail, setStoreEmail] = useState(EMPTY_DRAFT.email)
  const [storePhoneLocal, setStorePhoneLocal] = useState(EMPTY_DRAFT.phoneLocal)
  const [storeLocation, setStoreLocation] = useState<StoreLocationCode>(EMPTY_DRAFT.location)
  const [street, setStreet] = useState(EMPTY_DRAFT.street)
  const [city, setCity] = useState(EMPTY_DRAFT.city)
  const [region, setRegion] = useState(EMPTY_DRAFT.region)
  const [postal, setPostal] = useState(EMPTY_DRAFT.postal)
  const [baseline, setBaseline] = useState<StoreDraft>(EMPTY_DRAFT)
  const [storeTagline, setStoreTagline] = useState(DEFAULT_STORE_SETTINGS.tagline)
  const [showChangesList, setShowChangesList] = useState(false)

  const applyStoreDraft = (draft: StoreDraft) => {
    setStoreName(draft.name)
    setStoreUrl(draft.url)
    setStoreEmail(draft.email)
    setStorePhoneLocal(draft.phoneLocal)
    setStoreLocation(draft.location)
    setStreet(draft.street)
    setCity(draft.city)
    setRegion(draft.region)
    setPostal(draft.postal)
    setBaseline(draft)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settings, socialResult, contactResult] = await Promise.all([
        fetchPlatformStoreSettings(),
        supabase.from('social_media_settings').select('*').order('display_order', { ascending: true }),
        supabase.from('contact_info').select('*').order('display_order', { ascending: true }),
      ])
      applyStoreDraft(settingsToDraft(settings))
      setStoreTagline(settings.tagline || DEFAULT_STORE_SETTINGS.tagline)
      setSocialLinks((socialResult.data || []) as SocialLink[])
      setContactInfo((contactResult.data || []) as ContactInfo[])
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

  const locationMeta = LOCATION_META[storeLocation]
  const dialCode = locationMeta.dialCode

  const pendingChanges = useMemo(() => {
    const changes: string[] = []
    if (storeName.trim() !== baseline.name) {
      changes.push(`Name: “${baseline.name}” → “${storeName.trim()}”`)
    }
    if (storeUrl.trim() !== baseline.url) {
      changes.push(`URL: “${baseline.url}” → “${storeUrl.trim()}”`)
    }
    if (storeEmail.trim() !== baseline.email) {
      changes.push(`Email: “${baseline.email}” → “${storeEmail.trim()}”`)
    }
    if (storePhoneLocal.trim() !== baseline.phoneLocal) {
      const from = formatFullPhone(LOCATION_META[baseline.location].dialCode, baseline.phoneLocal)
      const to = formatFullPhone(dialCode, storePhoneLocal)
      changes.push(`Phone: “${from}” → “${to}”`)
    }
    if (storeLocation !== baseline.location) {
      changes.push(`Location: ${LOCATION_META[baseline.location].label} → ${locationMeta.label}`)
    }
    if (street.trim() !== baseline.street) changes.push('Street address updated')
    if (city.trim() !== baseline.city) changes.push('City updated')
    if (region.trim() !== baseline.region) changes.push('Region updated')
    if (postal.trim() !== baseline.postal) changes.push('Postal code updated')
    return changes
  }, [
    baseline,
    city,
    dialCode,
    locationMeta.label,
    postal,
    region,
    storeEmail,
    storeLocation,
    storeName,
    storePhoneLocal,
    storeUrl,
    street,
  ])

  const hasPendingChanges = pendingChanges.length > 0

  const handleLocationChange = (next: StoreLocationCode) => {
    const previousDial = LOCATION_META[storeLocation].dialCode
    const nextDial = LOCATION_META[next].dialCode
    setStoreLocation(next)
    if (previousDial !== nextDial) {
      setStorePhoneLocal((current) => stripDialCode(current, previousDial))
    }
  }

  const handleSaveStoreDetails = async () => {
    if (!hasPendingChanges || savingStore) return
    setSavingStore(true)
    setStoreSaveError('')
    const nextBaseline: StoreDraft = {
      name: storeName.trim(),
      url: storeUrl.trim(),
      email: storeEmail.trim(),
      phoneLocal: storePhoneLocal.trim(),
      location: storeLocation,
      street: street.trim(),
      city: city.trim(),
      region: region.trim(),
      postal: postal.trim(),
    }
    const dial = LOCATION_META[nextBaseline.location].dialCode
    const { settings, error } = await savePlatformStoreSettings({
      name: nextBaseline.name,
      website_url: nextBaseline.url,
      email: nextBaseline.email,
      phone: formatFullPhone(dial, nextBaseline.phoneLocal),
      location_code: nextBaseline.location,
      street: nextBaseline.street,
      city: nextBaseline.city,
      region: nextBaseline.region,
      postal: nextBaseline.postal,
      currency: LOCATION_META[nextBaseline.location].currency,
      timezone: LOCATION_META[nextBaseline.location].timezone,
      tagline: storeTagline || DEFAULT_STORE_SETTINGS.tagline,
    })

    if (error) {
      setStoreSaveError(error)
      setSavingStore(false)
      return
    }

    applyStoreDraft(settingsToDraft(settings))
    setStoreTagline(settings.tagline || DEFAULT_STORE_SETTINGS.tagline)
    setShowChangesList(false)
    await fetchData()
    setSavingStore(false)
  }

  useEffect(() => {
    setShowChangesList(false)
  }, [subTab])

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#D9D0C2] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E0D4] bg-[#FBF8F2] flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800">My Store setup</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Store details, social links, and contact info shown on CareCraftz.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasPendingChanges ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChangesList((open) => !open)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingChanges.length}
                  </span>
                  pending
                </button>
                {showChangesList ? (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-72 max-h-56 overflow-y-auto rounded-xl border border-[#D9D0C2] bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Pending changes
                    </p>
                    <ul className="space-y-1">
                      {pendingChanges.map((change) => (
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
              onClick={() => void handleSaveStoreDetails()}
              disabled={!hasPendingChanges || savingStore}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingStore ? 'Saving…' : 'Save'}
            </button>
          </div>
          {storeSaveError ? (
            <p className="w-full text-[11px] text-rose-600 mt-1">{storeSaveError}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[11.5rem_minmax(0,1fr)] min-h-[22rem]">
          <aside className="border-b md:border-b-0 md:border-r border-[#E8E0D4] bg-[#FBF8F2]/80 p-2 space-y-1">
            {subTabs.map((tab) => {
              const isActive = subTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSubTab(tab.key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-indigo-700 border border-[#D9D0C2] shadow-sm'
                      : 'text-gray-600 border border-transparent hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </aside>

          <div className="p-4">
          {subTab === 'store' && (
            <div className="max-w-2xl space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-800 mb-1">Store details</p>
                <p className="text-[11px] text-gray-500 mb-3">
                  Edit your CareCraftz identity. Location sets currency, timezone, and phone country code.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Store name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Store URL</label>
                    <input
                      type="text"
                      value={storeUrl}
                      onChange={(event) => setStoreUrl(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={(event) => setStoreEmail(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Phone</label>
                    <div className="flex overflow-hidden rounded-lg border border-[#D9D0C2] bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400">
                      <span className="inline-flex items-center border-r border-[#D9D0C2] bg-[#F0E9DC] px-3 text-sm font-semibold text-gray-700 select-none">
                        {dialCode}
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={storePhoneLocal}
                        onChange={(event) => setStorePhoneLocal(event.target.value.replace(/[^\d\s-]/g, ''))}
                        placeholder="50 000 0000"
                        className="min-w-0 flex-1 bg-white px-3 py-2 text-sm outline-none"
                        aria-label="Phone number without country code"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-500">Country code is locked to the store location.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Location</label>
                    <div className="relative">
                      <select
                        value={storeLocation}
                        onChange={(event) => handleLocationChange(event.target.value as StoreLocationCode)}
                        className="w-full appearance-none rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      >
                        <option value="UAE">United Arab Emirates</option>
                        <option value="Pakistan">Pakistan</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Currency {locationMeta.currency} · Timezone {locationMeta.timezone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#D9D0C2] bg-[#FBF8F2]/80 p-4">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-gray-800">Address</h3>
                  <p className="text-[11px] text-gray-500">Optional mailing / business address</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Street address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">{locationMeta.regionHint}</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder={storeLocation === 'UAE' ? 'Dubai' : 'Karachi'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1.5">Postal code</label>
                    <input
                      type="text"
                      value={postal}
                      onChange={(event) => setPostal(event.target.value)}
                      className="w-full rounded-lg border border-[#D9D0C2] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      placeholder="00000"
                    />
                  </div>
                </div>
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
