import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

/**
 * Gate that protects authenticated routes. The global Navbar is rendered
 * once by `AppLayout`, so this component only handles auth checking +
 * rendering the matched child route via <Outlet />.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
