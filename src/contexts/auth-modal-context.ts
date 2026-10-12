import { createContext, useContext } from 'react'

export type AuthModalMode = 'signin' | 'signup'
export type AuthModalTab = 'phone' | 'email'

export type OpenAuthModalOptions = {
  mode?: AuthModalMode
  tab?: AuthModalTab
  /** Path to go to after a successful sign-in */
  next?: string
}

export type AuthModalContextValue = {
  isOpen: boolean
  mode: AuthModalMode
  tab: AuthModalTab
  nextPath: string | null
  openAuthModal: (options?: OpenAuthModalOptions) => void
  closeAuthModal: () => void
  setMode: (mode: AuthModalMode) => void
  setTab: (tab: AuthModalTab) => void
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return ctx
}

export function useAuthModalOptional() {
  return useContext(AuthModalContext)
}
