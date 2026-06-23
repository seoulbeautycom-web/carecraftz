import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { Mail, Lock, Phone, Eye, EyeOff, Sparkles } from 'lucide-react'
import PageFrame from '../../components/PageFrame'

function SignInInner() {
  const navigate = useNavigate()
  const { signInWithEmail, signInWithPhone, verifyPhoneOtp } = useAuth()
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signInWithEmail(email, password)
    if (error) {
      setError(error.message)
    } else {
      navigate('/profile')
    }
    setLoading(false)
  }

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!otpSent) {
      const { error } = await signInWithPhone(phone)
      if (error) {
        setError(error.message)
      } else {
        setOtpSent(true)
      }
    } else {
      const { error } = await verifyPhoneOtp(phone, otp)
      if (error) {
        setError(error.message)
      } else {
        navigate('/profile')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-sm">

        {/* Logo / greeting */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C9B8FF] mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-light text-[#2b2b2b] mb-1">Welcome back</h1>
          <p className="text-sm text-[#696a67]">Sign in to your CareCraftz account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Method tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => { setActiveTab('email'); setOtpSent(false); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'email' ? 'bg-white shadow-sm text-[#2b2b2b]' : 'text-[#696a67]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />Email
            </button>
            <button
              onClick={() => { setActiveTab('phone'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'phone' ? 'bg-white shadow-sm text-[#2b2b2b]' : 'text-[#696a67]'
              }`}
            >
              <Phone className="w-3.5 h-3.5 inline mr-1.5" />Phone
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {activeTab === 'email' ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B8FF] focus:border-transparent transition"
                    placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B8FF] focus:border-transparent transition"
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-[#C9B8FF] hover:underline font-medium">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition-all">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B8FF] focus:border-transparent transition"
                    placeholder="+971 50 123 4567" required disabled={otpSent} />
                </div>
              </div>
              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Verification Code</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B8FF] focus:border-transparent text-center tracking-[0.3em] font-mono"
                    placeholder="······" maxLength={6} required />
                  <p className="text-xs text-[#696a67] mt-1.5 text-center">Code sent to {phone}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition-all">
                {loading ? (otpSent ? 'Verifying…' : 'Sending…') : (otpSent ? 'Verify Code' : 'Send Code')}
              </button>
              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setOtp('') }}
                  className="w-full py-2 text-xs text-[#696a67] hover:text-[#2b2b2b] transition-colors">
                  ← Change phone number
                </button>
              )}
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-[#696a67]">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#2b2b2b] font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <PageFrame frameColor="#C9B8FF" showFooter={false}>
      <SignInInner />
    </PageFrame>
  )
}
