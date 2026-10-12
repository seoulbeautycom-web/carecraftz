import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_OPS_SETTINGS,
  type PlatformOpsSettings,
  fetchPlatformOpsSettings,
} from '../lib/opsSettings'
import {
  DEFAULT_STORE_SETTINGS,
  type ContactInfoRow,
  type PlatformStoreSettings,
  type SocialLinkRow,
  digitsOnlyPhone,
  fetchActiveContactInfo,
  fetchActiveSocialLinks,
  fetchPlatformStoreSettings,
  getContactByType,
} from '../lib/storeSettings'

interface StorefrontIdentityValue {
  loading: boolean
  store: PlatformStoreSettings
  ops: PlatformOpsSettings
  contacts: ContactInfoRow[]
  socialLinks: SocialLinkRow[]
  whatsappDigits: string
  phoneDisplay: string
  emailDisplay: string
  announcements: string[]
  announcementBg: string
  refresh: () => Promise<void>
}

const StorefrontIdentityContext = createContext<StorefrontIdentityValue | null>(null)

export function StorefrontIdentityProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<PlatformStoreSettings>(DEFAULT_STORE_SETTINGS)
  const [ops, setOps] = useState<PlatformOpsSettings>(DEFAULT_OPS_SETTINGS)
  const [contacts, setContacts] = useState<ContactInfoRow[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([])

  const refresh = async () => {
    setLoading(true)
    try {
      const [nextStore, nextOps, nextContacts, nextSocial] = await Promise.all([
        fetchPlatformStoreSettings(),
        fetchPlatformOpsSettings(),
        fetchActiveContactInfo(),
        fetchActiveSocialLinks(),
      ])
      setStore(nextStore)
      setOps(nextOps)
      setContacts(nextContacts)
      setSocialLinks(nextSocial)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--cc-primary', ops.themes.primary_color || DEFAULT_OPS_SETTINGS.themes.primary_color)
    root.style.setProperty('--cc-accent', ops.themes.accent_color || DEFAULT_OPS_SETTINGS.themes.accent_color)
    root.style.setProperty(
      '--cc-announcement-bg',
      ops.themes.announcement_bg || DEFAULT_OPS_SETTINGS.themes.announcement_bg,
    )
  }, [ops.themes.accent_color, ops.themes.announcement_bg, ops.themes.primary_color])

  useEffect(() => {
    if (!ops.domain.force_https) return
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return
    if (window.location.protocol === 'http:') {
      window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`)
    }
  }, [ops.domain.force_https])

  const value = useMemo<StorefrontIdentityValue>(() => {
    const whatsappRaw = getContactByType(contacts, 'whatsapp') || store.phone
    const phoneDisplay = getContactByType(contacts, 'phone') || store.phone
    const emailDisplay = getContactByType(contacts, 'email') || store.email
    return {
      loading,
      store,
      ops,
      contacts,
      socialLinks,
      whatsappDigits: digitsOnlyPhone(whatsappRaw),
      phoneDisplay,
      emailDisplay,
      announcements: ops.announcements,
      announcementBg: ops.themes.announcement_bg || DEFAULT_OPS_SETTINGS.themes.announcement_bg,
      refresh,
    }
  }, [contacts, loading, ops, socialLinks, store])

  return (
    <StorefrontIdentityContext.Provider value={value}>{children}</StorefrontIdentityContext.Provider>
  )
}

export function useStorefrontIdentity() {
  const ctx = useContext(StorefrontIdentityContext)
  if (!ctx) {
    throw new Error('useStorefrontIdentity must be used within StorefrontIdentityProvider')
  }
  return ctx
}
