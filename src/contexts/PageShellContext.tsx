import { createContext, useContext, type RefObject } from 'react'

export type PageShellContextValue = {
  scrollRef: RefObject<HTMLDivElement | null>
  frameColor: string
}

const PageShellContext = createContext<PageShellContextValue | null>(null)

export function PageShellProvider({
  value,
  children,
}: {
  value: PageShellContextValue
  children: React.ReactNode
}) {
  return <PageShellContext.Provider value={value}>{children}</PageShellContext.Provider>
}

export function usePageShell() {
  const ctx = useContext(PageShellContext)
  if (!ctx) {
    throw new Error('usePageShell must be used within PageFrame')
  }
  return ctx
}

export function usePageShellOptional() {
  return useContext(PageShellContext)
}
