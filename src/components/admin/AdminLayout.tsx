import { Link, useLocation } from 'react-router-dom'
import { Search, Store } from 'lucide-react'
import { useAdminAccess } from '../../contexts/admin-access-context'
import { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS } from '../../lib/adminNavigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { loading, fullName, roleCode, landingPath, hasAnyPermission: canAccessAnyPermission } = useAdminAccess()

  const menuItems = ADMIN_NAV_ITEMS.filter((item) => canAccessAnyPermission(item.requiredAnyPermissions))
  const homePath = landingPath ?? '/'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F2E8] flex">
      <aside className="w-52 bg-slate-900 flex flex-col fixed h-screen">
        <div className="px-3 py-4">
          <Link to={homePath} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-sm">CareCraftz</span>
              <span className="block text-[10px] text-slate-500 -mt-0.5 truncate">
                {fullName || roleCode || 'Staff access'}
              </span>
            </div>
          </Link>
        </div>

        <div className="px-2.5 mb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <nav className="flex-1 py-1 px-2 overflow-y-auto">
          {ADMIN_NAV_SECTIONS.map((section) => {
            const sectionItems = menuItems.filter((item) => item.section === section.id)
            if (sectionItems.length === 0) return null

            return (
              <div key={section.id} className={section.id === 'top' ? 'mb-2' : 'mt-4 mb-1'}>
                {section.label ? (
                  <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {section.label}
                  </p>
                ) : null}
                <ul className="space-y-0.5">
                  {sectionItems.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs truncate">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="px-2.5 py-2 border-t border-slate-800">
          <button type="button" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5">
            <span className="text-sm">?</span>
            Help Center
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-52 h-screen min-h-0 overflow-y-auto bg-[#F7F2E8]">
        {children}
      </main>
    </div>
  )
}
