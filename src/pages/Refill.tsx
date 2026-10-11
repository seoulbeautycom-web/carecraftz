import { Navigate } from 'react-router-dom'

/** Legacy path — refill program page is now Why Us. */
export default function Refill() {
  return <Navigate to="/why-us" replace />
}
