import { createContext, useContext, useState, ReactNode } from 'react'

type SoapStage = 'packaged' | 'unwrapping' | 'unwrapped' | 'settled'

interface SoapContextType {
  stage: SoapStage
  setStage: (stage: SoapStage) => void
  scrollProgress: number
  setScrollProgress: (progress: number) => void
}

const SoapContext = createContext<SoapContextType>({
  stage: 'packaged',
  setStage: () => {},
  scrollProgress: 0,
  setScrollProgress: () => {},
})

export function SoapProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<SoapStage>('packaged')
  const [scrollProgress, setScrollProgress] = useState(0)

  return (
    <SoapContext.Provider value={{ stage, setStage, scrollProgress, setScrollProgress }}>
      {children}
    </SoapContext.Provider>
  )
}

export function useSoap() {
  return useContext(SoapContext)
}
