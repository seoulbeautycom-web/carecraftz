import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, FormEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Mail, Package, Plus, RefreshCw, ShoppingCart, Store, Users } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { supabase } from '../../lib/supabase'
import { useTenantAccess } from '../../contexts/tenant-access-context'
import { getTenantPath, TENANT_NAV_ITEMS } from '../../lib/tenantNavigation'

interface ProductRow {
  id: string
  name?: string | null
  description?: string | null
  price?: number | string | null
  inventory?: number | null
  category?: string | null
  images?: string[] | null
  is_active?: boolean | null
  sku?: string | null
  weight?: number | string | null
  created_at?: string | null
}

interface OrderRow {
  id: string
  order_code?: string | null
  customer_email?: string | null
  status?: string | null
  payment_method?: string | null
  created_at?: string | null
}

interface MemberRow {
  member_id: string
  store_id: string
  slug?: string | null
  email?: string | null
  full_name?: string | null
  status?: string | null
  role_codes?: string[] | null
  permissions?: string[] | null
  invited_at?: string | null
  joined_at?: string | null
}

interface InviteRow {
  invite_id: string
  store_id: string
  slug?: string | null
  email?: string | null
  role_code?: string | null
  invited_at?: string | null
  expires_at?: string | null
  accepted_at?: string | null
  revoked_at?: string | null
}

const roleOptions = [
  { code: 'store_owner', label: 'Store owner' },
  { code: 'catalog_manager', label: 'Catalog manager' },
  { code: 'support_manager', label: 'Support manager' },
  { code: 'viewer', label: 'Viewer' },
]

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(numericValue)
}

function PageFrame({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-300">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

function EmptyState({
  title,
  description,
  icon: Icon = Store,
  action,
}: {
  title: string
  description: string
  icon?: ComponentType<{ className?: string }>
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-500" />
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </div>
  )
}

export function TenantDashboardPage() {
  const {
    displayName,
    legalName,
    slug,
    tenantType,
    status,
    approvalStatus,
    roleCodes,
    permissions,
    accessibleStores,
    hasAnyPermission,
  } = useTenantAccess()

  const visibleModules = useMemo(
    () => TENANT_NAV_ITEMS.filter((item) => hasAnyPermission(item.requiredAnyPermissions)),
    [hasAnyPermission],
  )

  return (
    <PageFrame
      eyebrow="Tenant dashboard"
      title={displayName || legalName || slug || 'Store portal'}
      description="Monitor the current store, review your access level, and jump into the modules you are allowed to manage."
      actions={(
        <>
          <Link
            to={getTenantPath(slug ?? 'carecraftz', 'products')}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
          >
            <Package className="h-4 w-4" />
            Products
          </Link>
          <Link
            to={getTenantPath(slug ?? 'carecraftz', 'invites')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            Invites
          </Link>
        </>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Store status" value={status || '—'} detail={approvalStatus ? `Approval: ${approvalStatus}` : undefined} />
        <MetricCard label="Tenant type" value={tenantType || '—'} detail={`Slug: /${slug || 'carecraftz'}`} />
        <MetricCard label="Roles" value={roleCodes.length.toString()} detail={roleCodes.length ? roleCodes.join(' • ') : 'No role codes available'} />
        <MetricCard label="Permissions" value={permissions.length.toString()} detail={`${accessibleStores.length} accessible store${accessibleStores.length === 1 ? '' : 's'}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Panel
          title="Allowed modules"
          subtitle="Navigation is filtered from the permissions returned by the tenant access snapshot."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleModules.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.segment} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">/{slug || 'carecraftz'}/{item.segment}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="Store access" subtitle="Stores linked to the signed-in partner account.">
          {accessibleStores.length > 0 ? (
            <div className="space-y-3">
              {accessibleStores.map((store) => (
                <Link
                  key={`${store.store_id}-${store.slug}`}
                  to={getTenantPath(store.slug || slug || 'carecraftz')}
                  className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-emerald-500/40 hover:bg-slate-900"
                >
                  <p className="text-sm font-medium text-white">{store.display_name || store.legal_name || store.slug}</p>
                  <p className="mt-1 text-xs text-slate-500">/{store.slug}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {(store.role_codes || []).slice(0, 3).map((roleCode) => (
                      <span key={roleCode} className="rounded-full bg-slate-800 px-2.5 py-1 uppercase tracking-[0.22em] text-slate-300">{roleCode}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No accessible stores"
              description="This account currently does not have any active tenant memberships."
            />
          )}
        </Panel>
      </div>
    </PageFrame>
  )
}

export function TenantProductsPage() {
  const { slug, hasAnyPermission } = useTenantAccess()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])

  const canCreate = hasAnyPermission(['partner.products.create'])

  const loadProducts = useCallback(async () => {
    if (!slug) {
      return
    }

    const { data, error: rpcError } = await supabase.rpc('list_partner_store_products', { target_slug: slug })

    if (rpcError) {
      setError(rpcError.message)
      setProducts([])
    } else {
      setProducts(Array.isArray(data) ? (data as ProductRow[]) : [])
    }

    setLoading(false)
  }, [slug])

  useEffect(() => {
    queueMicrotask(() => {
      void loadProducts()
    })
  }, [loadProducts])

  return (
    <PageFrame
      eyebrow="Products"
      title="Store products"
      description="The product list is scoped to the current tenant store."
      actions={(
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setError(null)
            void loadProducts()
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    >
      <Panel
        title="Product catalog"
        subtitle={canCreate ? 'You have permission to create products in this store.' : 'You can view products in this store.'}
        actions={canCreate ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <Plus className="h-3.5 w-3.5" />
            Create enabled
          </span>
        ) : null}
      >
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading products...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
            {error}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Products assigned to this store will appear here once they are created."
            icon={Package}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {products.map((product) => (
              <article key={product.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{product.name || 'Unnamed product'}</h3>
                    <p className="mt-1 text-sm text-slate-400">{product.category || 'Uncategorized'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${product.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">{product.description || 'No description provided.'}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</dt>
                    <dd className="mt-1 font-medium text-white">{formatNumber(product.price)}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Inventory</dt>
                    <dd className="mt-1 font-medium text-white">{formatNumber(product.inventory)}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">SKU</dt>
                    <dd className="mt-1 font-medium text-white">{product.sku || '—'}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</dt>
                    <dd className="mt-1 font-medium text-white">{formatDate(product.created_at)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </PageFrame>
  )
}

export function TenantOrdersPage() {
  const { storeId } = useTenantAccess()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])

  const loadOrders = useCallback(async () => {
    if (!storeId) {
      return
    }

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, order_code, customer_email, status, payment_method, created_at')
      .eq('partner_store_id', storeId)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setOrders([])
    } else {
      setOrders(Array.isArray(data) ? (data as OrderRow[]) : [])
    }

    setLoading(false)
  }, [storeId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadOrders()
    })
  }, [loadOrders])

  return (
    <PageFrame
      eyebrow="Orders"
      title="Store orders"
      description="Orders are filtered using the tenant store ID and partner RBAC policies."
      actions={(
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setError(null)
            void loadOrders()
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    >
      <Panel title="Order feed" subtitle="Only orders assigned to this store are returned.">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading orders...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="Once orders are linked to this partner store, they will appear here."
            icon={ShoppingCart}
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-4 text-sm font-medium text-white">{order.order_code || order.id}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{order.customer_email || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{order.status || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{order.payment_method || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageFrame>
  )
}

export function TenantMembersPage() {
  const { slug } = useTenantAccess()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])

  const loadMembers = useCallback(async () => {
    if (!slug) {
      return
    }

    const { data, error: rpcError } = await supabase.rpc('list_partner_store_members', { target_slug: slug })

    if (rpcError) {
      setError(rpcError.message)
      setMembers([])
    } else {
      setMembers(Array.isArray(data) ? (data as MemberRow[]) : [])
    }

    setLoading(false)
  }, [slug])

  useEffect(() => {
    queueMicrotask(() => {
      void loadMembers()
    })
  }, [loadMembers])

  return (
    <PageFrame
      eyebrow="Members"
      title="Store membership"
      description="Membership records are scoped to the current partner store."
      actions={(
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setError(null)
            void loadMembers()
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    >
      <Panel title="Members" subtitle="Store owners, managers, and viewers who belong to the current tenant.">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Loading members...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
            {error}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="As invitations are accepted, new members will appear here."
            icon={Users}
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {members.map((member) => (
                  <tr key={member.member_id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-4 text-sm font-medium text-white">{member.full_name || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{member.email || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{(member.role_codes || []).join(', ') || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{member.status || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{formatDate(member.joined_at || member.invited_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageFrame>
  )
}

export function TenantInvitesPage() {
  const { slug, hasAnyPermission } = useTenantAccess()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [email, setEmail] = useState('')
  const [roleCode, setRoleCode] = useState('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const canManage = hasAnyPermission(['partner.invites.manage'])

  const loadInvites = useCallback(async () => {
    if (!slug) {
      return
    }

    const { data, error: rpcError } = await supabase.rpc('list_partner_store_invites', { target_slug: slug })

    if (rpcError) {
      setError(rpcError.message)
      setInvites([])
    } else {
      setInvites(Array.isArray(data) ? (data as InviteRow[]) : [])
    }

    setLoading(false)
  }, [slug])

  useEffect(() => {
    queueMicrotask(() => {
      void loadInvites()
    })
  }, [loadInvites])

  const handleCreateInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!slug) {
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const { data, error: rpcError } = await supabase.rpc('create_partner_invite', {
      target_slug: slug,
      invite_email: email.trim(),
      role_code: roleCode,
    })

    if (rpcError) {
      setError(rpcError.message)
    } else {
      const response = data && typeof data === 'object' ? data as Record<string, unknown> : null
      setSuccessMessage(typeof response?.invite_url === 'string' ? `Invite created. Share this link: ${response.invite_url}` : 'Invite created successfully.')
      setEmail('')
      setRoleCode('viewer')
      setLoading(true)
      await loadInvites()
    }

    setSubmitting(false)
  }

  return (
    <PageFrame
      eyebrow="Invites"
      title="Store invites"
      description="Create and review partner invite tokens for the current store."
      actions={(
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            setError(null)
            void loadInvites()
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Create invite"
          subtitle={canManage ? 'Invite permissions are enabled for this account.' : 'You can review invites, but invite creation is disabled for this role.'}
        >
          {canManage ? (
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">Email address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  placeholder="partner@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">Role</span>
                <select
                  value={roleCode}
                  onChange={(event) => setRoleCode(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  {roleOptions.map((role) => (
                    <option key={role.code} value={role.code}>{role.label}</option>
                  ))}
                </select>
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create invite
              </button>
            </form>
          ) : (
            <EmptyState
              title="Invite creation disabled"
              description="This account can view invite history, but it cannot generate new partner invites."
              icon={Mail}
            />
          )}
        </Panel>

        <Panel title="Invite history" subtitle="Pending, accepted, and revoked invitations for this store.">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Loading invites...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
              {error}
            </div>
          ) : invites.length === 0 ? (
            <EmptyState
              title="No invites yet"
              description="Invite tokens created for this store will appear here."
              icon={Mail}
            />
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => {
                const status = invite.revoked_at ? 'Revoked' : invite.accepted_at ? 'Accepted' : 'Pending'
                const statusClasses = invite.revoked_at
                  ? 'bg-slate-800 text-slate-300'
                  : invite.accepted_at
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-amber-500/10 text-amber-300'

                return (
                  <div key={invite.invite_id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{invite.email || 'Unnamed invite'}</p>
                        <p className="mt-1 text-xs text-slate-500">{invite.role_code || 'viewer'} • Expires {formatDate(invite.expires_at)}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusClasses}`}>
                        {status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                      <div>
                        <span className="block text-xs uppercase tracking-[0.24em] text-slate-500">Invited</span>
                        <span className="mt-1 block text-slate-300">{formatDate(invite.invited_at)}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-[0.24em] text-slate-500">Accepted</span>
                        <span className="mt-1 block text-slate-300">{formatDate(invite.accepted_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </PageFrame>
  )
}

export function TenantSettingsPage() {
  const {
    displayName,
    legalName,
    slug,
    tenantType,
    status,
    approvalStatus,
    roleCodes,
    permissions,
    accessibleStores,
  } = useTenantAccess()

  return (
    <PageFrame
      eyebrow="Settings"
      title="Tenant settings"
      description="Read-only store details for the current partner tenant. Editable settings will be added as the portal expands."
      actions={(
        <Link
          to={getTenantPath(slug ?? 'carecraftz', 'dashboard')}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4" />
          Back to dashboard
        </Link>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Display name" value={displayName || legalName || '—'} detail={`/${slug || 'carecraftz'}`} />
        <MetricCard label="Store type" value={tenantType || '—'} detail={status ? `Status: ${status}` : undefined} />
        <MetricCard label="Approval" value={approvalStatus || '—'} detail="Current store approval state" />
        <MetricCard label="Permission count" value={permissions.length.toString()} detail={`${roleCodes.length} role code${roleCodes.length === 1 ? '' : 's'}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Current store" subtitle="This is the store that the active route slug maps to.">
          <div className="space-y-3 text-sm text-slate-300">
            <p><span className="text-slate-500">Store:</span> {displayName || legalName || slug || '—'}</p>
            <p><span className="text-slate-500">Slug:</span> /{slug || 'carecraftz'}</p>
            <p><span className="text-slate-500">Type:</span> {tenantType || '—'}</p>
            <p><span className="text-slate-500">Status:</span> {status || '—'}</p>
            <p><span className="text-slate-500">Approval:</span> {approvalStatus || '—'}</p>
          </div>
        </Panel>

        <Panel title="Accessible stores" subtitle="Stores assigned to the current partner account.">
          {accessibleStores.length > 0 ? (
            <div className="space-y-3">
              {accessibleStores.map((store) => (
                <Link key={`${store.store_id}-${store.slug}`} to={getTenantPath(store.slug || slug || 'carecraftz')} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-emerald-500/40 hover:bg-slate-900">
                  <p className="text-sm font-medium text-white">{store.display_name || store.legal_name || store.slug}</p>
                  <p className="mt-1 text-xs text-slate-500">/{store.slug}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No stores available" description="No additional partner stores are available for this account." icon={Store} />
          )}
        </Panel>
      </div>
    </PageFrame>
  )
}

export function TenantClaimInvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const claimAttemptedRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [claimedStoreSlug, setClaimedStoreSlug] = useState<string | null>(null)

  const inviteToken = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search])
  const hasInviteToken = inviteToken.trim().length > 0
  const targetSlug = params.slug ?? 'carecraftz'

  useEffect(() => {
    queueMicrotask(() => {
      claimAttemptedRef.current = false
      setError(null)
      setSuccess(null)
      setClaimedStoreSlug(null)
      setLoading(false)
    })
  }, [inviteToken, targetSlug])

  useEffect(() => {
    if (claimAttemptedRef.current || authLoading || !user || !hasInviteToken || success || error) {
      return
    }

    const claimInvite = async () => {
      claimAttemptedRef.current = true
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('claim_partner_invite', {
        invite_token: inviteToken,
      })

      if (rpcError) {
        setError(rpcError.message)
        setLoading(false)
        return
      }

      const response = data && typeof data === 'object' ? data as Record<string, unknown> : null
      const nextSlug = typeof response?.store_slug === 'string' ? response.store_slug : targetSlug
      setClaimedStoreSlug(nextSlug)
      setSuccess('Invite accepted successfully. Redirecting to your store portal...')
      setLoading(false)

      window.setTimeout(() => {
        navigate(getTenantPath(nextSlug, 'dashboard'), { replace: true })
      }, 900)
    }

    void claimInvite()
  }, [authLoading, error, hasInviteToken, inviteToken, navigate, success, targetSlug, user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Checking your session...
        </div>
      </div>
    )
  }

  if (!hasInviteToken) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle className="h-6 w-6" />
              <p className="text-xs font-semibold uppercase tracking-[0.32em]">Invalid invite</p>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">Invite token missing</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This claim link is incomplete. Ask the store owner to resend the invitation URL.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={getTenantPath(targetSlug)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                Back to store portal
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Switch account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="flex items-center gap-3 text-amber-300">
              <AlertCircle className="h-6 w-6" />
              <p className="text-xs font-semibold uppercase tracking-[0.32em]">Sign in required</p>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">Claim your partner invite</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You need to sign in before accepting the invitation for <span className="font-semibold text-white">/{targetSlug}</span>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Sign in to continue
              </Link>
              <Link
                to={getTenantPath(targetSlug)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                Back to store portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
            <p className="text-xs font-semibold uppercase tracking-[0.32em]">Accept invitation</p>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Partner invite claim</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Confirming access for <span className="font-semibold text-white">/{targetSlug}</span>.
          </p>

          {loading ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Claiming invite...
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-sm text-emerald-200">
              {success}
              {claimedStoreSlug ? (
                <p className="mt-2 text-xs text-emerald-100">Redirecting to /{claimedStoreSlug}/dashboard</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={getTenantPath(targetSlug)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Store portal
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
