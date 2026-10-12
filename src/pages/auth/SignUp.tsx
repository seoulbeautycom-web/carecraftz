import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthModal } from '../../contexts/auth-modal-context'

/** Legacy /signup route — opens the auth popup instead of a full page. */
export default function SignUp() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    openAuthModal({ mode: 'signup', tab: 'email', next: '/profile' })
    navigate('/', { replace: true })
  }, [navigate, openAuthModal])

  return null
}
