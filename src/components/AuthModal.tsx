import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Phone, X } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { useAuthModal } from '../contexts/auth-modal-context'
import { useStorefrontIdentity } from '../contexts/StorefrontIdentityContext'
import GoogleSignInButton from './GoogleSignInButton'

export default function AuthModal() {
  const navigate = useNavigate()
  const { user, signInWithEmail, signInWithPhone, verifyPhoneOtp, signInWithOAuth, signUp } = useAuth()
  const { isOpen, mode, tab, nextPath, closeAuthModal, setMode, setTab } = useAuthModal()
  const { ops } = useStorefrontIdentity()
  const minPasswordLength = Math.max(6, ops.security.password_min_length || 6)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [testOtpHint, setTestOtpHint] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupSent, setSignupSent] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setOtpSent(false)
    setOtp('')
    setTestOtpHint('')
    setSignupSent(false)
    setShowPassword(false)
  }, [isOpen, mode, tab])

  useEffect(() => {
    if (isOpen && user) {
      closeAuthModal()
      if (nextPath) navigate(nextPath)
    }
  }, [closeAuthModal, isOpen, navigate, nextPath, user])

  if (!isOpen) return null

  const finish = () => {
    closeAuthModal()
    navigate(nextPath || '/profile')
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      if (password.length < minPasswordLength) {
        setError(`Password must be at least ${minPasswordLength} characters`)
        setLoading(false)
        return
      }
      const { error: signUpError } = await signUp(email.trim(), password, fullName.trim())
      if (signUpError) setError(signUpError.message)
      else setSignupSent(true)
      setLoading(false)
      return
    }

    const { error: signInError } = await signInWithEmail(email.trim(), password)
    if (signInError) setError(signInError.message)
    else finish()
    setLoading(false)
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!otpSent) {
      const { error: sendError, testOtp } = await signInWithPhone(phone.trim())
      if (sendError) setError(sendError.message)
      else {
        setOtpSent(true)
        setTestOtpHint(testOtp || '')
      }
    } else {
      const { error: verifyError } = await verifyPhoneOtp(phone.trim(), otp.trim())
      if (verifyError) setError(verifyError.message)
      else finish()
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error: oauthError } = await signInWithOAuth('google', {
      next: nextPath || '/profile',
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close sign in"
        className="absolute inset-0 bg-[#1F331F]/40 backdrop-blur-[2px]"
        onClick={closeAuthModal}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'signup' ? 'Create account' : 'Sign in'}
        className="relative z-[101] w-full sm:max-w-md max-h-[92svh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#fbfcf4] border border-[#2b2b2b]/10 shadow-xl"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="sticky top-0 bg-[#fbfcf4]/95 backdrop-blur-sm border-b border-[#2b2b2b]/08 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#696a67]">
              CareCraftz
            </p>
            <h2 className="text-[#2b2b2b] text-lg font-semibold leading-tight">
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </h2>
            <p className="text-[11px] text-[#696a67] mt-0.5">
              Use your mobile number or email
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 rounded-full bg-white border border-[#2b2b2b]/08 hover:bg-[#f0ece0] transition-colors"
          >
            <X className="w-4 h-4 text-[#2b2b2b]" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Method: phone or email */}
          <div className="flex gap-1 p-1 rounded-full bg-[#f0ece0]">
            <button
              type="button"
              onClick={() => {
                setTab('phone')
                setError('')
                setOtpSent(false)
              }}
              className={`flex-1 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                tab === 'phone' ? 'bg-white text-[#2b2b2b] shadow-sm' : 'text-[#696a67]'
              }`}
            >
              <Phone className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Mobile
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('email')
                setError('')
              }}
              className={`flex-1 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                tab === 'email' ? 'bg-white text-[#2b2b2b] shadow-sm' : 'text-[#696a67]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Email
            </button>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          {signupSent ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-[#2b2b2b]">
                Check your inbox — we sent a confirmation link to <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setSignupSent(false)
                }}
                className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider"
              >
                Back to sign in
              </button>
            </div>
          ) : tab === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                  Mobile number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#696a67]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    required
                    placeholder="+971 50 123 4567"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#2b2b2b]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                  />
                </div>
              </div>

              {otpSent ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                    WhatsApp code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="······"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#2b2b2b]/10 text-sm text-center tracking-[0.35em] font-mono focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                  />
                  <p className="text-[11px] text-[#696a67] mt-1.5 text-center">
                    Code sent to {phone}
                  </p>
                  {testOtpHint ? (
                    <p className="text-[10px] text-amber-700 mt-1 text-center">Dev OTP: {testOtpHint}</p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {loading
                  ? otpSent
                    ? 'Verifying…'
                    : 'Sending…'
                  : otpSent
                    ? 'Verify & sign in'
                    : 'Send code'}
              </button>

              {otpSent ? (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                    setTestOtpHint('')
                  }}
                  className="w-full py-2 text-[11px] font-semibold text-[#696a67] hover:text-[#2b2b2b]"
                >
                  Change number
                </button>
              ) : null}
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'signup' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#2b2b2b]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                  />
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
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#2b2b2b]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#696a67] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#696a67]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={minPasswordLength}
                    placeholder={mode === 'signup' ? `Min. ${minPasswordLength} characters` : '••••••••'}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-[#2b2b2b]/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F331F]/15"
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

              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => {
                    closeAuthModal()
                    navigate('/forgot-password')
                  }}
                  className="text-[11px] font-semibold text-[#696a67] hover:text-[#2b2b2b]"
                >
                  Forgot password?
                </button>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1F331F] text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {loading
                  ? mode === 'signup'
                    ? 'Creating…'
                    : 'Signing in…'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>
          )}

          {tab === 'email' && !signupSent ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#696a67]">
                <span className="flex-1 h-px bg-[#2b2b2b]/10" />
                or
                <span className="flex-1 h-px bg-[#2b2b2b]/10" />
              </div>
              <GoogleSignInButton
                onClick={() => void handleGoogle()}
                disabled={loading}
                label={mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              />
            </div>
          ) : null}

          <div className="pt-1 pb-2 text-center">
            {mode === 'signin' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setTab('email')
                  setError('')
                }}
                className="text-[11px] text-[#696a67]"
              >
                New here?{' '}
                <span className="font-semibold text-[#2b2b2b]">Create an account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setSignupSent(false)
                }}
                className="text-[11px] text-[#696a67]"
              >
                Already have an account?{' '}
                <span className="font-semibold text-[#2b2b2b]">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
