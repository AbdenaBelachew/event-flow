import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI, ticketTypesAPI } from '../lib/api'
import Input, { TextArea } from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  Eye,
  Plus,
  Pencil,
  Rocket,
  Ticket,
  AlertCircle,
  Check,
  ExternalLink,
} from 'lucide-react'
import { useRequireEventEditor } from '../lib/event-access'
import { cn } from '../lib/cn'

function statusBadge(status: string) {
  switch (status) {
    case 'published':
      return { variant: 'success' as const, label: 'Published' }
    case 'draft':
      return { variant: 'neutral' as const, label: 'Draft' }
    case 'sold_out':
      return { variant: 'danger' as const, label: 'Sold out' }
    case 'closed':
      return { variant: 'warning' as const, label: 'Closed' }
    default:
      return { variant: 'neutral' as const, label: status }
  }
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [dirty, setDirty] = useState(false)

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

  const isOwner = useRequireEventEditor(event, eventLoading)

  const { data: ticketTypes = [], refetch: refetchTickets } = useQuery({
    queryKey: ['events', id, 'ticket-types'],
    queryFn: () => ticketTypesAPI.listByEvent(id!).then((res) => res.data.ticket_types),
    enabled: !!id && !!event && isOwner,
  })

  const updateEventMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.updateEvent(id!, data),
    onSuccess: (res) => {
      setSuccess('Changes saved')
      setError('')
      setDirty(false)
      queryClient.setQueryData(['events', id], res.data.event)
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update event')
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => eventsAPI.publishEvent(id!),
    onSuccess: (res) => {
      setSuccess('Event is now live!')
      setError('')
      queryClient.setQueryData(['events', id], res.data.event)
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to publish event')
    },
  })

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ticketTypesAPI.create(id!, data),
    onSuccess: () => {
      setSuccess('Ticket type created')
      setError('')
      handleCloseTicketModal()
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
      setSuccess('Ticket type updated')
      setError('')
      handleCloseTicketModal()
      refetchTickets()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update ticket type')
    },
  })

  useEffect(() => {
    if (!event) return
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
    setImagePreview(event.cover_image_url || '')
    setDirty(false)
  }, [event])

  const patchEvent = (patch: Partial<typeof eventFormData>) => {
    setEventFormData((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSuccess('')
  }

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    patchEvent({ [e.target.name]: e.target.value } as any)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      patchEvent({ cover_image_url: result })
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    patchEvent({ cover_image_url: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value =
      e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.type === 'number'
          ? parseFloat(e.target.value)
          : e.target.value
    setTicketFormData((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleUpdateEvent = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    setSuccess('')

    if (!eventFormData.title.trim()) {
      setError('Event title is required')
      return
    }
    if (!eventFormData.event_start || !eventFormData.event_end) {
      setError('Event start and end are required')
      return
    }
    if (new Date(eventFormData.event_start) >= new Date(eventFormData.event_end)) {
      setError('Event start must be before event end')
      return
    }
    if (eventFormData.sales_start && eventFormData.sales_end) {
      if (new Date(eventFormData.sales_start) >= new Date(eventFormData.sales_end)) {
        setError('Sales start must be before sales end')
        return
      }
      if (new Date(eventFormData.sales_end) > new Date(eventFormData.event_end)) {
        setError('Sales end must be on or before event end')
        return
      }
    }

    updateEventMutation.mutate(eventFormData as any)
  }

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!ticketFormData.name.trim() || ticketFormData.price_etb < 0) {
      setError('Please fill in ticket name and a valid price')
      return
    }
    if (ticketFormData.quantity_total < 1) {
      setError('Quantity must be at least 1')
      return
    }

    if (editingTicket) {
      updateTicketMutation.mutate({ ticketId: editingTicket.id, data: ticketFormData })
    } else {
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
    setError('')
    const activeTickets = ticketTypes.filter((t: any) => t.is_active)
    if (activeTickets.length === 0) {
      setError('Add at least one active ticket type before publishing')
      return
    }
    if (dirty) {
      setError('Save your changes before publishing')
      return
    }
    publishMutation.mutate()
  }

  const openTicketModal = () => {
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
    setShowTicketModal(true)
  }

  if (event && !isOwner) return null

  if (eventLoading) {
    return (
      <div className="min-h-screen gradient-bg-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading editor…</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen gradient-bg-soft flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Event not found</h2>
          <p className="text-sm text-slate-500 mb-6">
            This event doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button onClick={() => navigate('/dashboard')} fullWidth>
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const badge = statusBadge(event.status)
  const activeTicketCount = ticketTypes.filter((t: any) => t.is_active).length
  const canPublish = event.status === 'draft'

  return (
    <div className="min-h-screen gradient-bg-soft pb-28 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-1 p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={badge.variant} dot>
                  {badge.label}
                </Badge>
                {dirty && (
                  <span className="text-xs font-medium text-amber-600">Unsaved changes</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 truncate">
                {eventFormData.title || 'Untitled event'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Edit details, cover, and ticket types
              </p>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate(`/events/${id}`)}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Preview
            </Button>
            {canPublish && (
              <Button
                type="button"
                variant="success"
                size="md"
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                disabled={dirty || updateEventMutation.isPending}
               
              >
                Publish
              </Button>
            )}
            <Button
              type="button"
              size="md"
              onClick={() => handleUpdateEvent()}
              isLoading={updateEventMutation.isPending}
              disabled={!dirty}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-5">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-5">
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          </div>
        )}

        <form onSubmit={handleUpdateEvent}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
            {/* Left: cover + quick links */}
            <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Cover image</h2>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative w-full aspect-[16/10] rounded-xl overflow-hidden border-2 border-dashed transition text-left',
                      imagePreview
                        ? 'border-brand-300'
                        : 'border-slate-200 hover:border-brand-400 bg-slate-50'
                    )}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/35 transition flex items-center justify-center opacity-0 hover:opacity-100">
                          <span className="text-white text-sm font-medium">Change image</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-2">
                          <ImageIcon className="w-6 h-6 text-brand-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Upload cover</p>
                        <p className="text-xs text-slate-500 mt-0.5">PNG or JPG · max 5MB</p>
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Quick links
                </p>
                <Link
                  to={`/events/${id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  Public event page
                </Link>
                <Link
                  to={`/events/${id}/scanner`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Ticket className="w-4 h-4 text-slate-400" />
                  Door scanner
                </Link>
                <Link
                  to={`/events/${id}/payments`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Eye className="w-4 h-4 text-slate-400" />
                  Payments
                </Link>
              </section>

              {ticketTypes.length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Ticket overview
                  </p>
                  <div className="space-y-3">
                    {ticketTypes.map((ticket: any) => {
                      const sold = ticket.quantity_sold || 0
                      const total = ticket.quantity_total || 1
                      const pct = Math.min((sold / total) * 100, 100)
                      return (
                        <div key={ticket.id}>
                          <div className="flex justify-between gap-2 text-sm mb-1">
                            <span className="font-medium text-slate-800 truncate">{ticket.name}</span>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {sold}/{total}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </aside>

            {/* Right: form fields */}
            <div className="lg:col-span-8 space-y-5">
              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Event details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Title and description guests will see</p>
                </div>
                <div className="p-5 space-y-4">
                  <Input
                    label="Event title"
                    name="title"
                    value={eventFormData.title}
                    onChange={handleEventChange}
                    required
                    placeholder="e.g. Addis Jazz Night 2026"
                  />
                  <TextArea
                    label="Description"
                    name="description"
                    value={eventFormData.description}
                    onChange={handleEventChange}
                    placeholder="What is this event about?"
                    rows={4}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Location</h2>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Venue"
                    name="venue"
                    value={eventFormData.venue}
                    onChange={handleEventChange}
                    placeholder="Hyatt Regency…"
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <Input
                    label="City"
                    name="city"
                    value={eventFormData.city}
                    onChange={handleEventChange}
                    placeholder="Addis Ababa"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Dates & sales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-3">Event schedule</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Starts"
                        type="datetime-local"
                        name="event_start"
                        value={eventFormData.event_start}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-4 h-4" />}
                      />
                      <Input
                        label="Ends"
                        type="datetime-local"
                        name="event_end"
                        value={eventFormData.event_end}
                        onChange={handleEventChange}
                        required
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-3">Ticket sales window</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Sales start"
                        type="datetime-local"
                        name="sales_start"
                        value={eventFormData.sales_start}
                        onChange={handleEventChange}
                      />
                      <Input
                        label="Sales end"
                        type="datetime-local"
                        name="sales_end"
                        value={eventFormData.sales_end}
                        onChange={handleEventChange}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Tickets */}
              <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Ticket types</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeTicketCount} active · {ticketTypes.length} total
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openTicketModal}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add ticket
                  </Button>
                </div>

                <div className="p-5">
                  {ticketTypes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ticketTypes.map((ticket: any) => {
                        const sold = ticket.quantity_sold || 0
                        const total = ticket.quantity_total || 1
                        const pct = Math.min((sold / total) * 100, 100)
                        return (
                          <div
                            key={ticket.id}
                            className="rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/30 transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {ticket.name}
                                </h3>
                                <p className="text-lg font-bold text-brand-700 mt-0.5">
                                  Br {Number(ticket.price_etb).toLocaleString()}
                                </p>
                              </div>
                              {!ticket.is_active && (
                                <Badge variant="warning">Inactive</Badge>
                              )}
                            </div>
                            <div className="space-y-1.5 py-3 border-y border-slate-100 text-sm">
                              <div className="flex justify-between text-slate-600">
                                <span>Sold</span>
                                <span className="font-medium text-slate-900">
                                  {sold} / {total}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-brand-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Max / order</span>
                                <span className="font-medium text-slate-900">
                                  {ticket.max_per_order}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              fullWidth
                              className="mt-3"
                              onClick={() => handleEditTicket(ticket)}
                              leftIcon={<Pencil className="w-3.5 h-3.5" />}
                            >
                              Edit
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                        <Ticket className="w-6 h-6 text-brand-600" />
                      </div>
                      <p className="font-semibold text-slate-800">No ticket types yet</p>
                      <p className="text-sm text-slate-500 mt-1 mb-4">
                        Add at least one active ticket before you can publish.
                      </p>
                      <Button type="button" onClick={openTicketModal} leftIcon={<Plus className="w-4 h-4" />}>
                        Create first ticket
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {/* Desktop bottom save (also covered by sticky header) */}
              <div className="hidden lg:flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/events/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateEventMutation.isPending}
                  disabled={!dirty}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile sticky action bar */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/events/${id}`)}
          >
            Preview
          </Button>
          {canPublish ? (
            <Button
              type="button"
              variant="success"
              className="flex-1"
              onClick={handlePublish}
              isLoading={publishMutation.isPending}
              disabled={dirty || updateEventMutation.isPending}
            >
              Publish
            </Button>
          ) : null}
          <Button
            type="button"
            className="flex-1"
            onClick={() => handleUpdateEvent()}
            isLoading={updateEventMutation.isPending}
            disabled={!dirty}
          >
            Save
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showTicketModal}
        onClose={handleCloseTicketModal}
        title={editingTicket ? 'Edit ticket type' : 'Add ticket type'}
        description="Set price, quantity, and purchase limits."
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Ticket name"
            name="name"
            value={ticketFormData.name}
            onChange={handleTicketChange}
            required
            placeholder="e.g. VIP, General Admission"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
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
              label="Total quantity"
              type="number"
              name="quantity_total"
              value={ticketFormData.quantity_total}
              onChange={handleTicketChange}
              required
              min="1"
            />
          </div>
          <Input
            label="Max per order"
            type="number"
            name="max_per_order"
            value={ticketFormData.max_per_order}
            onChange={handleTicketChange}
            min="1"
          />
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="is_active"
              checked={ticketFormData.is_active}
              onChange={handleTicketChange}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Active (available for purchase)
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseTicketModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={
                editingTicket
                  ? updateTicketMutation.isPending
                  : createTicketMutation.isPending
              }
            >
              {editingTicket ? 'Update ticket' : 'Create ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
