import { createContext, useContext } from 'react'

export interface User {
  id: string
  email: string
  phone?: string
  full_name?: string
}

export type AuthActionError = { message: string } | null

export interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthActionError }>
  signInWithPhone: (phone: string) => Promise<{ error: AuthActionError; confirmationRequired?: boolean }>
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthActionError }>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: AuthActionError }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthActionError }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthActionError }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
