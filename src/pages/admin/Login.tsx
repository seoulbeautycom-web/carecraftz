import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Sparkles, Lock, Mail, ArrowRight, Store } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-slate-950">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Top Gradient Border */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-violet-500 to-emerald-500" />
          
          <div className="p-8 md:p-10">
            {/* Logo Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25 mb-6 relative group">
                <Store className="w-10 h-10 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                CareCraftz
              </h1>
              <p className="text-slate-400 text-sm tracking-wide uppercase font-medium">
                Admin Portal
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="relative group">
                <label 
                  htmlFor="email" 
                  className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                    focusedField === 'email' || email 
                      ? 'top-2 text-xs text-emerald-400' 
                      : 'top-4 text-sm text-slate-400'
                  }`}
                >
                  Email Address
                </label>
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-4 text-white placeholder-transparent focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <label 
                  htmlFor="password" 
                  className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                    focusedField === 'password' || password 
                      ? 'top-2 text-xs text-emerald-400' 
                      : 'top-4 text-sm text-slate-400'
                  }`}
                >
                  Password
                </label>
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-12 py-4 text-white placeholder-transparent focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-xl font-semibold overflow-hidden transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <a 
                href="/" 
                className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to website
              </a>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          <div className="w-2 h-2 rounded-full bg-violet-500/50" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
        </div>
      </div>
    </div>
  )
}
