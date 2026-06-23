import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../lib/whatsapp'

import { AuthContext, type User } from './auth-context'

const userFromSession = (sessionUser: { id: string; email?: string | null; phone?: string | null } | null): User | null => {
  if (!sessionUser?.email) {
    return null
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    phone: sessionUser.phone || undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      setUser(userFromSession(session?.user ?? null))
      setLoading(false)
    }

    // Check for existing session
    void syncSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      confirmationRequired: result.success 
    }
  }

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const result = await verifyWhatsAppOTP(phone, token)
    
    if (result.success && result.userId) {
      // Create a session for the user
      // Note: In a real implementation, you'd get a JWT from the edge function
      // For now, we'll create a basic user object
      setUser({
        id: result.userId,
        email: '', // Phone users might not have email
        phone: phone,
      })
      return { error: null }
    }
    
    return { 
      error: result.success ? null : { message: result.error || 'Invalid OTP' } 
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('signin', window.location.pathname.startsWith('/login') ? '/login' : '/signin')

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/profile`,
      },
    })
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
