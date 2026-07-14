import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersAPI, eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Input from '../components/Input'
import { CheckCircle, Clock, AlertCircle, Smartphone, Download, Ticket as TicketIcon } from 'lucide-react'
import { format } from 'date-fns'
import { downloadTicketImage } from '../lib/ticketImage'

interface Order {
  order: {
    id: string
    event_id: string
    buyer_name: string
    buyer_email: string
    buyer_phone: string
    total_amount_etb: number
    status: string
    created_at: string
  }
  tickets: Array<{
    id: string
    ticket_code: string | null
    holder_name: string
    status: string
    ticket_type?: string
  }>
  payment?: {
    id: string
    gateway: string
    status: string
    buyer_tx_code?: string
    buyer_reference?: string
  } | null
}

type PayStep = 'choose' | 'instructions' | 'waiting'

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedGateway, setSelectedGateway] = useState('telebirr')
  const [payStep, setPayStep] = useState<PayStep>('choose')
  const [instructions, setInstructions] = useState<{
    title: string
    steps: string[]
    pay_to?: string
    pay_to_name?: string
    amount_etb: string
  } | null>(null)
  const [txCode, setTxCode] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersAPI.getOrder(id!).then((res) => res.data as Order),
    refetchInterval: (query) => {
      const payment = query.state.data?.payment
      const order = query.state.data?.order
      if (order?.status === 'pending' && payment?.status === 'awaiting_approval') {
        return 8000
      }
      return false
    },
  })

  const { data: event } = useQuery({
    queryKey: ['events', data?.order.event_id],
    queryFn: () =>
      data?.order.event_id
        ? eventsAPI.getEvent(data.order.event_id).then((res) => res.data.event)
        : null,
    enabled: !!data?.order.event_id,
  })

  useEffect(() => {
    if (!data?.payment || !id) return
    if (data.payment.status === 'awaiting_approval') {
      setPayStep('waiting')
      return
    }
    if (data.payment.status === 'initiated') {
      setSelectedGateway(data.payment.gateway || 'telebirr')
      setPayStep('instructions')
      if (!instructions) {
        ordersAPI
          .initiatePay(id, data.payment.gateway || 'telebirr')
          .then((res) => setInstructions(res.data.instructions))
          .catch(() => {
            /* keep form usable even if instructions fail */
          })
      }
    }
  }, [data?.payment?.status, data?.payment?.id, data?.payment?.gateway, id])

  const initiatePay = useMutation({
    mutationFn: () => ordersAPI.initiatePay(id!, selectedGateway),
    onSuccess: (response) => {
      setInstructions(response.data.instructions)
      setPayStep('instructions')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to start payment')
    },
  })

  const submitProof = useMutation({
    mutationFn: () =>
      ordersAPI.submitPaymentProof(id!, {
        tx_code: txCode,
        reference_code: referenceCode,
        gateway: selectedGateway,
      }),
    onSuccess: () => {
      setPayStep('waiting')
      setSuccessMsg('Codes submitted. An admin will verify your payment shortly.')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit payment codes')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="error" message="Order not found" />
      </div>
    )
  }

  const order = data.order
  const tickets = data.tickets
  const payment = data.payment
  const isPaid = order.status === 'paid'
  const isFailed = order.status === 'failed' || order.status === 'cancelled'
  const awaiting = payment?.status === 'awaiting_approval'

  const getStatusIcon = (status: string) => {
    if (status === 'paid') return <CheckCircle className="w-6 h-6 text-brand-600" />
    if (awaiting) return <Clock className="w-6 h-6 text-amber-600" />
    if (status === 'pending') return <Clock className="w-6 h-6 text-yellow-600" />
    return <AlertCircle className="w-6 h-6 text-red-600" />
  }

  const statusLabel = (() => {
    if (isPaid) return 'Paid'
    if (awaiting) return 'Awaiting approval'
    if (isFailed) return order.status
    return 'Pending payment'
  })()

  const handleDownloadTicket = async (ticket: any) => {
    if (!ticket.ticket_code) return
    setDownloadingTicketId(ticket.id)
    try {
      await downloadTicketImage({
        eventTitle: event?.title || 'Event Ticket',
        eventStart: event?.event_start,
        venue: event?.venue,
        city: event?.city,
        holderName: ticket.holder_name,
        ticketType: ticket.ticket_type || 'General',
        ticketCode: ticket.ticket_code,
        orderShortId: order.id.slice(0, 8).toUpperCase(),
        status: ticket.status,
      })
    } catch (err) {
      console.error('Error downloading ticket:', err)
      setError('Failed to download ticket image')
    } finally {
      setDownloadingTicketId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/browse')} className="mb-6">
          ← Back
        </Button>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}
        {successMsg && (
          <Alert
            type="success"
            message={successMsg}
            onClose={() => setSuccessMsg('')}
            className="mb-6"
          />
        )}

        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600">Order ID</p>
                <p className="text-2xl font-bold text-slate-900">
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-xl font-bold text-slate-900">{statusLabel}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Buyer Information</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="text-slate-900 font-medium">{order.buyer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="text-slate-900 font-medium">{order.buyer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="text-slate-900 font-medium">{order.buyer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Order Date</p>
                  <p className="text-slate-900 font-medium">
                    {format(new Date(order.created_at), 'PPpp')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">
                  Tickets ({tickets.length})
                </h2>
              </CardHeader>
              <CardContent>
                {!isPaid && (
                  <p className="text-sm text-slate-600 mb-4">
                    Ticket numbers and QR slips unlock after an admin approves your payment.
                  </p>
                )}
                {isPaid && (
                  <p className="text-sm text-slate-600 mb-4">
                    Save your PNG now. If you lose it, recover anytime at{' '}
                    <button
                      type="button"
                      className="text-brand-700 font-medium underline"
                      onClick={() => navigate('/tickets')}
                    >
                      My tickets
                    </button>
                    .
                  </p>
                )}
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={
                        isPaid && ticket.ticket_code
                          ? 'relative overflow-hidden rounded-2xl border border-brand-700/30 bg-gradient-to-br from-brand-900 via-brand-800 to-teal-700 text-white shadow-lift'
                          : 'p-4 border border-slate-200 rounded-lg bg-white'
                      }
                    >
                      {isPaid && ticket.ticket_code ? (
                        <>
                          <div
                            className="pointer-events-none absolute inset-0 opacity-20"
                            style={{
                              backgroundImage:
                                'radial-gradient(circle at 80% 20%, rgba(74,222,128,0.5), transparent 40%), radial-gradient(circle at 20% 80%, rgba(45,212,191,0.35), transparent 35%)',
                            }}
                          />
                          <div className="relative p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                              <div>
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-200/90 uppercase">
                                  EventFlow · Admit one
                                </p>
                                <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
                                  {event?.title || 'Your ticket'}
                                </h3>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-brand-100 backdrop-blur">
                                {(ticket.ticket_type || 'General').toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-brand-200/80 text-xs uppercase tracking-wide">Holder</p>
                                <p className="font-semibold mt-0.5">{ticket.holder_name}</p>
                              </div>
                              <div>
                                <p className="text-brand-200/80 text-xs uppercase tracking-wide">Code</p>
                                <p className="font-mono font-semibold mt-0.5 tracking-wider">
                                  {ticket.ticket_code}
                                </p>
                              </div>
                              <div>
                                <p className="text-brand-200/80 text-xs uppercase tracking-wide">Status</p>
                                <p className="font-semibold mt-0.5 capitalize">{ticket.status}</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleDownloadTicket(ticket)}
                              isLoading={downloadingTicketId === ticket.id}
                              size="sm"
                              className="mt-5 w-full sm:w-auto bg-white text-brand-900 hover:bg-brand-50 font-semibold shadow-md"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PNG ticket
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 flex items-center gap-2">
                                <TicketIcon className="w-4 h-4 text-slate-400" />
                                {ticket.holder_name}
                              </p>
                              <p className="text-sm text-slate-600 mt-0.5">
                                <span className="font-medium text-slate-800">
                                  {ticket.ticket_type || 'General'}
                                </span>
                                {ticket.ticket_code
                                  ? ` · Code: ${ticket.ticket_code}`
                                  : ' · Code locked until payment approved'}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ticket.status === 'valid'
                                  ? 'bg-brand-100 text-brand-800'
                                  : ticket.status === 'used'
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    Br {parseFloat(String(order.total_amount_etb)).toFixed(2)}
                  </span>
                </div>

                {order.status === 'pending' && !awaiting && payStep === 'choose' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-900">
                        Payment Gateway
                      </label>
                      <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="telebirr">Telebirr</option>
                        <option value="cbe_birr">CBE Birr</option>
                        <option value="chapa">Chapa</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => initiatePay.mutate()}
                      isLoading={initiatePay.isPending}
                      fullWidth
                      className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                    >
                      Pay Now
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      Pay on your phone, then send us the transaction codes.
                    </p>
                  </>
                )}

                {order.status === 'pending' && !awaiting && payStep === 'instructions' && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-4 h-4 text-brand-700" />
                        <h3 className="font-semibold text-brand-900">
                          {instructions?.title || 'Pay on your phone'}
                        </h3>
                      </div>
                      {instructions?.pay_to && (
                        <p className="text-sm text-brand-900 mb-2">
                          Send <strong>Br {instructions.amount_etb}</strong> to{' '}
                          <strong>{instructions.pay_to}</strong>
                          {instructions.pay_to_name ? ` (${instructions.pay_to_name})` : ''}
                        </p>
                      )}
                      <ol className="list-decimal list-inside text-sm text-brand-900 space-y-1">
                        {(instructions?.steps || []).map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <Input
                      label="Transaction / confirmation code"
                      value={txCode}
                      onChange={(e) => setTxCode(e.target.value)}
                      placeholder="Code from your phone"
                      required
                    />
                    <Input
                      label="Reference code"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Payment reference"
                      required
                    />
                    <Button
                      onClick={() => {
                        if (!txCode.trim() || !referenceCode.trim()) {
                          setError('Enter both the transaction code and reference code')
                          return
                        }
                        submitProof.mutate()
                      }}
                      isLoading={submitProof.isPending}
                      fullWidth
                      className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                    >
                      Submit payment codes
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPayStep('choose')}
                      className="w-full text-sm text-slate-600 hover:text-slate-900"
                    >
                      Change gateway
                    </button>
                  </div>
                )}

                {awaiting && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-amber-900 font-medium">Waiting for admin approval</p>
                    <p className="text-xs text-amber-800 mt-1">
                      We received your codes
                      {payment?.buyer_reference ? ` (${payment.buyer_reference})` : ''}. Keep this
                      page open — tickets appear here once approved.
                    </p>
                  </div>
                )}

                {isPaid && (
                  <div className="bg-brand-50 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                    <p className="text-brand-800 font-medium">Payment approved</p>
                    <p className="text-xs text-brand-700 mt-1">
                      Download your ticket slip with QR below
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/tickets')}
                      className="mt-3 text-xs font-semibold text-brand-800 underline"
                    >
                      Lost it later? Find tickets again
                    </button>
                  </div>
                )}

                {isFailed && (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Payment not approved</p>
                    <p className="text-xs text-red-700 mt-1">
                      Contact the organizer if you believe this is a mistake.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
