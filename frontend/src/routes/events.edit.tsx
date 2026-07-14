import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { eventsAPI, ticketTypesAPI } from '../lib/api'
import Input, { TextArea } from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import Modal from '../components/Modal'
import { Calendar, MapPin, FileImage, ChevronLeft, Edit3, AlertCircle, ArrowLeft } from 'lucide-react'
import { useRequireEventOwner } from '../lib/event-access'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    venue: '',
    city: '',
    event_start: '',
    event_end: '',
    sales_start: '',
    sales_end: '',
    cover_image_url: '',
  })

  const [ticketFormData, setTicketFormData] = useState({
    name: '',
    price_etb: 0,
    quantity_total: 100,
    sales_start: '',
    sales_end: '',
    max_per_order: 10,
    is_active: true,
  })

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
  })

  const isOwner = useRequireEventOwner(event, eventLoading)
  if (event && !isOwner) return null

  const { data: ticketTypes = [], refetch: refetchTickets } = useQuery({
    queryKey: ['events', id, 'ticket-types'],
    queryFn: () => ticketTypesAPI.listByEvent(id!).then((res) => res.data.ticket_types),
  })

  const updateEventMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.updateEvent(id!, data),
    onSuccess: () => {
      setSuccess('Event updated successfully!')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update event')
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => eventsAPI.publishEvent(id!),
    onSuccess: () => {
      setSuccess('Event published successfully!')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to publish event')
    },
  })

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ticketTypesAPI.create(id!, data),
    onSuccess: () => {
      setSuccess('Ticket type created!')
      setShowTicketModal(false)
      setEditingTicket(null)
      setTicketFormData({
        name: '',
        price_etb: 0,
        quantity_total: 100,
        sales_start: '',
        sales_end: '',
        max_per_order: 10,
        is_active: true,
      })
      refetchTickets()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create ticket type')
    },
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: any }) =>
      ticketTypesAPI.update(ticketId, data),
    onSuccess: () => {
      setSuccess('Ticket type updated!')
      setShowTicketModal(false)
      setEditingTicket(null)
      setTicketFormData({
        name: '',
        price_etb: 0,
        quantity_total: 100,
        sales_start: '',
        sales_end: '',
        max_per_order: 10,
        is_active: true,
      })
      refetchTickets()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update ticket type')
    },
  })

  useEffect(() => {
    if (event) {
      setEventFormData({
        title: event.title || '',
        description: event.description || '',
        venue: event.venue || '',
        city: event.city || '',
        event_start: event.event_start ? event.event_start.slice(0, 16) : '',
        event_end: event.event_end ? event.event_end.slice(0, 16) : '',
        sales_start: event.sales_start ? event.sales_start.slice(0, 16) : '',
        sales_end: event.sales_end ? event.sales_end.slice(0, 16) : '',
        cover_image_url: event.cover_image_url || '',
      })
      if (event.cover_image_url) {
        setImagePreview(event.cover_image_url)
        const urlParts = event.cover_image_url.split('/')
        setFileName(urlParts[urlParts.length - 1])
      }
    }
  }, [event])

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreview(result)
        setEventFormData((prev) => ({
          ...prev,
          cover_image_url: result,
        }))
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setFileName('')
    setEventFormData((prev) => ({
      ...prev,
      cover_image_url: '',
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value =
      e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.type === 'number'
          ? parseFloat(e.target.value)
          : e.target.value
    setTicketFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (new Date(eventFormData.sales_start) >= new Date(eventFormData.sales_end)) {
      setError('Sales start must be before sales end')
      return
    }

    if (new Date(eventFormData.event_start) >= new Date(eventFormData.event_end)) {
      setError('Event start must be before event end')
      return
    }

    if (new Date(eventFormData.sales_end) > new Date(eventFormData.event_end)) {
      setError('Sales end must be before or at event end')
      return
    }

    updateEventMutation.mutate(eventFormData as any)
  }

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketFormData.name || ticketFormData.price_etb < 0) {
      setError('Please fill in all required fields')
      return
    }
    
    if (editingTicket) {
      // Update existing ticket
      updateTicketMutation.mutate({ 
        ticketId: editingTicket.id, 
        data: ticketFormData 
      })
    } else {
      // Create new ticket
      createTicketMutation.mutate(ticketFormData as any)
    }
  }

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket)
    setTicketFormData({
      name: ticket.name,
      price_etb: ticket.price_etb,
      quantity_total: ticket.quantity_total,
      sales_start: ticket.sales_start ? ticket.sales_start.slice(0, 16) : '',
      sales_end: ticket.sales_end ? ticket.sales_end.slice(0, 16) : '',
      max_per_order: ticket.max_per_order,
      is_active: ticket.is_active,
    })
    setShowTicketModal(true)
  }

  const handleCloseTicketModal = () => {
    setShowTicketModal(false)
    setEditingTicket(null)
    setTicketFormData({
      name: '',
      price_etb: 0,
      quantity_total: 100,
      sales_start: '',
      sales_end: '',
      max_per_order: 10,
      is_active: true,
    })
  }

  const handlePublish = () => {
    if (ticketTypes.length === 0) {
      setError('Add at least one active ticket type before publishing')
      return
    }
    publishMutation.mutate()
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="text-center px-4">
          <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-500 animate-pulse flex items-center justify-center">
              <Edit3 className="w-8 h-8 xs:w-10 xs:h-10 text-white" />
            </div>
          </div>
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-2 animate-pulse">
            Loading Editor...
          </h2>
          <p className="text-sm xs:text-base text-gray-600">Preparing your event for editing</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl xs:rounded-3xl shadow-2xl border border-red-100 p-6 xs:p-8 text-center">
            <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertCircle className="w-10 h-10 xs:w-12 xs:h-12 text-red-500" />
            </div>
            <h2 className="text-2xl xs:text-3xl font-bold text-gray-900 mb-3">Event Not Found</h2>
            <p className="text-base text-gray-600 mb-6">This event doesn't exist or has been deleted.</p>
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold w-full"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/50 to-brand-50/50 relative">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-brand-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-600 to-brand-600 text-white py-5 xs:py-6 sm:py-7 md:py-8 lg:py-10 shadow-xl relative overflow-hidden">
        {/* Animated header background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-brand-600/20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4 sm:gap-5 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <div className="flex-1 order-2 xs:order-1">
              <button
                onClick={() => navigate(`/events/${id}`)}
                className="flex items-center space-x-1.5 xs:space-x-2 hover:opacity-90 hover:scale-105 transition-all duration-200 text-white/90 hover:text-white mb-2 xs:mb-3 sm:mb-4 text-sm xs:text-base sm:text-lg font-medium"
                aria-label="Back to event details"
              >
                <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                <span className="text-sm xs:text-base sm:text-lg">Back to Event</span>
              </button>
              <h1 className="text-2xl xs:text-2.5xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight xs:leading-snug sm:leading-normal lg:leading-relaxed tracking-tight">
                {event.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 order-1 xs:order-2 mb-3 xs:mb-0">
              {event.status === 'draft' && (
                <Button
                  onClick={handlePublish}
                  isLoading={publishMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-semibold text-xs xs:text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  size="lg"
                >
                  Publish Event
                </Button>
              )}
              {event.status === 'published' && (
                <span className="px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 bg-white/20 backdrop-blur-lg text-white rounded-xl xs:rounded-2xl text-xs xs:text-sm sm:text-base font-semibold border border-white/30 shadow-lg">
                  Published ✓
                </span>
              )}
            </div>
          </div>
          <p className="text-white/90 text-sm xs:text-base sm:text-lg md:text-xl font-medium leading-relaxed">
            Update your event details, manage tickets, and customize everything
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-5 xs:py-6 sm:py-7 md:py-8 lg:py-10 xl:py-12">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-5 xs:mb-6 sm:mb-8"
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            className="mb-5 xs:mb-6 sm:mb-8"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpdateEvent} className="space-y-8">
              {/* Basic Information Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-brand-50 via-brand-50 to-brand-50 border-b-3 border-brand-300 px-3 xs:px-4 sm:px-5 md:px-6 py-4 xs:py-5 sm:py-6">
                  <div className="flex items-center space-x-3 xs:space-x-4">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-600 text-white flex items-center justify-center font-bold text-lg xs:text-xl sm:text-2xl shadow-lg">
                      1
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Event Details</h2>
                      <p className="text-gray-600 mt-1 xs:mt-1.5 text-sm xs:text-base">Update your event information</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 xs:space-y-5 sm:space-y-6 pt-5 xs:pt-6 sm:pt-8 px-3 xs:px-4 sm:px-5 md:px-6 pb-4 xs:pb-5 sm:pb-6">
                  <Input
                    label="Event Title"
                    name="title"
                    value={eventFormData.title}
                    onChange={handleEventChange}
                    required
                    placeholder="e.g., Tech Summit 2026, Music Festival..."
                    className="text-base xs:text-lg sm:text-xl"
                    size="lg"
                  />
                  <TextArea
                    label="Description"
                    name="description"
                    value={eventFormData.description}
                    onChange={handleEventChange}
                    placeholder="Tell attendees what your event is about"
                    rows={4}
                    helperText="Be creative and descriptive to attract more attendees"
                    className="text-sm xs:text-base sm:text-lg"
                  />
                </CardContent>
              </Card>

              {/* Location Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-brand-50 via-brand-50 to-purple-50 border-b-3 border-brand-300 px-3 xs:px-4 sm:px-5 md:px-6 py-4 xs:py-5 sm:py-6">
                  <div className="flex items-center space-x-3 xs:space-x-4">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-600 text-white flex items-center justify-center font-bold text-lg xs:text-xl sm:text-2xl shadow-lg">
                      2
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Location</h2>
                      <p className="text-gray-600 mt-1 xs:mt-1.5 text-sm xs:text-base">Where is your event happening?</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 xs:space-y-5 sm:space-y-6 pt-5 xs:pt-6 sm:pt-8 px-3 xs:px-4 sm:px-5 md:px-6 pb-4 xs:pb-5 sm:pb-6">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 sm:gap-5">
                    <Input
                      label="Venue Name"
                      name="venue"
                      value={eventFormData.venue}
                      onChange={handleEventChange}
                      placeholder="Convention Center, Hotel, Stadium..."
                      icon={<MapPin className="w-5 h-5 xs:w-6 xs:h-6" />}
                      className="text-sm xs:text-base sm:text-lg"
                      size="md"
                    />
                    <Input
                      label="City"
                      name="city"
                      value={eventFormData.city}
                      onChange={handleEventChange}
                      placeholder="Addis Ababa, Dire Dawa, Hawassa..."
                      className="text-sm xs:text-base sm:text-lg"
                      size="md"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 border-b-3 border-slate-300 px-3 xs:px-4 sm:px-5 md:px-6 py-4 xs:py-5 sm:py-6">
                  <div className="flex items-center space-x-3 xs:space-x-4">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-slate-700 to-gray-700 text-white flex items-center justify-center font-bold text-lg xs:text-xl sm:text-2xl shadow-lg">
                      3
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Dates & Times</h2>
                      <p className="text-gray-600 mt-1 xs:mt-1.5 text-sm xs:text-base">Schedule your event and ticket sales</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 xs:space-y-6 sm:space-y-8 pt-5 xs:pt-6 sm:pt-8 px-3 xs:px-4 sm:px-5 md:px-6 pb-4 xs:pb-5 sm:pb-6">
                  <div>
                    <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 mb-3 xs:mb-4 sm:mb-5 flex items-center space-x-2">
                      <span className="text-lg xs:text-xl sm:text-2xl">Event Schedule</span>
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 sm:gap-5">
                      <Input
                        label="Event Start"
                        type="datetime-local"
                        name="event_start"
                        value={eventFormData.event_start}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-5 h-5 xs:w-6 xs:h-6" />}
                        className="text-sm xs:text-base"
                        size="md"
                      />
                      <Input
                        label="Event End"
                        type="datetime-local"
                        name="event_end"
                        value={eventFormData.event_end}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-5 h-5 xs:w-6 xs:h-6" />}
                        className="text-sm xs:text-base"
                        size="md"
                      />
                    </div>
                  </div>

                  <div className="border-t-3 border-gray-300 pt-4 xs:pt-5 sm:pt-6">
                    <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 mb-3 xs:mb-4 sm:mb-5 flex items-center space-x-2">
                      <span className="text-lg xs:text-xl sm:text-2xl">Sales Window</span>
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 sm:gap-5">
                      <Input
                        label="Sales Start"
                        type="datetime-local"
                        name="sales_start"
                        value={eventFormData.sales_start}
                        onChange={handleEventChange}
                        required
                        helperText="When do you want to open ticket sales?"
                        className="text-sm xs:text-base"
                        size="md"
                      />
                      <Input
                        label="Sales End"
                        type="datetime-local"
                        name="sales_end"
                        value={eventFormData.sales_end}
                        onChange={handleEventChange}
                        required
                        helperText="When will ticket sales close?"
                        className="text-sm xs:text-base"
                        size="md"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex flex-col xs:flex-row gap-2.5 xs:gap-3 sm:gap-4 pt-5 xs:pt-6 sm:pt-8">
                <Button
                  type="submit"
                  isLoading={updateEventMutation.isPending}
                  size="lg"
                  fullWidth
                  className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[48px] xs:min-h-[52px] sm:min-h-[56px]"
                >
                  <span className="text-base xs:text-lg sm:text-xl">Save Changes</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/events/${id}`)}
                  size="lg"
                  fullWidth
                  className="font-semibold border-2 hover:border-gray-400 transition-all duration-200 active:scale-95 min-h-[48px] xs:min-h-[52px] sm:min-h-[56px]"
                >
                  <span className="text-base xs:text-lg sm:text-xl">Cancel</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar - Image Upload & Quick Actions */}
          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Image Upload Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl sticky top-3 xs:top-4 sm:top-5 lg:top-6 transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50 via-rose-50 to-brand-50 border-b-3 border-orange-300 px-3 xs:px-4 sm:px-5 py-4 xs:py-5">
                <div className="flex items-center space-x-3 xs:space-x-4">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gradient-to-br from-orange-600 to-rose-600 text-white flex items-center justify-center font-bold text-lg xs:text-xl shadow-lg">
                    4
                  </div>
                  <h2 className="text-lg xs:text-xl font-bold text-gray-900">Cover Image</h2>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 xs:space-y-6 pt-6 xs:pt-8 px-3 xs:px-4 sm:px-5 pb-4 xs:pb-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-brand-300 rounded-xl xs:rounded-2xl p-6 xs:p-8 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all duration-200 group active:scale-95"
                >
                  {imagePreview ? (
                    <div className="space-y-4 xs:space-y-5">
                      <img
                        src={imagePreview}
                        alt="Event cover preview"
                        className="w-full h-40 xs:h-48 sm:h-56 object-cover rounded-lg xs:rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-200"
                      />
                      <div className="space-y-2.5 xs:space-y-3">
                        <p className="text-sm xs:text-base font-semibold text-gray-900 truncate">{fileName}</p>
                        <div className="flex gap-2 xs:gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            fullWidth
                            className="font-semibold text-xs xs:text-sm"
                          >
                            Change
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage()
                            }}
                            className="font-semibold text-xs xs:text-sm"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 xs:space-y-5">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 xs:w-20 xs:h-20 bg-brand-100 rounded-full flex items-center justify-center group-hover:bg-brand-200 group-hover:scale-110 transition-all duration-200">
                          <FileImage className="w-8 h-8 xs:w-10 xs:h-10 text-brand-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm xs:text-base font-semibold text-gray-900">
                          📸 Click to upload image
                        </p>
                        <p className="text-xs xs:text-sm text-gray-600 mt-1 xs:mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  aria-label="Upload event cover image"
                />

                {imagePreview && (
                  <Alert
                    type="success"
                    message="Image selected! Click 'Save Changes' to update your event."
                    className="bg-purple-50 border-purple-200 text-xs xs:text-sm"
                  />
                )}
              </CardContent>
            </Card>

            {/* Publish Card - Removed since publish button is now in header */}

            {/* Ticket Stats */}
            {ticketTypes.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-brand-50 to-brand-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                 
                    Ticket Overview
                  </h3>
                  <div className="space-y-3">
                    {ticketTypes.map((ticket: any) => {
                      const remaining = ticket.quantity_total - ticket.quantity_sold
                      const percentage = (ticket.quantity_sold / ticket.quantity_total) * 100
                      return (
                        <div key={ticket.id} className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-gray-900 flex-1">{ticket.name}</span>
                            <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded">
                              {ticket.quantity_sold}/{ticket.quantity_total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            Br {ticket.price_etb} · {remaining} remaining · Max {ticket.max_per_order}/order
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Ticket Types Section */}
        <Card className="mt-6 sm:mt-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-brand-50 to-brand-50 border-b-2 border-brand-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ticket Types</h2>
              </div>
              <Button 
                onClick={() => setShowTicketModal(true)} 
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
              >
                Add Ticket
              </Button>
            </div>
            <p className="text-gray-600 mt-2">Create and manage different ticket tiers for your event</p>
          </CardHeader>

          <CardContent className="pt-8">
            {ticketTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticketTypes.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-brand-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{ticket.name}</h3>
                        <p className="text-2xl font-bold text-brand-600 mt-1">Br {ticket.price_etb}</p>
                      </div>
                      {!ticket.is_active && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 py-4 border-y border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity Sold</span>
                        <span className="font-semibold text-gray-900">
                          {ticket.quantity_sold} / {ticket.quantity_total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-brand-600 h-2 rounded-full"
                          style={{
                            width: `${(ticket.quantity_sold / ticket.quantity_total) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max per Order</span>
                        <span className="font-semibold text-gray-900">{ticket.max_per_order}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        fullWidth
                        onClick={() => handleEditTicket(ticket)}
                        className="font-semibold"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
            
                <p className="text-gray-600 font-bold text-lg">No ticket types yet</p>
                <p className="text-gray-500 text-base mt-2 mb-6">Create your first ticket type to enable ticket sales</p>
                <Button 
                  onClick={() => setShowTicketModal(true)} 
                  size="lg"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold mx-auto"
                >
                  Create First Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-brand-500">
            <div className="flex items-start space-x-3">

              <div>
                <h3 className="font-bold text-gray-900">Update Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Modify event information, dates, and location
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-purple-500">
            <div className="flex items-start space-x-3">
           
              <div>
                <h3 className="font-bold text-gray-900">Manage Image</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a cover image to attract attendees
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-brand-500">
            <div className="flex items-start space-x-3">
         
              <div>
                <h3 className="font-bold text-gray-900">Ticket Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create multiple ticket tiers and monitor sales
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={handleCloseTicketModal}
        title={editingTicket ? 'Edit Ticket Type' : 'Add Ticket Type'}
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Ticket Name"
            name="name"
            value={ticketFormData.name}
            onChange={handleTicketChange}
            required
            placeholder="e.g., VIP Pass, General Admission, Student Ticket"
          />
          <Input
            label="Price (Br)"
            type="number"
            name="price_etb"
            value={ticketFormData.price_etb}
            onChange={handleTicketChange}
            required
            step="0.01"
            min="0"
          />
          <Input
            label="Total Quantity"
            type="number"
            name="quantity_total"
            value={ticketFormData.quantity_total}
            onChange={handleTicketChange}
            required
            min="1"
          />
          <Input
            label="Max per Order"
            type="number"
            name="max_per_order"
            value={ticketFormData.max_per_order}
            onChange={handleTicketChange}
            min="1"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={ticketFormData.is_active}
              onChange={handleTicketChange}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (available for purchase)
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              isLoading={editingTicket ? updateTicketMutation.isPending : createTicketMutation.isPending}
              size="lg"
              fullWidth
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {editingTicket ? 'Update Ticket' : 'Create Ticket'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseTicketModal}
              size="lg"
              fullWidth
              className="font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
