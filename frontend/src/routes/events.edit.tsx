import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { eventsAPI, ticketTypesAPI } from '../lib/api'
import Input, { TextArea } from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import Modal from '../components/Modal'
import { Plus, Calendar, MapPin, FileImage, Trash2, ChevronRight, Edit2 } from 'lucide-react'



export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTicketModal, setShowTicketModal] = useState(false)
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
    createTicketMutation.mutate(ticketFormData as any)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" message="Event not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/events/${id}`)}
              className="flex items-center space-x-2 hover:opacity-80 transition"
            >
              <span>← Back to Event</span>
            </button>
            {event.status === 'published' && (
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold border border-white/30">
                ✓ Published
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{event.title}</h1>
          <p className="text-blue-100 text-lg">Update your event details and manage tickets</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpdateEvent} className="space-y-8">
              {/* Basic Information Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Update your event information</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <Input
                    label="Event Title"
                    name="title"
                    value={eventFormData.title}
                    onChange={handleEventChange}
                    required
                    placeholder="e.g., Tech Summit 2026, Music Festival..."
                    className="text-lg"
                  />
                  <TextArea
                    label="Description"
                    name="description"
                    value={eventFormData.description}
                    onChange={handleEventChange}
                    placeholder="Tell attendees what your event is about"
                    rows={5}
                    helperText="Be creative and descriptive"
                  />
                </CardContent>
              </Card>

              {/* Location Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Location</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Where is your event?</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Venue Name"
                      name="venue"
                      value={eventFormData.venue}
                      onChange={handleEventChange}
                      placeholder="Convention Center, Hotel, Stadium..."
                      icon={<MapPin className="w-5 h-5" />}
                    />
                    <Input
                      label="City"
                      name="city"
                      value={eventFormData.city}
                      onChange={handleEventChange}
                      placeholder="Addis Ababa, Dire Dawa..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dates & Times</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Manage your event schedule</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span className="text-purple-600">📅</span>
                      <span>Event Schedule</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Event Start"
                        type="datetime-local"
                        name="event_start"
                        value={eventFormData.event_start}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-5 h-5" />}
                      />
                      <Input
                        label="Event End"
                        type="datetime-local"
                        name="event_end"
                        value={eventFormData.event_end}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-5 h-5" />}
                      />
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span className="text-green-600">🎫</span>
                      <span>Sales Window</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Sales Start"
                        type="datetime-local"
                        name="sales_start"
                        value={eventFormData.sales_start}
                        onChange={handleEventChange}
                        required
                        helperText="When do you want to open ticket sales?"
                      />
                      <Input
                        label="Sales End"
                        type="datetime-local"
                        name="sales_end"
                        value={eventFormData.sales_end}
                        onChange={handleEventChange}
                        required
                        helperText="When will ticket sales close?"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  isLoading={updateEventMutation.isPending}
                  fullWidth
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Save Changes</span>
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/events/${id}`)}
                  fullWidth
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar - Image Upload & Quick Actions */}
          <div className="space-y-6">
            {/* Image Upload Card */}
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-rose-50 border-b-2 border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Cover Image</h2>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-8">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            fullWidth
                          >
                            Change Image
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage()
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                          <FileImage className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
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
                />

                {imagePreview && (
                  <Alert
                    type="success"
                    message="✨ Image selected! Update your event to save changes."
                    className="bg-green-50 border-green-200"
                  />
                )}
              </CardContent>
            </Card>

            {/* Publish Card */}
            {event.status === 'draft' && (
              <Card className="border-0 shadow-lg border-l-4 border-yellow-500 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">🚀</span>
                        Ready to Launch?
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        This event is still in draft. Publish it to make tickets available to buyers.
                      </p>
                    </div>
                    {ticketTypes.length > 0 ? (
                      <Button
                        onClick={handlePublish}
                        isLoading={publishMutation.isPending}
                        fullWidth
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Publish Event
                      </Button>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700">
                          ⚠️ Add at least one ticket type before publishing
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Stats */}
            {ticketTypes.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
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
                            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ticket.quantity_sold}/{ticket.quantity_total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
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
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ticket Types</h2>
              </div>
              <Button onClick={() => setShowTicketModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket Type
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
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{ticket.name}</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-1">Br {ticket.price_etb}</p>
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
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
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
                        size="sm"
                        fullWidth
                        className="text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎫</div>
                <p className="text-gray-600 font-semibold">No ticket types yet</p>
                <p className="text-gray-500 text-sm mt-1">Create one to enable ticket sales</p>
                <Button onClick={() => setShowTicketModal(true)} size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Ticket Type
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-blue-500">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">✏️</div>
              <div>
                <h3 className="font-bold text-gray-900">Update Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Modify event information, dates, and location
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-green-500">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="font-bold text-gray-900">Manage Image</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a cover image to attract attendees
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-purple-500">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">🎫</div>
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

      {/* Add Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Add Ticket Type"
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
          <div className="flex gap-4">
            <Button
              type="submit"
              isLoading={createTicketMutation.isPending}
              fullWidth
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Create Ticket Type
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTicketModal(false)}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
