import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI, staffAPI } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Alert from '../components/Alert'
import {
  Calendar,
  MapPin,
  TrendingUp,
  Ticket,
  Clock,
  Users,
  Share2,
  Check,
  Edit3,
  ScanLine,
  ArrowLeft,
  Info,
  AlertTriangle,
  CalendarOff,
  RefreshCw,
  Shield,
  UserPlus,
  Trash2,
} from 'lucide-react'
import { format, formatDistanceToNow, isFuture, isPast, differenceInDays } from 'date-fns'
import { useMemo, useState, useEffect } from 'react'
import { buildEventShareLink } from '../lib/slug'
import {
  useRequireEventOwner,
  canEditEvent,
  isDoorChecker,
  staffHomePath,
} from '../lib/event-access'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [copySuccess, setCopySuccess] = useState(false)
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    password: '',
  })
  const [staffError, setStaffError] = useState('')
  const [staffSuccess, setStaffSuccess] = useState('')
  const [createdStaffLink, setCreatedStaffLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const isChecker = isDoorChecker(user)
  const canCreateStaff =
    user?.role === 'company_admin' || user?.role === 'super_admin'

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
  })

  const isOwner = useRequireEventOwner(event, isLoading)
  const canManageStaff = canEditEvent(user, event)

  const { data: availability } = useQuery({
    queryKey: ['events', id, 'availability'],
    queryFn: () => eventsAPI.getAvailability(id!).then((res) => res.data),
    enabled: !!id && !!event,
  })

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['events', id, 'staff'],
    queryFn: () => staffAPI.listByEvent(id!).then((res) => res.data.staff),
    enabled: !!id && canCreateStaff && !!event,
  })

  const scannerPath = id ? `/events/${id}/scanner` : ''
  const scannerAbsoluteUrl =
    typeof window !== 'undefined' && scannerPath
      ? `${window.location.origin}${scannerPath}`
      : scannerPath

  const createStaffMutation = useMutation({
    mutationFn: (data: { full_name: string; email: string; password: string }) =>
      staffAPI.create(id!, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['events', id, 'staff'] })
      setCreatedStaffLink(scannerAbsoluteUrl)
      setStaffSuccess(
        `Door checker created for ${vars.email}. Share the login and this event scanner link with them.`
      )
      setStaffError('')
      setStaffForm({ full_name: '', email: '', password: '' })
      setStaffModalOpen(false)
    },
    onError: (err: any) => {
      setStaffError(
        err?.response?.data?.message || err?.message || 'Could not create door checker'
      )
      setStaffSuccess('')
      setCreatedStaffLink('')
    },
  })

  const removeStaffMutation = useMutation({
    mutationFn: (userId: string) => staffAPI.remove(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id, 'staff'] })
    },
  })

  // Build a human-readable share link once the event is loaded.
  const shareLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const title = event?.title || ''
    return buildEventShareLink(window.location.origin, title)
  }, [event?.title])

  // ---- derived timing data ----
  const timing = useMemo(() => {
    if (!event?.event_start) return null
    const start = new Date(event.event_start)
    const end = event.event_end ? new Date(event.event_end) : null
    const upcoming = isFuture(start)
    const ongoing = !upcoming && end ? !isPast(end) : false
    const daysUntil = upcoming ? differenceInDays(start, new Date()) : 0
    return { start, end, upcoming, ongoing, daysUntil }
  }, [event?.event_start, event?.event_end])

  const handleCopyLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = shareLink
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
    }
    setCopySuccess(true)
  }

  useEffect(() => {
    if (!copySuccess) return
    const t = setTimeout(() => setCopySuccess(false), 2000)
    return () => clearTimeout(t)
  }, [copySuccess])

  useEffect(() => {
    if (!staffSuccess) return
    const t = setTimeout(() => setStaffSuccess(''), 4000)
    return () => clearTimeout(t)
  }, [staffSuccess])

  const openStaffModal = () => {
    setStaffError('')
    setStaffForm({ full_name: '', email: '', password: '' })
    setStaffModalOpen(true)
  }

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault()
    setStaffError('')
    if (!staffForm.full_name.trim() || !staffForm.email.trim() || !staffForm.password) {
      setStaffError('Name, email, and password are required')
      return
    }
    if (staffForm.password.length < 8) {
      setStaffError('Password must be at least 8 characters')
      return
    }
    createStaffMutation.mutate({
      full_name: staffForm.full_name.trim(),
      email: staffForm.email.trim(),
      password: staffForm.password,
    })
  }

  // ---- derived status pill ----
  const statusPill = useMemo(() => {
    if (!event) return null
    const isPublished = event.status === 'published'
    const isDraft = event.status === 'draft'
    const isCancelled = event.status === 'cancelled'
    const ticketTypes: any[] = availability?.ticket_types || []
    const allSoldOut =
      ticketTypes.length > 0 && ticketTypes.every((t) => t.sold_out || !t.on_sale)

    if (isCancelled) {
      return {
        label: 'Cancelled',
        className: 'bg-red-500/90 text-white',
        dot: 'bg-white',
      }
    }
    if (allSoldOut) {
      return {
        label: 'Sold Out',
        className: 'bg-red-500/90 text-white',
        dot: 'bg-white',
      }
    }
    if (timing && !timing.upcoming && !timing.ongoing) {
      return {
        label: 'Event Ended',
        className: 'bg-gray-800/80 text-white',
        dot: 'bg-gray-300',
      }
    }
    if (timing?.ongoing) {
      return {
        label: 'Happening Now',
        className: 'bg-brand-500/90 text-white',
        dot: 'bg-white',
      }
    }
    if (isDraft) {
      return {
        label: 'Draft',
        className: 'bg-amber-500/90 text-white',
        dot: 'bg-white',
      }
    }
    if (timing && timing.upcoming && timing.daysUntil <= 7) {
      return {
        label: timing.daysUntil === 0 ? 'Today' : `${timing.daysUntil}d to go`,
        className: 'bg-amber-500/90 text-white',
        dot: 'bg-white',
      }
    }
    if (isPublished) {
      return {
        label: 'On Sale',
        className: 'bg-brand-500/90 text-white',
        dot: 'bg-white',
      }
    }
    return null
  }, [event, availability, timing])

  if (event && !isOwner) return null

  // ---- loading state ----
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 py-20">
        <div className="text-center px-4">
          <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-500 animate-pulse flex items-center justify-center">
              <Ticket className="w-8 h-8 xs:w-10 xs:h-10 text-white" />
            </div>
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-2 animate-pulse">
            Loading Event...
          </h2>
          <p className="text-sm xs:text-base text-gray-600">Please wait while we fetch the details</p>
        </div>
      </div>
    )
  }

  // ---- error state ----
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md xs:max-w-lg sm:max-w-xl w-full">
          <div className="bg-white rounded-2xl xs:rounded-3xl shadow-2xl border border-red-100 p-6 xs:p-8 sm:p-10 text-center transform hover:scale-105 transition-transform duration-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto animate-bounce">
                <AlertTriangle className="w-10 h-10 xs:w-12 xs:h-12 text-red-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-2xl animate-pulse"></div>
            </div>
            
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-gray-900 mb-3 xs:mb-4">
              Oops! Event Not Found
            </h1>
            <p className="text-base xs:text-lg text-gray-600 mb-6 xs:mb-8 leading-relaxed">
              The event you're looking for might have been removed or you don't have permission to view it.
            </p>
            
            <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center">
              <Button 
                onClick={() => refetch()} 
                size="lg"
                className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-200 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ticketTypes: any[] = availability?.ticket_types || []
  const hasOnSale = ticketTypes.some((t) => t.on_sale)
  const allSoldOut =
    ticketTypes.length > 0 && ticketTypes.every((t) => t.sold_out || !t.on_sale)
  const totalRemaining = ticketTypes.reduce(
    (sum, t) => sum + Math.max(0, t.remaining || 0),
    0
  )
  const minPrice =
    ticketTypes.length > 0
      ? Math.min(...ticketTypes.map((t) => Number(t.price_etb) || 0))
      : null
  const isPublished = event.status === 'published'

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-brand-50/30 to-brand-50/30 min-h-screen">
      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden">
        {event.cover_image_url ? (
          <div className="relative h-[220px] xs:h-[240px] sm:h-[280px] md:h-[320px] lg:h-[400px] xl:h-[460px] w-full overflow-hidden bg-gray-900">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-brand-600/10 animate-pulse"></div>
          </div>
        ) : (
          <div className="relative h-[200px] xs:h-[220px] sm:h-[260px] md:h-[300px] lg:h-[360px] xl:h-[420px] w-full bg-gradient-to-br from-brand-600 via-brand-600 to-brand-600 overflow-hidden">
            {/* Animated background pattern */}
            <div
              className="absolute inset-0 opacity-30 animate-pulse"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, white 2px, transparent 2px), radial-gradient(circle at 70% 60%, white 2px, transparent 2px)',
                backgroundSize: '50px 50px',
              }}
            />
            {/* Moving gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 via-transparent to-brand-600/20 animate-pulse"></div>
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
        )}

        {/* Top bar over hero */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-3 xs:py-3.5 sm:py-4 flex items-center justify-between gap-2 xs:gap-2.5 sm:gap-3">
            <button
              onClick={() =>
                navigate(isChecker ? staffHomePath(user) || scannerPath : '/dashboard')
              }
              className="inline-flex items-center gap-1.5 xs:gap-2 rounded-full bg-white/90 backdrop-blur-sm xs:backdrop-blur px-2.5 xs:px-3 sm:px-3.5 py-2 xs:py-2.5 sm:py-2.5 text-xs xs:text-[13px] sm:text-sm font-medium text-gray-800 shadow-sm xs:shadow hover:bg-white hover:shadow-md transition-all duration-200 min-h-[38px] xs:min-h-[40px] sm:min-h-[44px] active:scale-95"
              aria-label={isChecker ? 'Back to scanner' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden xs:inline xs:mr-0.5">Back to</span>
              <span className="inline xs:hidden">Back</span>
              <span className="hidden sm:inline ml-0.5">
                {isChecker ? 'Scanner' : 'Dashboard'}
              </span>
            </button>

            <button
              onClick={handleCopyLink}
              disabled={!shareLink}
              className="inline-flex items-center gap-1.5 xs:gap-2 rounded-full bg-white/90 backdrop-blur-sm xs:backdrop-blur px-2.5 xs:px-3 sm:px-3.5 py-2 xs:py-2.5 sm:py-2.5 text-xs xs:text-[13px] sm:text-sm font-medium text-gray-800 shadow-sm xs:shadow hover:bg-white hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] xs:min-h-[40px] sm:min-h-[44px] active:scale-95"
              aria-label={copySuccess ? "Link copied" : "Share event"}
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 text-brand-600" />
                  <span className="hidden xs:inline">Copied</span>
                  <span className="inline xs:hidden">Done</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5" />
                  <span className="hidden xs:inline">Share</span>
                  <span className="inline xs:hidden">Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title block over hero */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 pb-4 xs:pb-5 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12">
            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-2.5 mb-3 xs:mb-3.5 sm:mb-4">
              {statusPill && (
                <span
                  className={`inline-flex items-center gap-1 xs:gap-1.5 rounded-full px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-semibold tracking-wide shadow-sm ${statusPill.className}`}
                >
                  <span
                    className={`w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 rounded-full ${statusPill.dot} animate-pulse`}
                  />
                  {statusPill.label}
                </span>
              )}
              {event.city && (
                <span className="inline-flex items-center gap-1 xs:gap-1.5 rounded-full bg-white/15 backdrop-blur-sm xs:backdrop-blur px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-semibold text-white shadow-sm">
                  <MapPin className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                  {event.city}
                </span>
              )}
              {timing?.upcoming && timing.daysUntil > 0 && timing.daysUntil <= 30 && (
                <span className="inline-flex items-center gap-1 xs:gap-1.5 rounded-full bg-white/15 backdrop-blur-sm xs:backdrop-blur px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1 sm:py-1.5 text-[10px] xs:text-[11px] sm:text-xs font-semibold text-white shadow-sm">
                  <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                  {timing.daysUntil === 1 ? 'Tomorrow' : `In ${timing.daysUntil}d`}
                </span>
              )}
            </div>

            <h1 className="text-2xl xs:text-2.5xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg max-w-5xl leading-tight xs:leading-snug sm:leading-normal lg:leading-relaxed">
              {event.title}
            </h1>

            {timing?.upcoming && (
              <p className="mt-2 xs:mt-2.5 sm:mt-3 text-white/90 text-xs xs:text-[13px] sm:text-sm md:text-base leading-relaxed">
                <span className="font-medium">Starts {formatDistanceToNow(timing.start, { addSuffix: true })}</span> ·{' '}
                <span className="font-medium">{format(timing.start, 'EEE, MMM d')}</span> ·{' '}
                <span className="font-medium">{format(timing.start, 'h:mm a')}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---- BODY ---- */}
      <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-5 xs:py-6 sm:py-7 md:py-8 lg:py-10 xl:py-12">
        {/* Quick facts strip - Responsive grid */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3 mb-5 xs:mb-6 sm:mb-7 md:mb-8 lg:mb-10 xl:mb-12">
          {/* Date Card */}
          <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-2.5 xs:p-3 sm:p-3.5 md:p-4 transition-all duration-200 hover:scale-[1.02] hover:border-brand-200">
            <div className="flex items-center gap-1.5 xs:gap-2 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 xs:mb-1">
              <Calendar className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-brand-500" />
              Date
            </div>
            <div className="mt-0.5 xs:mt-1 text-[11px] xs:text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 truncate">
              {timing ? format(timing.start, 'MMM d, yyyy') : '—'}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-600 truncate mt-0.5">
              {timing
                ? `${format(timing.start, 'h:mm a')}${
                    timing.end ? ` – ${format(timing.end, 'h:mm a')}` : ''
                  }`
                : ''}
            </div>
          </div>

          {/* Venue Card */}
          <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-2.5 xs:p-3 sm:p-3.5 md:p-4 transition-all duration-200 hover:scale-[1.02] hover:border-rose-200">
            <div className="flex items-center gap-1.5 xs:gap-2 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 xs:mb-1">
              <MapPin className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-rose-500" />
              Venue
            </div>
            <div className="mt-0.5 xs:mt-1 text-[11px] xs:text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 truncate">
              {event.venue || 'TBA'}
            </div>
            {event.city && <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-600 truncate mt-0.5">{event.city}</div>}
          </div>

          {/* Availability Card */}
          <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-2.5 xs:p-3 sm:p-3.5 md:p-4 transition-all duration-200 hover:scale-[1.02] hover:border-brand-200">
            <div className="flex items-center gap-1.5 xs:gap-2 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 xs:mb-1">
              <Users className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-brand-500" />
              Availability
            </div>
            <div className="mt-0.5 xs:mt-1 text-[11px] xs:text-xs sm:text-sm md:text-[15px] font-bold text-gray-900">
              {ticketTypes.length > 0 ? `${totalRemaining} left` : '—'}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-600">
              {ticketTypes.length} {ticketTypes.length === 1 ? 'type' : 'types'}
            </div>
          </div>

          {/* Price Card */}
          <div className="bg-white rounded-lg xs:rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-2.5 xs:p-3 sm:p-3.5 md:p-4 transition-all duration-200 hover:scale-[1.02] hover:border-amber-200">
            <div className="flex items-center gap-1.5 xs:gap-2 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 xs:mb-1">
              <Ticket className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              From
            </div>
            <div className="mt-0.5 xs:mt-1 text-[11px] xs:text-xs sm:text-sm md:text-[15px] font-bold text-gray-900">
              {minPrice !== null ? `Br ${minPrice}` : '—'}
            </div>
            <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-gray-600">per ticket</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10">
          {/* LEFT: Main Content Column */}
          <div className="lg:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8">
            {/* About Section */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5">
                <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                  <Info className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-brand-500 flex-shrink-0" />
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">About this event</h2>
                </div>
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-5 md:px-6 pb-4 xs:pb-5 sm:pb-6">
                {event.description ? (
                  <div className="prose prose-sm xs:prose-base sm:prose-lg max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm xs:text-base sm:text-lg">
                      {event.description}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 xs:py-8 sm:py-10">
                    <Info className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-3 xs:mb-4" />
                    <p className="text-gray-500 italic text-sm xs:text-base">
                      No description has been added for this event yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-brand-500" />
                    <h2 className="text-xl font-bold text-gray-900">Ticket Types</h2>
                  </div>
                  {hasOnSale && (
                    <span className="text-xs text-gray-500">
                      {ticketTypes.filter((t) => t.on_sale).length} on sale
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {ticketTypes.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p>No ticket types have been set up yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {ticketTypes.map((ticket) => {
                      const isLow =
                        ticket.on_sale && ticket.remaining > 0 && ticket.remaining <= 10
                      return (
                        <div
                          key={ticket.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border ${
                            ticket.sold_out || !ticket.on_sale
                              ? 'border-gray-100 bg-gray-50 opacity-70'
                              : 'border-gray-200'
                          } gap-2 sm:gap-0`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{ticket.name}</h3>
                              {isLow && (
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                  <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  Only {ticket.remaining}
                                </span>
                              )}
                              {ticket.sold_out && (
                                <span className="text-[10px] sm:text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
                                  Sold out
                                </span>
                              )}
                              {!ticket.sold_out && !ticket.on_sale && (
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                  Not on sale
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {ticket.remaining} of{' '}
                              {ticket.remaining + (ticket.quantity_sold || 0)} available
                              {ticket.max_per_order
                                ? ` · max ${ticket.max_per_order} per order`
                                : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 sm:ml-3 lg:ml-4">
                            <p className="text-lg sm:text-xl font-bold text-gray-900">
                              Br {Number(ticket.price_etb).toFixed(0)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">per ticket</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share link */}
            {isPublished && canManageStaff && (
              <Card className="border-2 border-brand-200 bg-brand-50/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-brand-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Share with customers</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 text-sm">
                    Share this link with customers to let them browse and register for your event.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center min-w-0">
                      <code className="text-sm text-gray-700 truncate w-full">{shareLink}</code>
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      size="lg"
                      className={`${
                        copySuccess
                          ? 'bg-brand-600 hover:bg-brand-700'
                          : 'bg-brand-600 hover:bg-brand-700'
                      } text-white font-semibold transition-colors`}
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Door checkers — company admin only */}
            {canManageStaff && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-brand-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Door checkers</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Staff who can only scan tickets for this event.
                        </p>
                      </div>
                    </div>
                    <Button onClick={openStaffModal} size="sm">
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Create door checker
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Checker login goes to
                    </p>
                    <code className="text-xs sm:text-sm text-slate-800 break-all">
                      {scannerAbsoluteUrl}
                    </code>
                  </div>
                  {staffSuccess && (
                    <div className="mb-4 space-y-3">
                      <Alert
                        type="success"
                        message={staffSuccess}
                        onClose={() => {
                          setStaffSuccess('')
                          setCreatedStaffLink('')
                        }}
                      />
                      {createdStaffLink && (
                        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3">
                          <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide mb-2">
                            Their event link (scanner)
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <code className="flex-1 text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 truncate">
                              {createdStaffLink}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(createdStaffLink)
                                  setLinkCopied(true)
                                  setTimeout(() => setLinkCopied(false), 2000)
                                } catch {
                                  /* ignore */
                                }
                              }}
                            >
                              {linkCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Copied
                                </>
                              ) : (
                                'Copy link'
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            After login they open this page only — they cannot create events.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {staffLoading ? (
                    <p className="text-sm text-gray-500 py-4">Loading staff…</p>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">No door checkers yet</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        Create a login for someone at the door. They can only check in tickets for this event.
                      </p>
                      <Button className="mt-4" variant="outline" onClick={openStaffModal}>
                        <UserPlus className="w-4 h-4 mr-1.5" />
                        Create door checker
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                      {staffList.map((s: any) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-white"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{s.full_name}</p>
                            <p className="text-sm text-gray-500 truncate">{s.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${s.full_name}? They will no longer be able to check tickets.`
                                )
                              ) {
                                removeStaffMutation.mutate(s.id)
                              }
                            }}
                            disabled={removeStaffMutation.isPending}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                            aria-label={`Remove ${s.full_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: sticky action card */}
          <div className="lg:col-span-1">
            <div className="sticky top-16 sm:top-20 lg:top-24 space-y-2.5 sm:space-y-3">
              {/* Primary action card */}
              <Card className="shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-brand-600 to-brand-600 text-white border-b-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {isChecker ? 'Door check-in' : 'Event actions'}
                    </h3>
                    {isChecker ? (
                      <ScanLine className="w-5 h-5 text-white/80" />
                    ) : (
                      <Ticket className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                  <p className="text-xs text-white/85 mt-1">
                    {isChecker
                      ? 'Scan tickets for this event only.'
                      : 'Manage your event or open sales to the public.'}
                  </p>
                </CardHeader>
                <CardContent className="pt-5 space-y-2.5">
                  {isChecker ? (
                    <>
                      <Button
                        size="lg"
                        fullWidth
                        onClick={() => navigate(scannerPath)}
                        className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold shadow-md"
                      >
                        <ScanLine className="w-4 h-4 mr-2" />
                        Open Scanner
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate(`/events/${event.id}/stats`)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Stats
                      </Button>
                    </>
                  ) : (
                    <>
                      {isPublished && hasOnSale && !allSoldOut && (
                        <Button
                          size="lg"
                          fullWidth
                          onClick={() => navigate(`/events/${event.id}/checkout`)}
                          className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold shadow-md"
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          Buy Tickets
                        </Button>
                      )}

                      {isPublished && allSoldOut && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                          <CalendarOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>All tickets for this event are sold out.</span>
                        </div>
                      )}

                      {event.status === 'draft' && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            This event is a draft. Publish it from the edit page to start selling
                            tickets.
                          </span>
                        </div>
                      )}

                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>

                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate(`/events/${event.id}/stats`)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Stats
                      </Button>

                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate(scannerPath)}
                      >
                        <ScanLine className="w-4 h-4 mr-2" />
                        Open Scanner
                      </Button>

                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate(`/events/${event.id}/payments`)}
                      >
                        Approve payments
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event meta card */}
              <Card>
                <CardContent className="pt-5 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-500 text-xs">Created</div>
                      <div className="text-gray-900 font-medium">
                        {event.created_at
                          ? format(new Date(event.created_at), 'MMM d, yyyy')
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Ticket className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-500 text-xs">Ticket types</div>
                      <div className="text-gray-900 font-medium">{ticketTypes.length}</div>
                    </div>
                  </div>
                  {minPrice !== null && (
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-500 text-xs">Starts from</div>
                        <div className="text-gray-900 font-medium">Br {minPrice}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={staffModalOpen}
        onClose={() => {
          if (!createStaffMutation.isPending) setStaffModalOpen(false)
        }}
        title="Create door checker"
        description="This person can only check in tickets for this event. After login they go straight to the scanner — they cannot create events."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setStaffModalOpen(false)}
              disabled={createStaffMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-door-staff-form"
              isLoading={createStaffMutation.isPending}
            >
              Create account
            </Button>
          </>
        }
      >
        <form id="create-door-staff-form" onSubmit={handleCreateStaff} className="space-y-4">
          {staffError && (
            <Alert
              type="error"
              message={staffError}
              onClose={() => setStaffError('')}
            />
          )}
          <Input
            label="Full name"
            required
            value={staffForm.full_name}
            onChange={(e) =>
              setStaffForm((f) => ({ ...f, full_name: e.target.value }))
            }
            placeholder="e.g. Gate staff"
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            required
            value={staffForm.email}
            onChange={(e) =>
              setStaffForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="checker@example.com"
            autoComplete="off"
          />
          <Input
            label="Password"
            type="password"
            required
            value={staffForm.password}
            onChange={(e) =>
              setStaffForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="At least 8 characters"
            helperText="Share this password with them — they use it to log in and open the scanner."
            autoComplete="new-password"
          />
        </form>
      </Modal>
    </div>
  )
}
