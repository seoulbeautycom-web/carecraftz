import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../lib/whatsapp'

interface User {
  id: string
  email: string
  phone?: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signInWithPhone: (phone: string) => Promise<{ error: any; confirmationRequired?: boolean }>
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          phone: session.user.phone || undefined,
        })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          phone: session.user.phone || undefined,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
