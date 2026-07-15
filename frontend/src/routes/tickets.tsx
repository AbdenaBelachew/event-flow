import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import {
  Download,
  Search,
  Ticket as TicketIcon,
  MapPin,
  Calendar,
  ExternalLink,
  Inbox,
} from 'lucide-react'
import { format } from 'date-fns'
import { downloadTicketImage } from '../lib/ticketImage'
import { cn } from '../lib/cn'

type LookupMode = 'code' | 'contact'

function statusBadge(status: string) {
  if (status === 'paid') return 'success' as const
  if (status === 'pending') return 'warning' as const
  return 'neutral' as const
}

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
  const [hasSearched, setHasSearched] = useState(false)

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
      setHasSearched(true)
      setResults(orders)
      setError('')
    },
    onError: (err: any) => {
      setHasSearched(true)
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

  const ticketCount =
    results?.reduce((n, b) => n + (b.tickets?.length || 0), 0) ?? 0

  return (
    <div className="relative min-h-screen flex-1 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-bg-soft" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" aria-hidden />

      <div className="relative section pt-6 sm:pt-10 pb-16 sm:pb-20">
        {/* Header */}
        <header className="mb-8 lg:mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
            Guest lookup
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            Find my tickets
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl">
            Lost your PNG or closed the page? Look up your order with a code or
            the email and phone you used at checkout.
          </p>
        </header>

        <div className="grid lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start lg:h-[calc(100vh-14rem)] lg:min-h-[480px]">
          {/* Lookup panel — sticky on desktop */}
          <aside className="lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm overflow-hidden lg:sticky lg:top-0">
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <TicketIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Lookup</p>
                    <p className="text-xs text-slate-500">Choose how to search</p>
                  </div>
                </div>

                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mt-4">
                  <button
                    type="button"
                    onClick={() => setMode('code')}
                    className={cn(
                      'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                      mode === 'code'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Order / code
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('contact')}
                    className={cn(
                      'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                      mode === 'contact'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Email + phone
                  </button>
                </div>
              </div>

              <div className="p-5">
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
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    Find tickets
                  </Button>
                </form>

                <ul className="mt-5 space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <li>Order ID is the first 8 characters from your confirmation.</li>
                  <li>Email and phone must match checkout exactly.</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Results panel — independent Y scroll on desktop */}
          <section className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 lg:overscroll-contain">
            {!hasSearched && !lookup.isPending && (
              <div className="hidden lg:flex min-h-full rounded-2xl border border-dashed border-slate-300/80 bg-white/50 items-center justify-center px-8">
                <div className="text-center max-w-sm">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <p className="font-display text-lg font-semibold text-slate-900">
                    Your tickets will appear here
                  </p>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Search with an order ID, ticket code, or the email and phone
                    from checkout. You can download PNG tickets once payment is
                    approved.
                  </p>
                </div>
              </div>
            )}

            {lookup.isPending && (
              <div className="flex min-h-[240px] lg:min-h-full items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
              </div>
            )}

            {hasSearched && !lookup.isPending && results && results.length === 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-14 text-center">
                <p className="font-medium text-slate-900">No tickets found</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Double-check the code or contact details. They must match what
                  you entered at checkout.
                </p>
              </div>
            )}

            {hasSearched && !lookup.isPending && results && results.length > 0 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-900">
                      Results
                    </h2>
                    <p className="text-sm text-slate-500">
                      {results.length} order{results.length === 1 ? '' : 's'} ·{' '}
                      {ticketCount} ticket{ticketCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {results.map((bundle) => {
                  const order = bundle.order
                  const tickets = bundle.tickets || []
                  const event = bundle.event
                  const isPaid = order.status === 'paid'

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-slate-200/80 bg-white/90 overflow-hidden"
                    >
                      <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                              {event?.title || 'Event'}
                            </h3>
                            <Badge variant={statusBadge(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            Order{' '}
                            <span className="font-mono font-medium text-slate-700">
                              {String(order.id).slice(0, 8).toUpperCase()}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            {event?.event_start && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(
                                  new Date(event.event_start),
                                  'MMM d, yyyy · h:mm a'
                                )}
                              </span>
                            )}
                            {(event?.venue || event?.city) && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {[event.venue, event.city].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                          className="shrink-0 self-start"
                        >
                          Open order
                        </Button>
                      </div>

                      <div className="p-4 sm:p-5">
                        {!isPaid && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-3 text-sm text-amber-900 mb-4">
                            Payment is not approved yet — ticket codes stay locked
                            until the organizer confirms payment.
                          </div>
                        )}

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/90 border-b border-slate-100">
                                <th className="px-4 py-2.5 font-semibold">Holder</th>
                                <th className="px-4 py-2.5 font-semibold">Type</th>
                                <th className="px-4 py-2.5 font-semibold">Code</th>
                                <th className="px-4 py-2.5 font-semibold text-right">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tickets.map((ticket: any) => (
                                <tr
                                  key={ticket.id}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    {ticket.holder_name || '—'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {ticket.ticket_type || 'General'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {ticket.ticket_code ? (
                                      <span className="font-mono text-xs text-slate-800">
                                        {ticket.ticket_code}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        Locked
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {isPaid && ticket.ticket_code ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handleDownload(bundle, ticket)}
                                        isLoading={downloadingId === ticket.id}
                                        leftIcon={<Download className="w-3.5 h-3.5" />}
                                      >
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
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile tickets */}
                        <div className="md:hidden space-y-3">
                          {tickets.map((ticket: any) => (
                            <div
                              key={ticket.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                            >
                              <p className="font-medium text-slate-900">
                                {ticket.holder_name || 'Guest'}
                              </p>
                              <p className="text-sm text-slate-600 mt-0.5">
                                {ticket.ticket_type || 'General'}
                                {ticket.ticket_code
                                  ? ` · ${ticket.ticket_code}`
                                  : ' · Locked'}
                              </p>
                              <div className="mt-3">
                                {isPaid && ticket.ticket_code ? (
                                  <Button
                                    size="sm"
                                    fullWidth
                                    onClick={() => handleDownload(bundle, ticket)}
                                    isLoading={downloadingId === ticket.id}
                                    leftIcon={<Download className="w-3.5 h-3.5" />}
                                  >
                                    Download PNG
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    fullWidth
                                    variant="secondary"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    View order
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
