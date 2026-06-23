import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const signInPath = (() => {
    const hint = new URLSearchParams(location.search).get('signin')
    if (hint === '/login' || hint === '/signin') {
      return hint
    }

    return window.location.hostname.startsWith('admin.') ? '/login' : '/signin'
  })()

  const nextPath = (() => {
    const next = new URLSearchParams(location.search).get('next')
    return typeof next === 'string' && next.startsWith('/') ? next : '/'
  })()

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error.message)
          return
        }

        if (data.session) {
          // Successfully authenticated
          navigate(nextPath, { replace: true })
        } else {
          // Check if there's an error in the URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const errorDescription = hashParams.get('error_description')
          
          if (errorDescription) {
            setError(errorDescription)
          } else {
            // No session, redirect to signin
            navigate(signInPath)
          }
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate, nextPath, signInPath])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F4F0] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(signInPath)}
            className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return null
}
