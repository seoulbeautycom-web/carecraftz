import { supabase } from './supabase'

export type StoreLocationCode = 'UAE' | 'Pakistan'

export interface PlatformStoreSettings {
  id?: string
  name: string
  website_url: string
  email: string
  phone: string
  location_code: StoreLocationCode
  street: string
  city: string
  region: string
  postal: string
  currency: string
  timezone: string
  tagline: string
}

export interface ContactInfoRow {
  id: string
  type: 'whatsapp' | 'phone' | 'email' | 'address'
  value: string
  display_label: string | null
  is_active: boolean
  display_order: number
  notes: string | null
}

export interface SocialLinkRow {
  id: string
  platform: string
  url: string
  username: string | null
  is_active: boolean
  display_order: number
  notes: string | null
}

export const LOCATION_META: Record<
  StoreLocationCode,
  { label: string; currency: string; timezone: string; regionHint: string; dialCode: string }
> = {
  UAE: {
    label: 'United Arab Emirates',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    regionHint: 'Emirate / region',
    dialCode: '+971',
  },
  Pakistan: {
    label: 'Pakistan',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    regionHint: 'Province / region',
    dialCode: '+92',
  },
}

export const DEFAULT_STORE_SETTINGS: PlatformStoreSettings = {
  name: 'CareCraftz',
  website_url: 'carecraftz.com',
  email: 'hello@carecraftz.com',
  phone: '+971 50 000 0000',
  location_code: 'UAE',
  street: '',
  city: '',
  region: '',
  postal: '',
  currency: 'AED',
  timezone: 'Asia/Dubai',
  tagline:
    'A trusted skincare marketplace. We verify every seller so you can shop authentic products with confidence.',
}

export const stripDialCode = (phone: string, dialCode: string) => {
  const trimmed = phone.trim()
  if (trimmed.startsWith(dialCode)) return trimmed.slice(dialCode.length).trim()
  if (trimmed.startsWith('+')) return trimmed.replace(/^\+\d{1,3}\s*/, '').trim()
  return trimmed
}

export const formatFullPhone = (dialCode: string, local: string) =>
  `${dialCode} ${local.trim()}`.trim()

export const digitsOnlyPhone = (phone: string) => phone.replace(/\D/g, '')

const mapRow = (row: Record<string, unknown> | null | undefined): PlatformStoreSettings => {
  if (!row) return { ...DEFAULT_STORE_SETTINGS }
  const location =
    row.location_code === 'Pakistan' || row.location_code === 'UAE'
      ? (row.location_code as StoreLocationCode)
      : DEFAULT_STORE_SETTINGS.location_code
  const meta = LOCATION_META[location]
  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    name: String(row.name || DEFAULT_STORE_SETTINGS.name),
    website_url: String(row.website_url || DEFAULT_STORE_SETTINGS.website_url),
    email: String(row.email || DEFAULT_STORE_SETTINGS.email),
    phone: String(row.phone || DEFAULT_STORE_SETTINGS.phone),
    location_code: location,
    street: String(row.street || ''),
    city: String(row.city || ''),
    region: String(row.region || ''),
    postal: String(row.postal || ''),
    currency: String(row.currency || meta.currency),
    timezone: String(row.timezone || meta.timezone),
    tagline: String(row.tagline || DEFAULT_STORE_SETTINGS.tagline),
  }
}

export async function fetchPlatformStoreSettings(): Promise<PlatformStoreSettings> {
  const { data, error } = await supabase
    .from('platform_store_settings')
    .select('*')
    .eq('singleton_key', 'primary')
    .maybeSingle()

  if (error) {
    console.error('Failed to load platform store settings:', error)
    return { ...DEFAULT_STORE_SETTINGS }
  }

  return mapRow(data as Record<string, unknown> | null)
}

export async function savePlatformStoreSettings(
  input: PlatformStoreSettings,
): Promise<{ settings: PlatformStoreSettings; error: string | null }> {
  const meta = LOCATION_META[input.location_code]
  const payload = {
    singleton_key: 'primary',
    name: input.name.trim() || DEFAULT_STORE_SETTINGS.name,
    website_url: input.website_url.trim() || DEFAULT_STORE_SETTINGS.website_url,
    email: input.email.trim(),
    phone: input.phone.trim(),
    location_code: input.location_code,
    street: input.street.trim(),
    city: input.city.trim(),
    region: input.region.trim(),
    postal: input.postal.trim(),
    currency: meta.currency,
    timezone: meta.timezone,
    tagline: input.tagline.trim() || DEFAULT_STORE_SETTINGS.tagline,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('platform_store_settings')
    .upsert(payload, { onConflict: 'singleton_key' })
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('Failed to save platform store settings:', error)
    return { settings: input, error: error.message }
  }

  // Keep flagship partner_stores identity in sync for marketplace badges / fulfilment.
  const { error: flagshipError } = await supabase
    .from('partner_stores')
    .update({
      display_name: payload.name,
      legal_name: payload.name,
      primary_email: payload.email || null,
      phone: payload.phone,
      country: meta.label,
      city: payload.city,
      location: [payload.street, payload.region, payload.postal].filter(Boolean).join(', '),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_type', 'flagship')

  if (flagshipError) {
    console.error('Failed to sync flagship partner store:', flagshipError)
  }

  // Keep public contact_info in sync for WhatsApp / footer.
  await upsertContactValue('email', payload.email, 'Email Us')
  await upsertContactValue('phone', payload.phone, 'Call Us')
  await upsertContactValue('whatsapp', payload.phone, 'WhatsApp Us')
  if (payload.street || payload.city) {
    const address = [payload.street, payload.city, payload.region, payload.postal, meta.label]
      .filter(Boolean)
      .join(', ')
    await upsertContactValue('address', address, 'Visit Us')
  }

  return { settings: mapRow(data as Record<string, unknown> | null), error: null }
}

async function upsertContactValue(
  type: ContactInfoRow['type'],
  value: string,
  displayLabel: string,
) {
  if (!value.trim()) return

  const { data: existing } = await supabase
    .from('contact_info')
    .select('id')
    .eq('type', type)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('contact_info')
      .update({
        value: value.trim(),
        display_label: displayLabel,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    return
  }

  await supabase.from('contact_info').insert({
    type,
    value: value.trim(),
    display_label: displayLabel,
    is_active: true,
    display_order: type === 'whatsapp' ? 0 : type === 'phone' ? 1 : type === 'email' ? 2 : 3,
  })
}

export async function fetchActiveContactInfo(): Promise<ContactInfoRow[]> {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to load contact info:', error)
    return []
  }

  return (data || []) as ContactInfoRow[]
}

export async function fetchActiveSocialLinks(): Promise<SocialLinkRow[]> {
  const { data, error } = await supabase
    .from('social_media_settings')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to load social links:', error)
    return []
  }

  return (data || []) as SocialLinkRow[]
}

export function getContactByType(rows: ContactInfoRow[], type: ContactInfoRow['type']) {
  return rows.find((row) => row.type === type)?.value?.trim() || ''
}

export function productPrimaryImage(product: {
  images?: string[] | string | null
  image?: string | null
}) {
  if (Array.isArray(product.images) && product.images[0]) return product.images[0]
  if (typeof product.images === 'string' && product.images) return product.images
  if (product.image) return product.image
  return ''
}
