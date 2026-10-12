import { Navigate } from 'react-router-dom'

/** Social & Contact moved under Partner Stores → My Store setup */
export default function SocialMedia() {
  return <Navigate to="/partners?tab=setup" replace />
}
