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

export default function BrowsePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightEventId = searchParams.get('event')
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
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

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        (event.description || '').toLowerCase().includes(q)
      const matchesCity = !cityFilter || event.city.toLowerCase() === cityFilter.toLowerCase()
      return matchesSearch && matchesCity
    })
  }, [events, searchQuery, cityFilter])

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

    if (!registrationData.name || !registrationData.email) {
      setRegistrationError('Name and email are required')
      return
    }

    if (!selectedTicketId) {
      setRegistrationError('Please choose a ticket type')
      return
    }

    // Store registration data and redirect to checkout
    sessionStorage.setItem(
      'registrantInfo',
      JSON.stringify(registrationData)
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
          totalCount={events.length}
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
  totalCount: number
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
    totalCount,
    searchQuery,
    setSearchQuery,
    cityFilter,
    setCityFilter,
    cities,
    onClearFilters,
    onOpenEvent,
  } = props

  const hasFilters = !!searchQuery || !!cityFilter

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          What&apos;s on this week
        </h1>
        <p className="text-slate-600 max-w-xl">
          Concerts, conferences, fundraisers, art shows — anything someone in
          Ethiopia is putting on. Pick one, get a ticket, show up.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 mb-8 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by event or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-xl border border-transparent bg-slate-50 focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700 min-w-[160px]"
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
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Result count */}
      {!isLoading && totalCount > 0 && (
        <p className="text-sm text-slate-500 mb-5">
          {events.length === totalCount
            ? `${totalCount} ${totalCount === 1 ? 'event' : 'events'}`
            : `${events.length} of ${totalCount} ${totalCount === 1 ? 'event' : 'events'}`}
        </p>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <div className="h-44 bg-slate-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                <div className="pt-2 flex gap-3">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-5">
            <CalendarOff className="w-6 h-6" />
          </div>
          {hasFilters ? (
            <>
              <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">
                Nothing matches that
              </h3>
              <p className="text-slate-600 mb-5 max-w-sm mx-auto">
                Try a different city, or clear the search to see everything.
              </p>
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">
                No events on EventFlow yet
              </h3>
              <p className="text-slate-600 mb-5 max-w-sm mx-auto">
                When someone publishes an event it&apos;ll show up here. Got
                something coming up? It takes about ten minutes to put on.
              </p>
              <Button onClick={() => (window.location.href = '/events/create')}>
                Create an event
              </Button>
            </>
          )}
        </div>
      )}

      {/* Events Grid */}
      {!isLoading && events.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => onOpenEvent(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, onOpen }: { event: Event; onOpen: () => void }) {
  const start = new Date(event.event_start)
  const inFuture = isFuture(start)
  const daysAway = inFuture ? differenceInDays(start, new Date()) : 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-card transition-all flex flex-col"
    >
      {event.cover_image_url ? (
        <div className="w-full h-44 bg-slate-100 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-brand-100 via-brand-50 to-slate-50 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-brand-600/40" />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          {inFuture && daysAway <= 14 ? (
            <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(start, 'EEE, MMM d')}
            </span>
          )}
          <span className="text-slate-300">·</span>
          <span>{format(start, 'h:mm a')}</span>
        </div>

        <h3 className="font-display text-lg font-semibold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-brand-700 transition-colors">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
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
  detailScrollRef: React.RefObject<HTMLDivElement>
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

  const subtotal =
    selectedTicket && selectedTicket.on_sale
      ? Number(selectedTicket.price_etb) * quantity
      : 0

  const statusPill = (() => {
    if (allSoldOut) return { label: 'Sold Out', tone: 'slate' as const }
    if (!isUpcoming && !isOngoing) return { label: 'Event Ended', tone: 'slate' as const }
    if (isOngoing) return { label: 'Happening now', tone: 'brand' as const }
    if (daysUntil === 0) return { label: 'Today', tone: 'amber' as const }
    if (daysUntil <= 7) return { label: `In ${daysUntil} days`, tone: 'amber' as const }
    return { label: 'On sale', tone: 'brand' as const }
  })()

  const pillStyles: Record<string, string> = {
    brand: 'bg-brand-600 text-white',
    amber: 'bg-amber-500 text-white',
    slate: 'bg-slate-700 text-white',
  }

  return (
    <div ref={detailScrollRef} className="relative max-h-screen overflow-y-auto bg-slate-50/60">
      {/* Reading progress bar */}
      <div className="sticky top-0 z-30 h-1 bg-slate-200/60">
        <div
          className="h-full bg-brand-600 transition-[width] duration-150"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      {/* HERO */}
      <div className="relative">
        {event.cover_image_url ? (
          <div className="relative h-[360px] md:h-[440px] w-full overflow-hidden bg-slate-900">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
          </div>
        ) : (
          <div className="relative h-[280px] md:h-[340px] w-full bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
        )}

        {/* Top bar over hero */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3.5 py-2 text-sm font-medium text-slate-800 shadow hover:bg-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3.5 py-2 text-sm font-medium text-slate-800 shadow hover:bg-white transition"
              aria-label="Copy event link"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 text-brand-600" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title block over hero */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-7 md:pb-9">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${pillStyles[statusPill.tone]}`}
              >
                {statusPill.label}
              </span>
              {event.city && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                  <MapPin className="w-3 h-3" />
                  {event.city}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight max-w-4xl">
              {event.title}
            </h1>

            {isUpcoming && (
              <p className="mt-3 text-white/85 text-sm md:text-base">
                Starts {formatDistanceToNow(eventStart, { addSuffix: true })} ·{' '}
                {format(eventStart, 'EEE, MMM d · h:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick facts strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <FactCard
            icon={Calendar}
            label="Date"
            primary={format(eventStart, 'MMM d, yyyy')}
            secondary={`${format(eventStart, 'h:mm a')}${
              eventEnd ? ` – ${format(eventEnd, 'h:mm a')}` : ''
            }`}
          />
          <FactCard
            icon={MapPin}
            label="Venue"
            primary={event.venue || 'TBA'}
            secondary={event.city || null}
          />
          <FactCard
            icon={Users}
            label="Availability"
            primary={
              ticketTypes.length === 0
                ? '—'
                : `${totalRemaining} ticket${totalRemaining === 1 ? '' : 's'} left`
            }
            secondary={
              ticketTypes.length > 0
                ? `${ticketTypes.length} type${ticketTypes.length === 1 ? '' : 's'}`
                : null
            }
          />
          <FactCard
            icon={TicketIcon}
            label="From"
            primary={
              ticketTypes.length > 0
                ? `Br ${Math.min(...ticketTypes.map((t) => Number(t.price_etb) || 0))}`
                : '—'
            }
            secondary="per ticket"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: About + Tickets */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">
                About this event
              </h2>
              {event.description ? (
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              ) : (
                <p className="text-slate-500 italic">
                  The organizer hasn&apos;t added a description yet.
                </p>
              )}
            </section>

            {/* Tickets */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Choose your ticket
                </h2>
                {hasOnSale && (
                  <span className="text-xs text-slate-500">
                    {ticketTypes.filter((t: any) => t.on_sale).length} on sale
                  </span>
                )}
              </div>

              {ticketTypes.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <TicketIcon className="w-5 h-5" />
                  </div>
                  <p className="text-slate-700 font-medium">No tickets on offer yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    The organizer is still setting things up. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ticketTypes.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId
                    const isLow =
                      ticket.on_sale && ticket.remaining > 0 && ticket.remaining <= 10
                    const isOff = !ticket.on_sale
                    return (
                      <label
                        key={ticket.id}
                        className={[
                          'relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300',
                          isOff
                            ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'border-brand-600 bg-gradient-to-br from-brand-50 to-white shadow-md shadow-brand-500/10 scale-[1.02]'
                              : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 hover:shadow hover:-translate-y-0.5',
                        ].join(' ')}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/10 rounded-bl-full rounded-tr-2xl -z-10" />
                        )}
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
                            <h3 className="font-medium text-slate-900">
                              {ticket.name}
                            </h3>
                            {isLow && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                Only {ticket.remaining} left
                              </span>
                            )}
                            {ticket.sold_out && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                Sold out
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {ticket.remaining} of{' '}
                            {ticket.remaining + ticket.quantity_sold} available
                            {ticket.max_per_order
                              ? ` · max ${ticket.max_per_order} per order`
                              : ''}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-semibold text-slate-900 tabular-nums">
                            Br {Number(ticket.price_etb).toFixed(0)}
                          </div>
                          <div className="text-xs text-slate-500">per ticket</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </section>

            <p className="text-xs text-slate-500 text-center">
              Pay with Chapa · Telebirr · CBE Birr · cards. Tickets land in your
              inbox the second payment clears.
            </p>
          </div>

          {/* RIGHT: register card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-brand-400 via-purple-400 to-pink-400 opacity-20 blur-xl transition duration-500 group-hover:opacity-30" />
                <div className="relative bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/50 bg-white/50">
                    <h3 className="font-display text-lg font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
                      Reserve your spot
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      We&apos;ll save your details and take you to payment.
                    </p>
                  </div>
  
                  <div className="p-6 bg-white/40">
                  {registrationError && (
                    <Alert
                      type="error"
                      message={registrationError}
                      onClose={() => setRegistrationError('')}
                      className="mb-4"
                    />
                  )}

                  {!hasOnSale && ticketTypes.length > 0 && (
                    <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-sm text-amber-800">
                      Tickets aren&apos;t on sale right now. Check back later.
                    </div>
                  )}

                  <form onSubmit={handleRegistration} className="space-y-4">
                    {/* Quantity stepper */}
                    {selectedTicket && selectedTicket.on_sale && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center justify-between rounded-xl bg-white border-2 border-slate-100 p-1.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-lg font-bold text-slate-900 tabular-nums w-12 text-center">
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
                            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
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
                      label="Phone (optional)"
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationChange}
                      placeholder="+251..."
                    />

                    {/* Subtotal */}
                    {selectedTicket && selectedTicket.on_sale && (
                      <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/60 p-4 flex items-center justify-between shadow-inner">
                        <span className="text-sm font-medium text-slate-600">Subtotal</span>
                        <span className="text-xl font-bold text-brand-600 tabular-nums">
                          Br {subtotal.toFixed(0)}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        disabled={!hasOnSale || !selectedTicket}
                        className="shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        {hasOnSale ? 'Continue to checkout' : 'Not on sale'}
                      </Button>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      By continuing you agree to receive event-related emails.
                    </p>
                  </form>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FactCard({
  icon: Icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  primary: string
  secondary: string | null
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-900 truncate">
        {primary}
      </div>
      {secondary && <div className="text-xs text-slate-500">{secondary}</div>}
    </div>
  )
}
