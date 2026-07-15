import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth-context'
import { eventsAPI } from '../lib/api'
import { isDoorChecker, staffHomePath, isSystemOwner, homePath } from '../lib/event-access'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Alert from '../components/Alert'
import {
  Calendar,
  Plus,
  Eye,
  Edit3,
  Search,
  X,
  MapPin,
  Clock,
  ArrowRight,
  FileText,
  Radio,
  CalendarDays,
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '../lib/cn'

interface Event {
  id: string
  title: string
  venue: string
  city: string
  event_start: string
  event_end: string
  status: string
  cover_image_url?: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'sold_out', label: 'Sold out' },
  { value: 'closed', label: 'Closed' },
] as const

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'published':
      return 'success' as const
    case 'draft':
      return 'neutral' as const
    case 'sold_out':
      return 'danger' as const
    default:
      return 'warning' as const
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Door checkers → scanner; system owner → platform admin.
  useEffect(() => {
    if (isSystemOwner(user)) {
      navigate(homePath(user), { replace: true })
      return
    }
    const home = staffHomePath(user)
    if (home) navigate(home, { replace: true })
  }, [user, navigate])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => eventsAPI.listMyEvents().then((res) => res.data.events),
    enabled: !!user && user.role !== 'event_staff' && user.role !== 'super_admin',
  })

  if (isDoorChecker(user) || isSystemOwner(user)) {
    return null
  }

  const events: Event[] = data || []
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const filteredEvents = events.filter((event) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      event.title.toLowerCase().includes(q) ||
      event.venue.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const now = new Date()
  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft: events.filter((e) => e.status === 'draft').length,
    upcoming: events.filter(
      (e) => isAfter(new Date(e.event_start), now) && e.status === 'published'
    ).length,
    thisWeek: events.filter((e) => {
      const d = new Date(e.event_start)
      return isAfter(d, now) && isBefore(d, addDays(now, 7))
    }).length,
  }

  const upcomingEvents = events
    .filter((e) => isAfter(new Date(e.event_start), now) && e.status === 'published')
    .sort((a, b) => new Date(a.event_start).getTime() - new Date(b.event_start).getTime())
    .slice(0, 5)

  const hasFilters = Boolean(searchQuery) || filterStatus !== 'all'

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-bg-soft" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" aria-hidden />

      {/* Header */}
      <header className="relative section pt-6 sm:pt-8 pb-5 sm:pb-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
              Organizer
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold text-slate-900 tracking-tight">
              Hey, {firstName}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
              {stats.upcoming > 0
                ? `${stats.upcoming} upcoming ${stats.upcoming === 1 ? 'event' : 'events'} on your calendar`
                : events.length > 0
                  ? 'Manage tickets, check-ins, and sales from here'
                  : 'Create your first event to get started'}
            </p>
          </div>

          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/events/create')}
            className="w-full sm:w-auto shrink-0"
          >
            New event
          </Button>
        </div>
      </header>

      <div className="relative section pb-20 sm:pb-16 space-y-6 sm:space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard
            label="Total events"
            value={stats.total}
            icon={<CalendarDays className="w-4 h-4" />}
          />
          <StatCard
            label="Published"
            value={stats.published}
            icon={<Radio className="w-4 h-4" />}
            accent="text-brand-600"
            iconBg="bg-brand-50 text-brand-600"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon={<Calendar className="w-4 h-4" />}
            accent="text-brand-700"
            iconBg="bg-brand-50 text-brand-700"
          />
          <StatCard
            label="Drafts"
            value={stats.draft}
            icon={<FileText className="w-4 h-4" />}
            accent="text-amber-600"
            iconBg="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Mobile upcoming strip */}
        {upcomingEvents.length > 0 && (
          <section className="lg:hidden animate-fade-in-up">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Coming up
              </h2>
              {stats.thisWeek > 0 && (
                <span className="text-xs text-slate-500">
                  {stats.thisWeek} this week
                </span>
              )}
            </div>
            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="snap-start shrink-0 w-[min(78vw,280px)] text-left group bg-white/90 border border-slate-200/80 rounded-2xl p-4 hover:border-brand-200 hover:shadow-card transition-all duration-200"
                >
                  <p className="text-xs font-medium text-brand-600 mb-1.5">
                    {format(new Date(event.event_start), 'EEE, MMM d · h:mm a')}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                    {event.title}
                  </p>
                  {event.venue && (
                    <p className="text-xs text-slate-400 mt-1.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {event.venue}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Main + sidebar */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
          <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* Filters */}
            <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 lg:py-0 bg-slate-50/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-slate-200/60 lg:border-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search events…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-base pl-10 pr-10 h-11"
                    aria-label="Search events"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div
                  className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5"
                  role="tablist"
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="tab"
                      aria-selected={filterStatus === opt.value}
                      onClick={() => setFilterStatus(opt.value)}
                      className={cn(
                        'px-3.5 h-11 text-sm font-medium rounded-xl whitespace-nowrap transition-colors',
                        filterStatus === opt.value
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <p className="mt-2.5 text-sm text-slate-500">
                  {filteredEvents.length}{' '}
                  {filteredEvents.length === 1 ? 'result' : 'results'}
                  {' · '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterStatus('all')
                    }}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Clear
                  </button>
                </p>
              )}
            </div>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[7.5rem] sm:h-24 rounded-2xl border border-slate-200/80 animate-shimmer"
                  />
                ))}
              </div>
            )}

            {isError && (
              <Alert type="error" message="Couldn't load events. Try refreshing the page." />
            )}

            {!isLoading && !isError && filteredEvents.length === 0 && (
              <EmptyState
                hasFilters={hasFilters}
                onCreate={() => navigate('/events/create')}
                onClear={() => {
                  setSearchQuery('')
                  setFilterStatus('all')
                }}
              />
            )}

            {!isLoading && !isError && filteredEvents.length > 0 && (
              <div className="space-y-3 stagger">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    now={now}
                    onView={() => navigate(`/events/${event.id}`)}
                    onEdit={() => navigate(`/events/${event.id}/edit`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block space-y-4 sticky top-20 animate-fade-in-up">
            {upcomingEvents.length > 0 ? (
              <div className="surface-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Coming up
                  </h2>
                  {stats.thisWeek > 0 && (
                    <span className="text-xs text-slate-500">
                      {stats.thisWeek} this week
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-brand-50/70 transition-colors group"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600 mb-0.5">
                          {format(new Date(event.event_start), 'EEE, MMM d')}
                        </p>
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">
                          {event.title}
                        </p>
                        {event.venue && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {event.venue}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="surface-card p-5">
                <h2 className="font-display text-sm font-semibold text-slate-900 mb-1">
                  Coming up
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Published events with future dates will show here.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 to-white p-5">
              <p className="font-display text-sm font-semibold text-slate-900 mb-1">
                Ready to go live?
              </p>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Add ticket types, share your link, and approve payments as they come in.
              </p>
              <Button
                size="sm"
                fullWidth
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate('/events/create')}
              >
                Create event
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = 'text-slate-900',
  icon,
  iconBg = 'bg-slate-100 text-slate-500',
}: {
  label: string
  value: number
  accent?: string
  icon: ReactNode
  iconBg?: string
}) {
  return (
    <div className="bg-white/90 border border-slate-200/80 rounded-2xl px-4 py-4 sm:px-5 sm:py-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-slate-500 leading-snug">{label}</p>
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
            iconBg
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          'font-display text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight',
          accent
        )}
      >
        {value}
      </p>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean
  onCreate: () => void
  onClear: () => void
}) {
  return (
    <div className="surface-card text-center py-14 sm:py-16 px-6 animate-scale-in">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        {hasFilters ? (
          <Search className="w-6 h-6 text-brand-600" />
        ) : (
          <Calendar className="w-6 h-6 text-brand-600" />
        )}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900 mb-1.5">
        {hasFilters ? 'No matches' : 'No events yet'}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {hasFilters
          ? 'Try a different search or filter.'
          : 'Set up your first event — title, date, tickets — and publish when ready.'}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      ) : (
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={onCreate}>
          Create event
        </Button>
      )}
    </div>
  )
}

function EventCard({
  event,
  now,
  onView,
  onEdit,
}: {
  event: Event
  now: Date
  onView: () => void
  onEdit: () => void
}) {
  const start = new Date(event.event_start)
  const daysUntil =
    event.status === 'published' && isAfter(start, now)
      ? Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

  return (
    <article className="group bg-white/95 border border-slate-200/80 rounded-2xl hover:border-slate-300 hover:shadow-card transition-all duration-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-4">
        {/* Cover */}
        <button
          type="button"
          onClick={onView}
          className="relative w-full sm:w-28 md:w-32 h-36 sm:h-24 md:h-28 shrink-0 overflow-hidden bg-brand-50 sm:rounded-l-2xl focus-visible:outline-none"
          aria-label={`Open ${event.title}`}
        >
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100/80">
              <Calendar className="w-7 h-7 text-brand-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent sm:hidden" />
          <div className="absolute top-3 left-3 sm:hidden">
            <Badge variant={statusBadgeVariant(event.status)} size="sm" dot>
              {formatStatus(event.status)}
            </Badge>
          </div>
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0 px-4 pb-4 pt-3.5 sm:py-4 sm:pr-2 sm:pl-0">
          <div className="flex items-start gap-2 mb-1.5">
            <h3 className="font-display text-[15px] sm:text-base font-semibold text-slate-900 truncate flex-1 min-w-0">
              <button
                type="button"
                onClick={onView}
                className="hover:text-brand-700 transition-colors text-left truncate max-w-full"
              >
                {event.title}
              </button>
            </h3>
            <Badge
              variant={statusBadgeVariant(event.status)}
              size="sm"
              className="hidden sm:inline-flex shrink-0"
            >
              {formatStatus(event.status)}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-1 gap-x-3 text-xs sm:text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {format(start, 'MMM d, yyyy · h:mm a')}
              </span>
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">
                  {event.venue}
                  {event.city ? `, ${event.city}` : ''}
                </span>
              </span>
            )}
          </div>

          {daysUntil !== null && daysUntil > 0 && (
            <p className="mt-2 text-xs font-semibold text-brand-600">
              {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days away`}
            </p>
          )}

          {/* Mobile actions */}
          <div className="mt-3.5 flex gap-2 sm:hidden">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={onView}
            >
              Open
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={onEdit}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-1.5 pr-4 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onView}
            className="p-2.5 rounded-xl text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onView}
            className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
            title="Open"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
