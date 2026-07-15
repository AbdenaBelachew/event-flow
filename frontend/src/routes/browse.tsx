import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Alert from '../components/Alert'
import {
  Calendar,
  MapPin,
  Clock,
  Ticket as TicketIcon,
  Users,
  Minus,
  Plus,
  Check,
  Share2,
  ArrowLeft,
  Search,
  X,
  CalendarOff,
} from 'lucide-react'
import { format, formatDistanceToNow, isFuture, isPast, differenceInDays } from 'date-fns'
import { isUuid, slugify } from '../lib/slug'

interface Event {
  id: string
  title: string
  description: string
  venue: string
  city: string
  event_start: string
  event_end: string
  status: string
  cover_image_url?: string
}

type TimeScope = 'upcoming' | 'past'

function eventEndsAt(event: Event): Date {
  return new Date(event.event_end || event.event_start)
}

function isPastEvent(event: Event): boolean {
  return isPast(eventEndsAt(event))
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightEventId = searchParams.get('event')
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeScope, setTimeScope] = useState<TimeScope>('upcoming')
  const [showEventDetail, setShowEventDetail] = useState(!!highlightEventId)
  const [registrationError, setRegistrationError] = useState('')
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Ticket selection state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [linkCopied, setLinkCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const detailScrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'published'],
    queryFn: () => eventsAPI.listPublished().then((res) => res.data.events),
  })

  // The `?event=...` param may be either:
  //   - a UUID (legacy share links), or
  //   - a slugified event title, e.g. "addis-jazz-night-2026"
  // Resolve the slug to the real event id by matching against the
  // published list, so downstream queries still call /events/:id.
  const resolvedEventId = useMemo(() => {
    if (!highlightEventId || !data) return highlightEventId || null
    if (isUuid(highlightEventId)) return highlightEventId
    const target = slugify(highlightEventId)
    const match = data.find((e: Event) => slugify(e.title) === target)
    return match?.id ?? null
  }, [highlightEventId, data])

  const { data: sharedEvent, isLoading: eventLoading } = useQuery({
    queryKey: ['events', resolvedEventId],
    queryFn: () =>
      resolvedEventId
        ? eventsAPI.getEvent(resolvedEventId).then((res) => res.data.event)
        : null,
    enabled: !!resolvedEventId && showEventDetail,
  })

  const { data: availability } = useQuery({
    queryKey: ['events', resolvedEventId, 'availability'],
    queryFn: () =>
      resolvedEventId
        ? eventsAPI.getAvailability(resolvedEventId).then((res) => res.data)
        : null,
    enabled: !!resolvedEventId && showEventDetail,
  })

  useEffect(() => {
    if (resolvedEventId && data) {
      setShowEventDetail(true)
    }
  }, [resolvedEventId, data])

  // Auto-select the first on-sale ticket once availability loads,
  // or whenever the resolved event changes.
  useEffect(() => {
    if (!availability?.ticket_types) {
      setSelectedTicketId(null)
      return
    }
    const onSale = availability.ticket_types.filter((t: any) => t.on_sale)
    const pool = onSale.length > 0 ? onSale : availability.ticket_types
    if (pool.length === 0) {
      setSelectedTicketId(null)
      return
    }
    if (!pool.find((t: any) => t.id === selectedTicketId)) {
      setSelectedTicketId(pool[0].id)
      setQuantity(1)
    }
  }, [availability, resolvedEventId])

  // Reading-progress bar for the detail view
  useEffect(() => {
    const el = detailScrollRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [showEventDetail, sharedEvent])

  const handleCopyLink = async () => {
    if (typeof window === 'undefined' || !sharedEvent) return
    const url = `${window.location.origin}/browse?event=${slugify(sharedEvent.title)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const events: Event[] = data || []

  const { upcomingCount, pastCount } = useMemo(() => {
    let upcoming = 0
    let past = 0
    for (const event of events) {
      if (isPastEvent(event)) past += 1
      else upcoming += 1
    }
    return { upcomingCount: upcoming, pastCount: past }
  }, [events])

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = events.filter((event) => {
      const past = isPastEvent(event)
      const matchesTime = timeScope === 'past' ? past : !past
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        (event.description || '').toLowerCase().includes(q) ||
        (event.venue || '').toLowerCase().includes(q)
      const matchesCity =
        !cityFilter || event.city.toLowerCase() === cityFilter.toLowerCase()
      return matchesTime && matchesSearch && matchesCity
    })

    return filtered.sort((a, b) => {
      const aTime = new Date(a.event_start).getTime()
      const bTime = new Date(b.event_start).getTime()
      // Upcoming: soonest first. Past: most recent first.
      return timeScope === 'upcoming' ? aTime - bTime : bTime - aTime
    })
  }, [events, searchQuery, cityFilter, timeScope])

  const cities = Array.from(new Set(events.map((e) => e.city).filter(Boolean))).sort()

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault()
    setRegistrationError('')

    if (!registrationData.name || !registrationData.email || !registrationData.phone) {
      setRegistrationError('Name, email, and phone are required')
      return
    }

    if (!selectedTicketId) {
      setRegistrationError('Please choose a ticket type')
      return
    }

    const ticket = availability?.ticket_types?.find((t: any) => t.id === selectedTicketId)
    if (!ticket?.on_sale) {
      setRegistrationError('That ticket is not on sale right now')
      return
    }

    // Pass selection + buyer info so checkout does not ask again
    sessionStorage.setItem(
      'checkoutDraft',
      JSON.stringify({
        eventId: resolvedEventId,
        eventSlug: sharedEvent ? slugify(sharedEvent.title) : null,
        buyer: registrationData,
        cart: [
          {
            ticket_type_id: ticket.id,
            ticket_name: ticket.name,
            price: Number(ticket.price_etb),
            quantity,
            holder_name: registrationData.name,
          },
        ],
      })
    )
    navigate(`/events/${resolvedEventId}/checkout`)
  }

  // Shared-link param that we couldn't resolve (bad/unknown slug).
  // Don't leave the user on a blank detail view — show a clear message.
  const sharedLinkMissing =
    !!highlightEventId && !isLoading && !eventLoading && !resolvedEventId

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800">
      {sharedLinkMissing ? (
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-5">
            <CalendarOff className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            We can&apos;t find that event
          </h1>
          <p className="text-slate-600 mb-6">
            The link{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-sm">
              {highlightEventId}
            </code>{' '}
            doesn&apos;t match any event we have on EventFlow. It may have been
            removed, or the link might be off by a character.
          </p>
          <Button onClick={() => navigate('/browse')}>See all events</Button>
        </div>
      ) : showEventDetail && resolvedEventId && sharedEvent ? (
        <EventDetailView
          detailScrollRef={detailScrollRef}
          scrollProgress={scrollProgress}
          event={sharedEvent}
          availability={availability}
          selectedTicketId={selectedTicketId}
          setSelectedTicketId={setSelectedTicketId}
          quantity={quantity}
          setQuantity={setQuantity}
          registrationData={registrationData}
          handleRegistrationChange={handleRegistrationChange}
          registrationError={registrationError}
          setRegistrationError={setRegistrationError}
          handleRegistration={handleRegistration}
          handleCopyLink={handleCopyLink}
          linkCopied={linkCopied}
          onBack={() => {
            setShowEventDetail(false)
            navigate('/browse')
          }}
        />
      ) : (
        <BrowseGridView
          isLoading={isLoading}
          events={filteredEvents}
          timeScope={timeScope}
          setTimeScope={setTimeScope}
          upcomingCount={upcomingCount}
          pastCount={pastCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          cities={cities}
          onClearFilters={() => {
            setSearchQuery('')
            setCityFilter('')
          }}
          onOpenEvent={(id) => {
            setShowEventDetail(true)
            const ev = events.find((e) => e.id === id)
            if (ev) navigate(`/browse?event=${slugify(ev.title)}`, { replace: true })
          }}
        />
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Grid view
   -------------------------------------------------------------------------- */

function BrowseGridView(props: {
  isLoading: boolean
  events: Event[]
  timeScope: TimeScope
  setTimeScope: (v: TimeScope) => void
  upcomingCount: number
  pastCount: number
  searchQuery: string
  setSearchQuery: (v: string) => void
  cityFilter: string
  setCityFilter: (v: string) => void
  cities: string[]
  onClearFilters: () => void
  onOpenEvent: (id: string) => void
}) {
  const {
    isLoading,
    events,
    timeScope,
    setTimeScope,
    upcomingCount,
    pastCount,
    searchQuery,
    setSearchQuery,
    cityFilter,
    setCityFilter,
    cities,
    onClearFilters,
    onOpenEvent,
  } = props

  const hasFilters = !!searchQuery || !!cityFilter
  const scopeTotal = timeScope === 'upcoming' ? upcomingCount : pastCount

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
          <p className="font-display text-brand-600 text-xs font-bold tracking-[0.24em] uppercase mb-3">
            EventFlow · Ethiopia
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-slate-900 tracking-tight leading-tight">
                Browse events
              </h1>
              <p className="mt-2 text-slate-500 leading-relaxed">
                {timeScope === 'upcoming'
                  ? 'Nights still ahead — pick one, get a ticket, show up.'
                  : 'What already happened. Browse the archive.'}
              </p>
            </div>

            {/* Upcoming / Past toggle */}
            <div
              role="tablist"
              aria-label="Event time"
              className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-sm self-start"
            >
              {(
                [
                  { id: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
                  { id: 'past' as const, label: 'Past', count: pastCount },
                ] as const
              ).map((tab) => {
                const active = timeScope === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTimeScope(tab.id)}
                    className={[
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {tab.label}
                    {!isLoading && (
                      <span
                        className={[
                          'min-w-[1.25rem] h-5 px-1.5 rounded-md text-xs font-semibold tabular-nums inline-flex items-center justify-center',
                          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search & city */}
          <div className="mt-8 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, venue, or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-slate-700 min-w-[160px]"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
     
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {!isLoading && scopeTotal > 0 && (
          <p className="text-sm text-slate-500 mb-5">
            {hasFilters
              ? `${events.length} of ${scopeTotal} ${timeScope} ${scopeTotal === 1 ? 'event' : 'events'}`
              : `${events.length} ${timeScope} ${events.length === 1 ? 'event' : 'events'}`}
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 overflow-hidden"
              >
                <div className="h-48 bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="border border-slate-200 bg-slate-50/50 px-6 py-16 sm:py-20 text-center">
            <div className="w-12 h-12 bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-5">
              <CalendarOff className="w-6 h-6" />
            </div>
            {hasFilters ? (
              <>
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">
                  Nothing matches that
                </h3>
                <p className="text-slate-500 mb-5 max-w-sm mx-auto">
                  Try another city, or clear search to see all {timeScope} events.
                </p>
                <Button variant="outline" onClick={onClearFilters}>
                  Clear filters
                </Button>
              </>
            ) : timeScope === 'upcoming' ? (
              <>
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">
                  No upcoming events
                </h3>
                <p className="text-slate-500 mb-5 max-w-sm mx-auto">
                  {pastCount > 0
                    ? 'Nothing on the calendar right now. Check past events, or host your own.'
                    : 'When someone publishes an event, it shows up here.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {pastCount > 0 && (
                    <Button variant="outline" onClick={() => setTimeScope('past')}>
                      View past events
                    </Button>
                  )}
                  <Button onClick={() => (window.location.href = '/events/create')}>
                    Host an event
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">
                  No past events yet
                </h3>
                <p className="text-slate-500 mb-5 max-w-sm mx-auto">
                  Once nights wrap up, they land here.
                </p>
                {upcomingCount > 0 && (
                  <Button variant="outline" onClick={() => setTimeScope('upcoming')}>
                    View upcoming
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isPast={timeScope === 'past'}
                onOpen={() => onOpenEvent(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({
  event,
  isPast: past,
  onOpen,
}: {
  event: Event
  isPast: boolean
  onOpen: () => void
}) {
  const start = new Date(event.event_start)
  const inFuture = isFuture(start)
  const daysAway = inFuture ? differenceInDays(start, new Date()) : 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'group text-left bg-white overflow-hidden transition-colors flex flex-col h-full',
        'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
        past ? 'opacity-90' : '',
      ].join(' ')}
    >
      {event.cover_image_url ? (
        <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className={[
              'w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
              past ? 'grayscale-[30%]' : '',
            ].join(' ')}
          />
          {past && (
            <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wider bg-slate-900/75 text-white px-2 py-1">
              Ended
            </span>
          )}
        </div>
      ) : (
        <div
          className={[
            'relative w-full h-48 flex items-center justify-center',
            past
              ? 'bg-slate-100'
              : 'bg-gradient-to-br from-brand-100 via-brand-50 to-slate-50',
          ].join(' ')}
        >
          <Calendar
            className={['w-8 h-8', past ? 'text-slate-300' : 'text-brand-600/35'].join(' ')}
          />
          {past && (
            <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wider bg-slate-800 text-white px-2 py-1">
              Ended
            </span>
          )}
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
          {!past && inFuture && daysAway <= 14 ? (
            <span className="inline-flex items-center gap-1 text-brand-700 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {daysAway === 0
                ? 'Today'
                : daysAway === 1
                  ? 'Tomorrow'
                  : `In ${daysAway} days`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {format(start, 'EEE, MMM d')}
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>{format(start, 'h:mm a')}</span>
        </div>

        <h3 className="font-display text-lg font-semibold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-brand-700 transition-colors tracking-tight">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span className="truncate">
            {event.venue || 'Venue TBA'}
            {event.city ? ` · ${event.city}` : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

/* --------------------------------------------------------------------------
   Detail view
   -------------------------------------------------------------------------- */

function EventDetailView(props: {
  detailScrollRef: React.Ref<HTMLDivElement>
  scrollProgress: number
  event: any
  availability: any
  selectedTicketId: string | null
  setSelectedTicketId: (v: string | null) => void
  quantity: number
  setQuantity: (fn: (q: number) => number) => void
  registrationData: { name: string; email: string; phone: string }
  handleRegistrationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  registrationError: string
  setRegistrationError: (v: string) => void
  handleRegistration: (e: React.FormEvent) => void
  handleCopyLink: () => void
  linkCopied: boolean
  onBack: () => void
}) {
  const {
    detailScrollRef,
    scrollProgress,
    event,
    availability,
    selectedTicketId,
    setSelectedTicketId,
    quantity,
    setQuantity,
    registrationData,
    handleRegistrationChange,
    registrationError,
    setRegistrationError,
    handleRegistration,
    handleCopyLink,
    linkCopied,
    onBack,
  } = props

  const eventStart = new Date(event.event_start)
  const eventEnd = event.event_end ? new Date(event.event_end) : null
  const isUpcoming = isFuture(eventStart)
  const isOngoing = !isUpcoming && eventEnd ? !isPast(eventEnd) : false
  const hasEnded = !isUpcoming && !isOngoing
  const daysUntil = isUpcoming ? differenceInDays(eventStart, new Date()) : 0

  const ticketTypes: any[] = availability?.ticket_types || []
  const selectedTicket = ticketTypes.find((t) => t.id === selectedTicketId)
  const hasOnSale = ticketTypes.some((t) => t.on_sale)
  const allSoldOut =
    ticketTypes.length > 0 && ticketTypes.every((t) => t.sold_out || !t.on_sale)

  const totalRemaining = ticketTypes.reduce(
    (sum, t) => sum + Math.max(0, t.remaining || 0),
    0
  )

  const lowestPrice =
    ticketTypes.length > 0
      ? Math.min(...ticketTypes.map((t) => Number(t.price_etb) || 0))
      : null

  const subtotal =
    selectedTicket && selectedTicket.on_sale
      ? Number(selectedTicket.price_etb) * quantity
      : 0

  const statusLabel = (() => {
    if (allSoldOut) return 'Sold out'
    if (hasEnded) return 'Ended'
    if (isOngoing) return 'Happening now'
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `In ${daysUntil} days`
    if (hasOnSale) return 'On sale'
    return 'Upcoming'
  })()

  const canBuy = hasOnSale && !hasEnded

  return (
    <div
      ref={detailScrollRef}
      className="relative max-h-[calc(100vh-3.5rem)] overflow-y-auto bg-white"
    >
      <div className="sticky top-0 z-30 h-1 bg-slate-100">
        <div
          className="h-full bg-brand-600 transition-[width] duration-150"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      {/* Cover — image only, no overlays */}
      {event.cover_image_url ? (
        <div className="relative w-full h-[42vh] min-h-[240px] max-h-[420px] bg-slate-900 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover animate-[detailFade_0.7s_ease-out_both]"
          />
        </div>
      ) : (
        <div className="w-full h-2 bg-brand-600" aria-hidden />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between py-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All events
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Copy event link"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 text-brand-600" />
                Link copied
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>

        {/* Title block */}
        <header className="pt-8 sm:pt-10 pb-8 sm:pb-10 border-b border-slate-200 animate-[detailFade_0.55s_ease-out_both]">
          <p className="font-display text-brand-600 text-xs font-bold tracking-[0.22em] uppercase mb-4">
            {statusLabel}
            {event.city ? ` · ${event.city}` : ''}
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-[-0.035em] leading-[1.05] text-slate-900 max-w-3xl">
            {event.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
            {isUpcoming
              ? `Starts ${formatDistanceToNow(eventStart, { addSuffix: true })} · ${format(eventStart, 'EEEE, MMM d · h:mm a')}`
              : isOngoing
                ? `Started ${format(eventStart, 'EEE, MMM d · h:mm a')} — still going`
                : `Was ${format(eventStart, 'EEEE, MMM d, yyyy · h:mm a')}`}
          </p>
        </header>

        {/* Meta row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 animate-[detailFade_0.65s_ease-out_both]">
          <MetaCell
            icon={Calendar}
            label="When"
            value={format(eventStart, 'MMM d, yyyy')}
            hint={`${format(eventStart, 'h:mm a')}${
              eventEnd ? ` – ${format(eventEnd, 'h:mm a')}` : ''
            }`}
          />
          <MetaCell
            icon={MapPin}
            label="Where"
            value={event.venue || 'Venue TBA'}
            hint={event.city || undefined}
          />
          <MetaCell
            icon={TicketIcon}
            label="Tickets"
            value={
              lowestPrice != null
                ? `From Br ${lowestPrice.toFixed(0)}`
                : hasEnded
                  ? 'Closed'
                  : 'Not listed yet'
            }
            hint={
              ticketTypes.length > 0
                ? `${totalRemaining} left · ${ticketTypes.length} type${ticketTypes.length === 1 ? '' : 's'}`
                : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 py-10 sm:py-14">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-12 animate-[detailFade_0.7s_ease-out_both]">
            <section>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight mb-3">
                About
              </h2>
              {event.description ? (
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">
                  {event.description}
                </p>
              ) : (
                <p className="text-slate-400">
                  The organizer hasn&apos;t added a description yet.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                  Tickets
                </h2>
                {hasOnSale && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    {ticketTypes.filter((t: any) => t.on_sale).length} on sale
                  </span>
                )}
              </div>

              {ticketTypes.length === 0 ? (
                <div className="border border-slate-200 bg-slate-50/60 px-5 py-10 text-center">
                  <TicketIcon className="w-6 h-6 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-800">No tickets yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    The organizer is still setting things up.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 divide-y divide-slate-200">
                  {ticketTypes.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId
                    const isLow =
                      ticket.on_sale && ticket.remaining > 0 && ticket.remaining <= 10
                    const isOff = !ticket.on_sale || hasEnded
                    return (
                      <label
                        key={ticket.id}
                        className={[
                          'flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition-colors',
                          isOff
                            ? 'bg-slate-50/80 cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'bg-brand-50/70'
                              : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="ticketType"
                          value={ticket.id}
                          checked={isSelected}
                          disabled={isOff}
                          onChange={() => setSelectedTicketId(ticket.id)}
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-slate-900">
                              {ticket.name}
                            </h3>
                            {isLow && (
                              <span className="text-xs font-medium text-amber-700">
                                Only {ticket.remaining} left
                              </span>
                            )}
                            {(ticket.sold_out || isOff) && (
                              <span className="text-xs font-medium text-slate-500">
                                {ticket.sold_out ? 'Sold out' : 'Unavailable'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ticket.remaining} of{' '}
                            {ticket.remaining + ticket.quantity_sold} left
                            {ticket.max_per_order
                              ? ` · max ${ticket.max_per_order} each`
                              : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
                            Br {Number(ticket.price_etb).toFixed(0)}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              <p className="mt-5 text-xs text-slate-400">
                Pay with Chapa, Telebirr, CBE Birr, or card. Tickets email as soon
                as payment clears.
              </p>
            </section>
          </div>

          {/* Checkout column */}
          <div className="lg:col-span-5 animate-[detailFade_0.8s_ease-out_both]">
            <div className="lg:sticky lg:top-8 border border-slate-200 bg-white">
              <div className="h-1 bg-brand-600" aria-hidden />
              <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                  {canBuy ? 'Get tickets' : hasEnded ? 'This event ended' : 'Not on sale'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {canBuy
                    ? 'Your details go with you to checkout.'
                    : hasEnded
                      ? 'Registration is closed for this night.'
                      : 'Check back when tickets open.'}
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {registrationError && (
                  <Alert
                    type="error"
                    message={registrationError}
                    onClose={() => setRegistrationError('')}
                    className="mb-4"
                  />
                )}

                {!canBuy ? (
                  <div className="py-6 text-center">
                    <Users className="w-7 h-7 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      {hasEnded
                        ? 'Browse other upcoming events instead.'
                        : 'Tickets aren\'t available right now.'}
                    </p>
                    {hasEnded && (
                      <Button
                        variant="outline"
                        className="mt-5"
                        onClick={onBack}
                      >
                        Browse events
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleRegistration} className="space-y-4">
                    {selectedTicket && selectedTicket.on_sale && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 p-1">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className="w-10 h-10 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-display text-lg font-bold text-slate-900 tabular-nums w-12 text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity((q) =>
                                Math.min(
                                  Math.min(
                                    selectedTicket.max_per_order || 10,
                                    selectedTicket.remaining
                                  ),
                                  q + 1
                                )
                              )
                            }
                            disabled={
                              quantity >=
                              Math.min(
                                selectedTicket.max_per_order || 10,
                                selectedTicket.remaining
                              )
                            }
                            className="w-10 h-10 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <Input
                      label="Full name"
                      name="name"
                      value={registrationData.name}
                      onChange={handleRegistrationChange}
                      placeholder="Your name"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={registrationData.email}
                      onChange={handleRegistrationChange}
                      placeholder="your@email.com"
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationChange}
                      placeholder="+251..."
                      required
                    />

                    {selectedTicket && selectedTicket.on_sale && (
                      <div className="flex items-center justify-between py-3 border-y border-slate-100">
                        <span className="text-sm text-slate-500">Subtotal</span>
                        <span className="font-display text-xl font-bold text-brand-700 tabular-nums">
                          Br {subtotal.toFixed(0)}
                        </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      disabled={!selectedTicket}
                    >
                      Continue to checkout
                    </Button>

                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                      By continuing you agree to receive event-related emails.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes detailFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function MetaCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-start gap-3 py-5 sm:py-6 sm:px-5 first:sm:pl-0 last:sm:pr-0">
      <Icon className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-1 font-display font-semibold text-slate-900 truncate">
          {value}
        </p>
        {hint && <p className="text-sm text-slate-500 truncate">{hint}</p>}
      </div>
    </div>
  )
}
