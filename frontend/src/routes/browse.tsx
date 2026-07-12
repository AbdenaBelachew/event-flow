import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import { format } from 'date-fns'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'published'],
    queryFn: () => eventsAPI.listPublished().then((res) => res.data.events),
  })

  const events: Event[] = data || []

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = !cityFilter || event.city.toLowerCase() === cityFilter.toLowerCase()
    return matchesSearch && matchesCity
  })

  const cities = Array.from(new Set(events.map((e) => e.city).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Events</h1>
          <p className="text-gray-600">Discover and book tickets for upcoming events</p>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchQuery('')
              setCityFilter('')
            }}
            fullWidth
          >
            Clear Filters
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEvents.length === 0 && (
          <Card className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {searchQuery || cityFilter
                ? 'Try adjusting your filters'
                : 'Check back soon for new events'}
            </p>
          </Card>
        )}

        {/* Events Grid */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                hoverable
                onClick={() => navigate(`/events/${event.id}`)}
                className="overflow-hidden flex flex-col"
              >
                {event.cover_image_url && (
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <CardHeader>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(event.event_start), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {event.venue} {event.city && `· ${event.city}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <Button fullWidth onClick={(e) => e.stopPropagation()}>
                    View & Buy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
