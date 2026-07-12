import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Calendar, MapPin, TrendingUp, Ticket } from 'lucide-react'
import { format } from 'date-fns'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
  })

  const { data: availability } = useQuery({
    queryKey: ['events', id, 'availability'],
    queryFn: () => eventsAPI.getAvailability(id!).then((res) => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" message="Failed to load event" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          ← Back to Dashboard
        </Button>

        {/* Hero */}
        {event.cover_image_url && (
          <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{format(new Date(event.event_start), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {event.venue} {event.city && `· ${event.city}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/events/${event.id}/edit`)}>Edit Event</Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${event.id}/stats`)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </Button>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-6">
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Ticket Types</h2>
          </CardHeader>
          <CardContent>
            {availability?.ticket_types && availability.ticket_types.length > 0 ? (
              <div className="space-y-4">
                {availability.ticket_types.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.name}</h3>
                      <p className="text-sm text-gray-600">
                        {ticket.remaining} of {ticket.remaining + (ticket.max_per_order || 10)} available
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        Br {ticket.price_etb}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.on_sale ? 'On Sale' : 'Not Available'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No ticket types available</p>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        {event.status === 'published' && availability?.on_sale && (
          <div className="mt-6">
            <Button
              size="lg"
              onClick={() => navigate(`/events/${event.id}/checkout`)}
              fullWidth
            >
              <Ticket className="w-5 h-5 mr-2" />
              Buy Tickets
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
