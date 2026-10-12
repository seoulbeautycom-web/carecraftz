import { supabase } from './supabase'

export interface PaymentsSettings {
  cod_enabled: boolean
  card_enabled: boolean
  default_currency: 'AED' | 'PKR'
  accepted_currencies: Array<'AED' | 'PKR'>
  notes: string
}

export interface ShippingSettings {
  uae_flat_rate: number
  pakistan_flat_rate: number
  free_shipping_threshold_aed: number
  free_shipping_threshold_pkr: number
  estimated_days_uae: string
  estimated_days_pakistan: string
}

export interface NotificationSettings {
  email_new_order: boolean
  email_low_stock: boolean
  email_partner_application: boolean
  email_review_submitted: boolean
}

export interface SecuritySettings {
  require_staff_2fa: boolean
  session_timeout_hours: number
  password_min_length: number
}

export interface ThemesSettings {
  primary_color: string
  accent_color: string
  announcement_bg: string
}

export interface DomainSettings {
  primary_domain: string
  www_redirect: boolean
  force_https: boolean
}

export interface PlatformOpsSettings {
  payments: PaymentsSettings
  shipping: ShippingSettings
  notifications: NotificationSettings
  security: SecuritySettings
  themes: ThemesSettings
  domain: DomainSettings
  announcements: string[]
}

export const DEFAULT_OPS_SETTINGS: PlatformOpsSettings = {
  payments: {
    cod_enabled: true,
    card_enabled: false,
    default_currency: 'AED',
    accepted_currencies: ['AED', 'PKR'],
    notes: '',
  },
  shipping: {
    uae_flat_rate: 15,
    pakistan_flat_rate: 200,
    free_shipping_threshold_aed: 0,
    free_shipping_threshold_pkr: 0,
    estimated_days_uae: '1-3 business days',
    estimated_days_pakistan: '3-7 business days',
  },
  notifications: {
    email_new_order: true,
    email_low_stock: true,
    email_partner_application: true,
    email_review_submitted: false,
  },
  security: {
    require_staff_2fa: false,
    session_timeout_hours: 72,
    password_min_length: 8,
  },
  themes: {
    primary_color: '#4F46E5',
    accent_color: '#7B68EE',
    announcement_bg: '#7B68EE',
  },
  domain: {
    primary_domain: 'carecraftz.com',
    www_redirect: true,
    force_https: true,
  },
  announcements: [
    'Every seller is verified before products go live',
    'Authentic skincare — curated for UAE and Pakistan',
    'Business docs, certs, and testing reviewed by our team',
    'CareCraftz Official is one verified seller among many',
  ],
}

const asObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const asStringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : fallback

const mapOps = (row: Record<string, unknown> | null | undefined): PlatformOpsSettings => {
  if (!row) return structuredClone(DEFAULT_OPS_SETTINGS)
  const payments = asObject(row.payments)
  const shipping = asObject(row.shipping)
  const notifications = asObject(row.notifications)
  const security = asObject(row.security)
  const themes = asObject(row.themes)
  const domain = asObject(row.domain)

  return {
    payments: {
      cod_enabled: Boolean(payments.cod_enabled ?? DEFAULT_OPS_SETTINGS.payments.cod_enabled),
      // Never treat card as live until a PSP is integrated.
      card_enabled: false,
      default_currency:
        payments.default_currency === 'PKR' || payments.default_currency === 'AED'
          ? payments.default_currency
          : DEFAULT_OPS_SETTINGS.payments.default_currency,
      accepted_currencies: Array.isArray(payments.accepted_currencies)
        ? (payments.accepted_currencies.filter((c) => c === 'AED' || c === 'PKR') as Array<'AED' | 'PKR'>)
        : DEFAULT_OPS_SETTINGS.payments.accepted_currencies,
      notes: String(payments.notes ?? ''),
    },
    shipping: {
      uae_flat_rate: Number(shipping.uae_flat_rate ?? DEFAULT_OPS_SETTINGS.shipping.uae_flat_rate),
      pakistan_flat_rate: Number(
        shipping.pakistan_flat_rate ?? DEFAULT_OPS_SETTINGS.shipping.pakistan_flat_rate,
      ),
      free_shipping_threshold_aed: Number(
        shipping.free_shipping_threshold_aed ?? DEFAULT_OPS_SETTINGS.shipping.free_shipping_threshold_aed,
      ),
      free_shipping_threshold_pkr: Number(
        shipping.free_shipping_threshold_pkr ?? DEFAULT_OPS_SETTINGS.shipping.free_shipping_threshold_pkr,
      ),
      estimated_days_uae: String(
        shipping.estimated_days_uae ?? DEFAULT_OPS_SETTINGS.shipping.estimated_days_uae,
      ),
      estimated_days_pakistan: String(
        shipping.estimated_days_pakistan ?? DEFAULT_OPS_SETTINGS.shipping.estimated_days_pakistan,
      ),
    },
    notifications: {
      email_new_order: Boolean(
        notifications.email_new_order ?? DEFAULT_OPS_SETTINGS.notifications.email_new_order,
      ),
      email_low_stock: Boolean(
        notifications.email_low_stock ?? DEFAULT_OPS_SETTINGS.notifications.email_low_stock,
      ),
      email_partner_application: Boolean(
        notifications.email_partner_application ??
          DEFAULT_OPS_SETTINGS.notifications.email_partner_application,
      ),
      email_review_submitted: Boolean(
        notifications.email_review_submitted ?? DEFAULT_OPS_SETTINGS.notifications.email_review_submitted,
      ),
    },
    security: {
      require_staff_2fa: Boolean(
        security.require_staff_2fa ?? DEFAULT_OPS_SETTINGS.security.require_staff_2fa,
      ),
      session_timeout_hours: Number(
        security.session_timeout_hours ?? DEFAULT_OPS_SETTINGS.security.session_timeout_hours,
      ),
      password_min_length: Number(
        security.password_min_length ?? DEFAULT_OPS_SETTINGS.security.password_min_length,
      ),
    },
    themes: {
      primary_color: String(themes.primary_color ?? DEFAULT_OPS_SETTINGS.themes.primary_color),
      accent_color: String(themes.accent_color ?? DEFAULT_OPS_SETTINGS.themes.accent_color),
      announcement_bg: String(themes.announcement_bg ?? DEFAULT_OPS_SETTINGS.themes.announcement_bg),
    },
    domain: {
      primary_domain: String(domain.primary_domain ?? DEFAULT_OPS_SETTINGS.domain.primary_domain),
      www_redirect: Boolean(domain.www_redirect ?? DEFAULT_OPS_SETTINGS.domain.www_redirect),
      force_https: Boolean(domain.force_https ?? DEFAULT_OPS_SETTINGS.domain.force_https),
    },
    announcements: asStringArray(row.announcements, DEFAULT_OPS_SETTINGS.announcements),
  }
}

export async function fetchPlatformOpsSettings(): Promise<PlatformOpsSettings> {
  const { data, error } = await supabase
    .from('platform_ops_settings')
    .select('*')
    .eq('singleton_key', 'primary')
    .maybeSingle()

  if (error) {
    console.error('Failed to load ops settings:', error)
    return structuredClone(DEFAULT_OPS_SETTINGS)
  }

  return mapOps(data as Record<string, unknown> | null)
}

export async function savePlatformOpsSettings(
  settings: PlatformOpsSettings,
): Promise<{ settings: PlatformOpsSettings; error: string | null }> {
  const payload = {
    singleton_key: 'primary',
    // Card stays off until a PSP is integrated; never persist card_enabled=true as live.
    payments: { ...settings.payments, card_enabled: false },
    shipping: settings.shipping,
    notifications: settings.notifications,
    security: settings.security,
    themes: settings.themes,
    domain: settings.domain,
    announcements: settings.announcements.filter((line) => line.trim()).map((line) => line.trim()),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('platform_ops_settings')
    .upsert(payload, { onConflict: 'singleton_key' })
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('Failed to save ops settings:', error)
    return { settings, error: error.message }
  }

  return { settings: mapOps(data as Record<string, unknown> | null), error: null }
}

/** Resolve delivery for one currency: per-product sum, else platform flat rate, then free threshold. */
export function computeDeliveryForCurrency(
  subtotal: number,
  productDeliverySum: number,
  flatRate: number,
  freeThreshold: number,
): number {
  if (subtotal <= 0) return 0
  let delivery = productDeliverySum > 0 ? productDeliverySum : flatRate
  if (freeThreshold > 0 && subtotal >= freeThreshold) delivery = 0
  return delivery
}

export function computeCartMoney(
  items: Array<{ price: number; quantity: number; delivery_charge: number; currency?: string }>,
  shipping: ShippingSettings,
) {
  const raw = items.reduce(
    (acc, item) => {
      const line = item.price * item.quantity
      const delivery = (item.delivery_charge || 0) * item.quantity
      if (item.currency === 'PKR') {
        acc.price.PKR += line
        acc.productDelivery.PKR += delivery
      } else {
        acc.price.AED += line
        acc.productDelivery.AED += delivery
      }
      return acc
    },
    {
      price: { PKR: 0, AED: 0 },
      productDelivery: { PKR: 0, AED: 0 },
    },
  )

  const delivery = {
    PKR: computeDeliveryForCurrency(
      raw.price.PKR,
      raw.productDelivery.PKR,
      shipping.pakistan_flat_rate,
      shipping.free_shipping_threshold_pkr,
    ),
    AED: computeDeliveryForCurrency(
      raw.price.AED,
      raw.productDelivery.AED,
      shipping.uae_flat_rate,
      shipping.free_shipping_threshold_aed,
    ),
  }

  return {
    subtotal: raw.price,
    delivery,
    grandTotal: {
      PKR: raw.price.PKR + delivery.PKR,
      AED: raw.price.AED + delivery.AED,
    },
  }
}

export async function joinLaunchWaitlist(email: string, source = 'future-launches') {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { error: 'Email is required.' }

  const { error } = await supabase.from('launch_waitlist').insert({
    email: normalized,
    source,
  })

  if (error) {
    if (error.code === '23505') return { error: null, alreadyJoined: true }
    return { error: error.message, alreadyJoined: false }
  }

  return { error: null, alreadyJoined: false }
}
