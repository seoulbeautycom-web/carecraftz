import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  AuthModalContext,
  type AuthModalMode,
  type AuthModalTab,
  type OpenAuthModalOptions,
} from './auth-modal-context'
import AuthModal from '../components/AuthModal'
import AuthQueryOpener from '../components/AuthQueryOpener'

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>('signin')
  const [tab, setTab] = useState<AuthModalTab>('phone')
  const [nextPath, setNextPath] = useState<string | null>(null)

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setMode(options?.mode || 'signin')
    setTab(options?.tab || 'phone')
    setNextPath(options?.next?.startsWith('/') ? options.next : null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      tab,
      nextPath,
      openAuthModal,
      closeAuthModal,
      setMode,
      setTab,
    }),
    [closeAuthModal, isOpen, mode, nextPath, openAuthModal, tab],
  )

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthQueryOpener />
      <AuthModal />
    </AuthModalContext.Provider>
  )
}
