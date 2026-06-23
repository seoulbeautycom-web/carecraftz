import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { Mail, Lock, User, Eye, EyeOff, Leaf } from 'lucide-react'
import PageFrame from '../../components/PageFrame'

function SignUpInner() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
            <div className="w-16 h-16 bg-[#A8E6CF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-light text-[#2b2b2b] mb-2">Check your inbox</h2>
            <p className="text-sm text-[#696a67] mb-6">
              We sent a confirmation link to <strong className="text-[#2b2b2b]">{email}</strong>. Click it to activate your account.
            </p>
            <button onClick={() => navigate('/signin')}
              className="w-full py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black transition-all">
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#A8E6CF] mb-4">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-light text-[#2b2b2b] mb-1">Create account</h1>
          <p className="text-sm text-[#696a67]">Join the CareCraftz community</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition"
                  placeholder="Your full name" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition"
                  placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition"
                  placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2b2b2b] mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition"
                  placeholder="Repeat password" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#2b2b2b] text-white rounded-2xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition-all">
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-[#696a67]">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#2b2b2b] font-semibold hover:underline">Sign in</Link>
            </p>
            <p className="text-[10px] text-gray-400">
              By signing up you agree to our{' '}
              <Link to="/terms" className="underline">Terms</Link>{' '}and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <PageFrame frameColor="#A8E6CF" showFooter={false}>
      <SignUpInner />
    </PageFrame>
  )
}
