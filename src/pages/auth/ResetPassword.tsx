import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import PageFrame from '../../components/PageFrame'
import { supabase } from '../../lib/supabase'
import { useStorefrontIdentity } from '../../contexts/StorefrontIdentityContext'

function ResetPasswordInner() {
  const navigate = useNavigate()
  const { ops } = useStorefrontIdentity()
  const minPasswordLength = Math.max(6, ops.security.password_min_length || 6)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    const sync = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (!data.session) {
        setError('This reset link is invalid or expired. Request a new one.')
        setReady(false)
      } else {
        setReady(true)
      }
    }
    void sync()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters`)
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    window.setTimeout(() => navigate('/profile', { replace: true }), 1200)
  }

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-16"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#A8E6CF]/50 border border-[#2b2b2b]/08 mb-3">
            <ShieldCheck className="w-6 h-6 text-[#2b2b2b]" />
          </div>
          <h1 className="text-[#2b2b2b]" style={{ fontWeight: 600, fontSize: '1.5rem' }}>
            Choose a new password
          </h1>
        </div>

        <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-6">
          {done ? (
            <p className="text-sm text-center text-[#2b2b2b]">Password updated. Taking you to your profile…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100">
                  {error}
                </div>
              ) : null}
              {!ready ? (
                <Link
                  to="/forgot-password"
                  className="inline-flex w-full justify-center py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
                >
                  Request a new link
                </Link>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#696a67]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 bg-[#fbfcf4] border border-[#2b2b2b]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                        placeholder={`Min. ${minPasswordLength} characters`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696a67]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                      Confirm password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fbfcf4] border border-[#2b2b2b]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Update password'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <PageFrame frameColor="#A8E6CF">
      <ResetPasswordInner />
    </PageFrame>
  )
}
