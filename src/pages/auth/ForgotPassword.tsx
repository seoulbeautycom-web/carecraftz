import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, KeyRound } from 'lucide-react'
import PageFrame from '../../components/PageFrame'
import { useAuth } from '../../contexts/auth-context'

function ForgotPasswordInner() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: resetError } = await resetPassword(email.trim())
    if (resetError) setError(resetError.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-16"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#C9B8FF]/40 border border-[#2b2b2b]/08 mb-3">
            <KeyRound className="w-6 h-6 text-[#2b2b2b]" />
          </div>
          <h1 className="text-[#2b2b2b]" style={{ fontWeight: 600, fontSize: '1.5rem' }}>
            Reset password
          </h1>
          <p className="text-sm text-[#696a67] mt-1">We will email you a secure reset link.</p>
        </div>

        <div className="rounded-2xl bg-white border border-[#2b2b2b]/08 p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-[#2b2b2b]">
                If an account exists for <strong>{email}</strong>, a reset link is on the way.
              </p>
              <Link
                to="/signin"
                className="inline-flex w-full justify-center py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100">
                  {error}
                </div>
              ) : null}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#696a67]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#fbfcf4] border border-[#2b2b2b]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <Link
                to="/signin"
                className="block text-center text-[11px] font-semibold text-[#696a67] hover:text-[#2b2b2b]"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForgotPassword() {
  return (
    <PageFrame frameColor="#C9B8FF">
      <ForgotPasswordInner />
    </PageFrame>
  )
}
