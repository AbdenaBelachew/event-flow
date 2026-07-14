import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import { Download, Search, Ticket as TicketIcon } from 'lucide-react'
import { format } from 'date-fns'
import { downloadTicketImage } from '../lib/ticketImage'

type LookupMode = 'code' | 'contact'

export default function FindTicketsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<LookupMode>(
    searchParams.get('email') ? 'contact' : 'code'
  )
  const [orderOrCode, setOrderOrCode] = useState(
    searchParams.get('id') || searchParams.get('code') || ''
  )
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const lookup = useMutation({
    mutationFn: async () => {
      setError('')
      if (mode === 'code') {
        const raw = orderOrCode.trim()
        if (!raw) throw new Error('Enter your order ID or ticket code')

        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            raw
          )
        const isShort = /^[0-9a-f]{8}$/i.test(raw)
        if (isUuid || isShort) {
          return ordersAPI.lookup({ order_id: raw }).then((r) => r.data.orders)
        }
        return ordersAPI.lookup({ ticket_code: raw }).then((r) => r.data.orders)
      }

      if (!email.trim() || !phone.trim()) {
        throw new Error('Enter both email and phone')
      }
      return ordersAPI
        .lookup({ email: email.trim(), phone: phone.trim() })
        .then((r) => r.data.orders)
    },
    onSuccess: (orders) => {
      setResults(orders)
      setError('')
    },
    onError: (err: any) => {
      setResults(null)
      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Could not find your tickets'
      )
    },
  })

  const handleDownload = async (orderBundle: any, ticket: any) => {
    if (!ticket.ticket_code) return
    setDownloadingId(ticket.id)
    try {
      await downloadTicketImage({
        eventTitle: orderBundle.event?.title || 'Event Ticket',
        eventStart: orderBundle.event?.event_start,
        venue: orderBundle.event?.venue,
        city: orderBundle.event?.city,
        holderName: ticket.holder_name,
        ticketType: ticket.ticket_type || 'General',
        ticketCode: ticket.ticket_code,
        orderShortId: String(orderBundle.order.id).slice(0, 8).toUpperCase(),
        status: ticket.status,
      })
    } catch {
      setError('Failed to download ticket image')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-bold text-black tracking-tight">
            Find my tickets
          </h1>
          <p className="text-slate-600 mt-2 max-w-md mx-auto">
            Lost your PNG or closed the page? Look up your order and download
            your tickets again.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('code')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === 'code'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Order / ticket code
              </button>
              <button
                type="button"
                onClick={() => setMode('contact')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === 'contact'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Email + phone
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
                className="mb-4"
              />
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                lookup.mutate()
              }}
              className="space-y-4"
            >
              {mode === 'code' ? (
                <Input
                  label="Order ID or ticket code"
                  value={orderOrCode}
                  onChange={(e) => setOrderOrCode(e.target.value)}
                  placeholder="e.g. 19B870B0 or EF-XXXX"
                  required
                />
              ) : (
                <>
                  <Input
                    label="Email used at checkout"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                  <Input
                    label="Phone used at checkout"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251..."
                    required
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                isLoading={lookup.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
              >
                <Search className="w-4 h-4 mr-2" />
                Find tickets
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && results.length === 0 && (
          <Alert type="error" message="No tickets found" />
        )}

        {results && results.length > 0 && (
          <div className="space-y-5">
            {results.map((bundle) => {
              const order = bundle.order
              const tickets = bundle.tickets || []
              const event = bundle.event
              const isPaid = order.status === 'paid'

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {event?.title || 'Event'}
                        </h2>
                        <p className="text-sm text-slate-600 mt-0.5">
                          Order {String(order.id).slice(0, 8).toUpperCase()}
                          {event?.event_start
                            ? ` · ${format(new Date(event.event_start), 'MMM d, yyyy · h:mm a')}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          isPaid
                            ? 'bg-brand-100 text-brand-800'
                            : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!isPaid && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                        Payment is not approved yet — ticket codes stay locked.
                        <button
                          type="button"
                          className="ml-1 font-semibold underline"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          Open order
                        </button>
                      </div>
                    )}

                    {tickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/80"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {ticket.holder_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {ticket.ticket_type || 'General'}
                            {ticket.ticket_code
                              ? ` · ${ticket.ticket_code}`
                              : ' · Locked'}
                          </p>
                        </div>
                        {isPaid && ticket.ticket_code ? (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(bundle, ticket)}
                            isLoading={downloadingId === ticket.id}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PNG
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            View order
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
