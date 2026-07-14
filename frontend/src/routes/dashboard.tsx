import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth-context'
import { eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Alert from '../components/Alert'
import PageHeader from '../components/PageHeader'
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
    case 'published': return 'success' as const
    case 'draft': return 'neutral' as const
    case 'sold_out': return 'danger' as const
    default: return 'warning' as const
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => eventsAPI.listMyEvents().then((res) => res.data.events),
  })

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
    .slice(0, 4)

  const hasFilters = searchQuery || filterStatus !== 'all'

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Organizer"
        title={`Hey, ${firstName}`}
        description={
          stats.upcoming > 0
            ? `${stats.upcoming} upcoming ${stats.upcoming === 1 ? 'event' : 'events'} on your calendar`
            : events.length > 0
              ? 'Manage tickets, check-ins, and sales from here'
              : 'Create your first event to get started'
        }
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/events/create')}
          >
            New event
          </Button>
        }
      />

      <div className="section pb-16 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total events" value={stats.total} />
          <StatCard label="Published" value={stats.published} accent="text-brand-600" />
          <StatCard label="Upcoming" value={stats.upcoming} accent="text-brand-600" />
          <StatCard label="Drafts" value={stats.draft} accent="text-amber-600" />
        </div>

        {/* Upcoming strip */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-900">Coming up</h2>
              {stats.thisWeek > 0 && (
                <span className="text-xs text-slate-500">
                  {stats.thisWeek} this week
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="text-left group bg-white border border-slate-200/80 rounded-xl p-4 hover:border-brand-200 hover:shadow-card transition-all duration-200"
                >
                  <p className="text-xs text-slate-500 mb-1">
                    {format(new Date(event.event_start), 'EEE, MMM d')}
                  </p>
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                    {event.title}
                  </p>
                  {event.venue && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{event.venue}</p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  filterStatus === opt.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <p className="text-sm text-slate-500">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'result' : 'results'}
            {' · '}
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear
            </button>
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-shimmer" />
            ))}
          </div>
        )}

        {isError && (
          <Alert type="error" message="Couldn't load events. Try refreshing the page." />
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <Card className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              {hasFilters ? (
                <Search className="w-5 h-5 text-brand-600" />
              ) : (
                <Calendar className="w-5 h-5 text-brand-600" />
              )}
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {hasFilters ? 'No matches' : 'No events yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              {hasFilters
                ? 'Try a different search or filter.'
                : 'Set up your first event — title, date, tickets — and publish when ready.'}
            </p>
            {!hasFilters && (
              <Button
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/events/create')}
              >
                Create event
              </Button>
            )}
          </Card>
        )}

        {/* Event list */}
        {!isLoading && !isError && filteredEvents.length > 0 && (
          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <EventRow
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
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = 'text-slate-900',
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight', accent)}>
        {value}
      </p>
    </div>
  )
}

function EventRow({
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
  const daysUntil =
    event.status === 'published' && isAfter(new Date(event.event_start), now)
      ? Math.ceil(
          (new Date(event.event_start).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null

  return (
    <div className="group bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 hover:shadow-card transition-all duration-200">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-brand-50">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className="text-sm sm:text-base font-medium text-slate-900 truncate cursor-pointer hover:text-brand-700 transition-colors"
              onClick={onView}
            >
              {event.title}
            </h3>
            <Badge variant={statusBadgeVariant(event.status)} size="sm">
              {formatStatus(event.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(event.event_start), 'MMM d, yyyy · h:mm a')}
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.venue}
                {event.city && `, ${event.city}`}
              </span>
            )}
            {daysUntil !== null && daysUntil > 0 && (
              <span className="text-brand-600 font-medium">
                {daysUntil}d away
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-2 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onView}
          className="sm:hidden p-2 text-slate-400"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
