import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsAPI, eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useRequireEventOwner } from '../lib/event-access'

export default function EventPaymentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
  })

  const isOwner = useRequireEventOwner(event, eventLoading)
  if (event && !isOwner) return null

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', 'pending', id],
    queryFn: () => paymentsAPI.listPending(id!).then((res) => res.data.payments),
    refetchInterval: 10000,
  })

  const approve = useMutation({
    mutationFn: (paymentId: string) => paymentsAPI.approve(paymentId),
    onSuccess: () => {
      setSuccess('Payment approved. Buyer can now download tickets.')
      setError('')
      setActingId(null)
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending', id] })
      refetch()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to approve')
      setActingId(null)
    },
  })

  const reject = useMutation({
    mutationFn: (paymentId: string) =>
      paymentsAPI.reject(paymentId, 'Codes could not be verified'),
    onSuccess: () => {
      setSuccess('Payment rejected.')
      setError('')
      setActingId(null)
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending', id] })
      refetch()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to reject')
      setActingId(null)
    },
  })

  const payments = data || []

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-6">
          ← Back to event
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Approve payments
          </h1>
          <p className="text-slate-600 mt-1">
            {event?.title
              ? `Review phone payment codes for ${event.title}`
              : 'Review phone payment codes from buyers'}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            className="mb-6"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-900">No payments waiting</p>
              <p className="text-sm text-slate-600 mt-1">
                When a buyer pays and submits codes, they show up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((p: any) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{p.buyer_name}</h2>
                      <p className="text-sm text-slate-600">
                        {p.buyer_email} · {p.buyer_phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">
                        Br {Number(p.amount_etb).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        {p.gateway.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Transaction code
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900 mt-1 break-all">
                        {p.buyer_tx_code || '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Reference code
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900 mt-1 break-all">
                        {p.buyer_reference || p.gateway_ref || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>
                      Submitted{' '}
                      {format(new Date(p.updated_at || p.created_at), 'MMM d, yyyy · h:mm a')}
                    </span>
                    <button
                      type="button"
                      className="text-brand-700 hover:underline"
                      onClick={() => navigate(`/orders/${p.order_id}`)}
                    >
                      View order
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      fullWidth
                      className="bg-brand-600 hover:bg-brand-700 text-white"
                      isLoading={actingId === p.id && approve.isPending}
                      onClick={() => {
                        setActingId(p.id)
                        approve.mutate(p.id)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & issue tickets
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      isLoading={actingId === p.id && reject.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            'Reject this payment? The order will be cancelled and seats released.'
                          )
                        ) {
                          return
                        }
                        setActingId(p.id)
                        reject.mutate(p.id)
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
