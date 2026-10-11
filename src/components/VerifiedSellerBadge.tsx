import { BadgeCheck, ShieldCheck } from 'lucide-react'

export type SellerTrustInfo = {
  id: string
  display_name: string
  tenant_type: 'flagship' | 'partner'
  status: string
  approval_status: string
  verified_at: string | null
  public_certifications?: string[] | null
}

export function isVerifiedSeller(store: Pick<SellerTrustInfo, 'status' | 'approval_status'> | null | undefined) {
  return Boolean(store && store.status === 'active' && store.approval_status === 'approved')
}

export function getSellerBadgeLabel(store: SellerTrustInfo | null | undefined) {
  if (!store || !isVerifiedSeller(store)) return null
  return store.tenant_type === 'flagship' ? 'CareCraftz Official' : 'CareCraftz Verified Seller'
}

export default function VerifiedSellerBadge({
  store,
  size = 'md',
}: {
  store: SellerTrustInfo | null | undefined
  size?: 'sm' | 'md'
}) {
  const label = getSellerBadgeLabel(store)
  if (!label) return null

  const isOfficial = store?.tenant_type === 'flagship'
  const Icon = isOfficial ? ShieldCheck : BadgeCheck
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses} ${
        isOfficial
          ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  )
}
