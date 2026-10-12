import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Lock, Mail, ArrowRight } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const nextPath = useMemo(() => {
    const next = new URLSearchParams(location.search).get('next')
    return typeof next === 'string' && next.startsWith('/') ? next : '/'
  }, [location.search])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await supabase.rpc('bump_my_last_signed_in')
      }

      navigate(nextPath, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          'linear-gradient(160deg, #f8fafc 0%, #eef2f7 45%, #f4f7fb 100%)',
        fontFamily: "'DM Sans', 'Poppins', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo-icon.png" alt="" className="h-9 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="text-xl font-semibold text-gray-900 tracking-tight">CareCraftz</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-gray-500">Staff access for orders, products, and partners</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-7 sm:px-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@carecraftz.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Authorized staff only
        </p>
      </div>
    </div>
  )
}
