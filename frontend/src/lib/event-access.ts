import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, type User } from './auth-context'

/** True when the signed-in user can manage this event. */
export function canManageEvent(
  user: User | null | undefined,
  event: { id?: string; company_id?: string } | null | undefined
): boolean {
  if (!user || !event) return false
  if (user.role === 'super_admin') return true
  if (user.role === 'company_admin' && user.company_id === event.company_id) {
    return true
  }
  if (user.role === 'event_staff' && user.assigned_event_id === event.id) {
    return true
  }
  return false
}

/**
 * Redirects to /dashboard when the current user does not own the event.
 * Use on organizer-only pages (detail, edit, scanner, stats, payments).
 */
export function useRequireEventOwner(
  event: { id?: string; company_id?: string } | null | undefined,
  isLoading: boolean
) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const allowed = canManageEvent(user, event)

  useEffect(() => {
    if (isLoading || !event) return
    if (!allowed) navigate('/dashboard', { replace: true })
  }, [allowed, event, isLoading, navigate])

  return allowed
}
