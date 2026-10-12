import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const signInPath = (() => {
    const hint = new URLSearchParams(location.search).get('signin')
    if (hint === '/login' || hint === '/signin') return hint
    return window.location.hostname.startsWith('admin.') ? '/login' : '/signin'
  })()

  const nextPath = (() => {
    const next = new URLSearchParams(location.search).get('next')
    return typeof next === 'string' && next.startsWith('/') ? next : '/'
  })()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        const errorDescription =
          hashParams.get('error_description') || searchParams.get('error_description')
        if (errorDescription) {
          setError(errorDescription)
          return
        }

        // PKCE / code exchange (newer Supabase OAuth flows)
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            return
          }
          navigate(nextPath, { replace: true })
          return
        }

        // Implicit / recovery hash tokens
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) {
            setError(sessionError.message)
            return
          }
          const type = hashParams.get('type')
          navigate(type === 'recovery' ? '/reset-password' : nextPath, { replace: true })
          return
        }

        const { data, error: sessionReadError } = await supabase.auth.getSession()
        if (sessionReadError) {
          setError(sessionReadError.message)
          return
        }

        if (data.session) {
          navigate(nextPath, { replace: true })
        } else {
          navigate(signInPath, { replace: true })
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    void handleAuthCallback()
  }, [navigate, nextPath, signInPath])

  if (loading) {
    return (
      <PageFrame frameColor="#C9B8FF">
        <div className="min-h-[70vh] flex items-center justify-center pt-24 pb-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1F331F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#696a67] text-sm">Completing sign in…</p>
          </div>
        </div>
      </PageFrame>
    )
  }

  if (error) {
    return (
      <PageFrame frameColor="#C9B8FF">
        <div className="min-h-[70vh] flex items-center justify-center pt-24 pb-16">
          <div className="text-center max-w-md px-4">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-2">Authentication failed</h2>
            <p className="text-[#696a67] mb-6 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => navigate(signInPath)}
              className="px-6 py-3 bg-[#1F331F] text-white rounded-full text-[11px] font-semibold uppercase tracking-wider"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </PageFrame>
    )
  }

  return null
}
