import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthModal } from '../../contexts/auth-modal-context'

/** Legacy /signin route — opens the auth popup instead of a full page. */
export default function SignIn() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    openAuthModal({ mode: 'signin', tab: 'phone', next: '/profile' })
    navigate('/', { replace: true })
  }, [navigate, openAuthModal])

  return null
}
