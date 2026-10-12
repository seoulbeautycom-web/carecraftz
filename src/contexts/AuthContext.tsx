import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../lib/whatsapp'

import { AuthContext, type User } from './auth-context'

const userFromSession = (
  sessionUser: {
    id: string
    email?: string | null
    phone?: string | null
    user_metadata?: Record<string, unknown> | null
  } | null,
): User | null => {
  if (!sessionUser?.id) return null

  const meta = sessionUser.user_metadata || {}
  const metaPhone = typeof meta.phone === 'string' ? meta.phone : undefined
  const metaName = typeof meta.full_name === 'string' ? meta.full_name : undefined
  const email = sessionUser.email || ''
  const phone = sessionUser.phone || metaPhone || undefined

  // Require a durable identity signal (email and/or phone).
  if (!email && !phone) return null

  return {
    id: sessionUser.id,
    email,
    phone,
    full_name: metaName,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setUser(userFromSession(session?.user ?? null))
      setLoading(false)
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(userFromSession(session?.user ?? null))
      setLoading(false)
    })

    const handlePageShow = () => {
      void syncSession()
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithPhone = async (phone: string) => {
    const result = await sendWhatsAppOTP(phone)
    return {
      error: result.success ? null : { message: result.error || 'Failed to send WhatsApp OTP' },
      confirmationRequired: result.success,
      testOtp: result.testOtp,
    }
  }

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const result = await verifyWhatsAppOTP(phone, token)

    if (!result.success) {
      return { error: { message: result.error || 'Invalid OTP' } }
    }

    if (!result.token_hash) {
      return {
        error: {
          message: 'Phone verified, but a login session could not be created. Try email sign-in.',
        },
      }
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
      type: (result.type as 'email') || 'email',
    })

    if (error) {
      return { error: { message: error.message } }
    }

    setUser(userFromSession(data.user ?? data.session?.user ?? null))
    return { error: null }
  }

  const signInWithOAuth = async (provider: 'google' | 'apple', options?: { next?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('signin', window.location.pathname.startsWith('/login') ? '/login' : '/signin')
    if (options?.next?.startsWith('/')) {
      searchParams.set('next', options.next)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?${searchParams.toString()}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile&signin=/signin`,
      },
    })

    if (!error && data.user?.id) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signInWithPhone,
        verifyPhoneOtp,
        signInWithOAuth,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
