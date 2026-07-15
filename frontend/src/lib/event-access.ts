import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, type User } from './auth-context'

/** True when the signed-in user can access this event (admin or assigned staff). */
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

/** Company admins / super admins can edit, create events, manage payments & staff. */
export function canEditEvent(
  user: User | null | undefined,
  event: { id?: string; company_id?: string } | null | undefined
): boolean {
  if (!user || !event) return false
  if (user.role === 'super_admin') return true
  if (user.role === 'company_admin' && user.company_id === event.company_id) {
    return true
  }
  return false
}

export function isDoorChecker(user: User | null | undefined): boolean {
  return user?.role === 'event_staff'
}

export function isSystemOwner(user: User | null | undefined): boolean {
  return user?.role === 'super_admin'
}

export function canCreateEvents(user: User | null | undefined): boolean {
  if (!user) return false
  return user.role === 'company_admin' || user.role === 'super_admin'
}

/** Post-login / account home path by role. */
export function homePath(user: User | null | undefined): string {
  if (user?.role === 'super_admin') return '/admin'
  if (user?.role === 'event_staff' && user.assigned_event_id) {
    return `/events/${user.assigned_event_id}/scanner`
  }
  return '/dashboard'
}

/** Where door staff land after login — their assigned event scanner. */
export function staffHomePath(user: User | null | undefined): string | null {
  if (user?.role === 'event_staff' && user.assigned_event_id) {
    return `/events/${user.assigned_event_id}/scanner`
  }
  return null
}

/**
 * Redirects when the current user cannot access the event at all.
 * Use on pages staff may open (detail, scanner, stats).
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
    if (!allowed) {
      navigate(staffHomePath(user) || '/dashboard', { replace: true })
    }
  }, [allowed, event, isLoading, navigate, user])

  return allowed
}

/**
 * Redirects door staff away from organizer-only pages (edit, payments, create).
 */
export function useRequireEventEditor(
  event: { id?: string; company_id?: string } | null | undefined,
  isLoading: boolean
) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const allowed = canEditEvent(user, event)

  useEffect(() => {
    if (isLoading) return
    if (isDoorChecker(user)) {
      navigate(staffHomePath(user) || '/login', { replace: true })
      return
    }
    if (!event) return
    if (!allowed) navigate('/dashboard', { replace: true })
  }, [allowed, event, isLoading, navigate, user])

  return allowed
}
