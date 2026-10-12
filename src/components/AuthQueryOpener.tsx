import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthModal } from '../contexts/auth-modal-context'

/** Opens the auth popup when URL has ?auth=signin|signup */
export default function AuthQueryOpener() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const auth = params.get('auth')
    if (auth !== 'signin' && auth !== 'signup') return

    openAuthModal({
      mode: auth,
      tab: auth === 'signup' ? 'email' : 'phone',
      next: params.get('next')?.startsWith('/') ? params.get('next')! : '/profile',
    })

    params.delete('auth')
    params.delete('next')
    const nextSearch = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    )
  }, [location.pathname, location.search, navigate, openAuthModal])

  return null
}
