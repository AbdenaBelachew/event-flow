import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Calendar, Plus, Eye, Edit3, Search, X } from 'lucide-react'
import { format } from 'date-fns'

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

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => eventsAPI.listMyEvents().then((res) => res.data.events),
  })

  const events: Event[] = data || []

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft: events.filter((e) => e.status === 'draft').length,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Events</h1>
              <p className="text-gray-500 mt-1">Manage and track your events</p>
            </div>
            <Button
              onClick={() => navigate('/events/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Events</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-3xl font-semibold text-green-600 mt-2">{stats.published}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Drafts</p>
            <p className="text-3xl font-semibold text-gray-700 mt-2">{stats.draft}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Search events
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="sold_out">Sold Out</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-blue-600"></div>
            </div>
            <p className="text-gray-500 mt-3">Loading events...</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <Alert type="error" message="Failed to load events. Please try again." />
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <div className="text-center py-16 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-600 font-medium">
              {searchQuery || filterStatus !== 'all'
                ? 'No events found'
                : 'No events yet'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button
                onClick={() => navigate('/events/create')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create your first event
              </Button>
            )}
          </div>
        )}

        {/* Events List */}
        {!isLoading && !isError && filteredEvents.length > 0 && (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow bg-white"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {event.venue && `${event.venue}`}
                          {event.venue && event.city && ' • '}
                          {event.city}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : event.status === 'sold_out'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(event.event_start), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{format(new Date(event.event_start), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/events/${event.id}/edit`)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
