import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsAPI, eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Alert from '../components/Alert'
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { useRequireEventEditor } from '../lib/event-access'
import { cn } from '../lib/cn'

const PAGE_SIZE = 20

type Payment = {
  id: string
  order_id: string
  gateway: string
  gateway_ref?: string
  amount_etb: number | string
  buyer_tx_code?: string
  buyer_reference?: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  created_at: string
  updated_at?: string
}

function gatewayLabel(gateway: string) {
  return gateway.replace(/_/g, ' ')
}

function formatEtb(amount: number | string) {
  return `Br ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null

  return (
    <button
      type="button"
      title="Copy"
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {
          /* ignore */
        }
      }}
      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CodeBlock({ label, value }: { label: string; value?: string }) {
  const v = value || '—'
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {value ? <CopyButton value={value} /> : null}
      </div>
      <p className="font-mono text-sm font-semibold text-slate-900 break-all leading-snug">{v}</p>
    </div>
  )
}

export default function EventPaymentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
    enabled: !!id,
  })

  const isOwner = useRequireEventEditor(event, eventLoading)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['payments', 'pending', id],
    queryFn: () => paymentsAPI.listPending(id!).then((res) => res.data.payments as Payment[]),
    refetchInterval: 10000,
    enabled: !!id && !!isOwner,
  })

  const approve = useMutation({
    mutationFn: (paymentId: string) => paymentsAPI.approve(paymentId),
    onSuccess: () => {
      setSuccess('Payment approved. Buyer can download tickets.')
      setError('')
      setActingId(null)
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending', id] })
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
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to reject')
      setActingId(null)
    },
  })

  const payments = data || []

  const gateways = useMemo(() => {
    const set = new Set(payments.map((p) => p.gateway))
    return Array.from(set).sort()
  }, [payments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      if (gatewayFilter !== 'all' && p.gateway !== gatewayFilter) return false
      if (!q) return true
      const hay = [
        p.buyer_name,
        p.buyer_email,
        p.buyer_phone,
        p.buyer_tx_code,
        p.buyer_reference,
        p.gateway_ref,
        p.order_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [payments, search, gatewayFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalAmount = useMemo(
    () => filtered.reduce((sum, p) => sum + Number(p.amount_etb || 0), 0),
    [filtered]
  )

  if (event && !isOwner) return null

  function onSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function onGatewayChange(value: string) {
    setGatewayFilter(value)
    setPage(1)
  }

  function handleApprove(paymentId: string) {
    setActingId(paymentId)
    approve.mutate(paymentId)
  }

  function handleReject(paymentId: string) {
    if (
      !window.confirm(
        'Reject this payment? The order will be cancelled and seats released.'
      )
    ) {
      return
    }
    setActingId(paymentId)
    reject.mutate(paymentId)
  }

  const busy = approve.isPending || reject.isPending

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-bg-soft" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" aria-hidden />

      <header className="relative section pt-5 sm:pt-8 pb-4 sm:pb-5">
        <button
          type="button"
          onClick={() => navigate(`/events/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2">
              Payment review
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Approve payments
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 truncate max-w-xl">
              {event?.title
                ? `Phone payment codes for ${event.title}`
                : 'Review phone payment codes from buyers'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Summary strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
            <p className="text-xs text-slate-500">Waiting</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              {payments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
            <p className="text-xs text-slate-500">Shown</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-slate-900 tabular-nums">
              {filtered.length}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3">
            <p className="text-xs text-emerald-700/80">Amount in queue</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-emerald-800 tabular-nums">
              {formatEtb(totalAmount)}
            </p>
          </div>
        </div>
      </header>

      <div className="relative section pb-24 sm:pb-16 space-y-4">
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {/* Sticky filters */}
        <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 bg-slate-50/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-slate-200/70 lg:border-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search name, phone, email, codes…"
                className="input-base pl-10 pr-10 h-11"
                aria-label="Search payments"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={gatewayFilter}
              onChange={(e) => onGatewayChange(e.target.value)}
              className="input-base h-11 sm:w-44 shrink-0"
              aria-label="Filter by gateway"
            >
              <option value="all">All gateways</option>
              {gateways.map((g) => (
                <option key={g} value={g}>
                  {gatewayLabel(g)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading || eventLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-14 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-900">No payments waiting</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              When a buyer pays and submits codes, they show up here for approval.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-12 text-center">
            <p className="font-medium text-slate-900">No matches</p>
            <p className="text-sm text-slate-500 mt-1">Try a different search or gateway filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                onSearchChange('')
                onGatewayChange('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50/90">
                      <th className="px-4 py-3 font-semibold">Buyer</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Gateway</th>
                      <th className="px-4 py-3 font-semibold">Tx / Ref</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                      <th className="px-4 py-3 font-semibold text-right sticky right-0 bg-slate-50/95">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 align-top"
                        >
                          <td className="px-4 py-3.5 min-w-[180px]">
                            <p className="font-medium text-slate-900">{p.buyer_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                              {p.buyer_phone}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-[220px]">
                              {p.buyer_email}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatEtb(p.amount_etb)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant="neutral">{gatewayLabel(p.gateway)}</Badge>
                          </td>
                          <td className="px-4 py-3.5 min-w-[200px]">
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-1">
                                <span className="font-mono text-xs text-slate-800 break-all leading-snug">
                                  {p.buyer_tx_code || '—'}
                                </span>
                                {p.buyer_tx_code ? <CopyButton value={p.buyer_tx_code} /> : null}
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="font-mono text-xs text-slate-500 break-all leading-snug">
                                  {p.buyer_reference || p.gateway_ref || '—'}
                                </span>
                                {(p.buyer_reference || p.gateway_ref) && (
                                  <CopyButton value={p.buyer_reference || p.gateway_ref || ''} />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                            {format(
                              new Date(p.updated_at || p.created_at),
                              'MMM d · h:mm a'
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/orders/${p.order_id}`)}
                              className="mt-1.5 flex items-center gap-1 text-brand-700 hover:text-brand-900 text-xs font-medium"
                            >
                              Order <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="px-4 py-3.5 sticky right-0 bg-white/95">
                            <div className="flex flex-col items-stretch gap-1.5 min-w-[132px]">
                              <Button
                                size="sm"
                                variant="success"
                                disabled={busy && actingId !== p.id}
                                isLoading={actingId === p.id && approve.isPending}
                                onClick={() => handleApprove(p.id)}
                                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy && actingId !== p.id}
                                isLoading={actingId === p.id && reject.isPending}
                                onClick={() => handleReject(p.id)}
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-3">
              {pageItems.map((p) => {
                const open = expandedId === p.id
                return (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/95 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : p.id)}
                      className="w-full text-left px-4 pt-4 pb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{p.buyer_name}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{p.buyer_phone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-slate-900 tabular-nums">
                            {formatEtb(p.amount_etb)}
                          </p>
                          <Badge variant="neutral" className="mt-1">
                            {gatewayLabel(p.gateway)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                          {format(new Date(p.updated_at || p.created_at), 'MMM d · h:mm a')}
                        </p>
                        <span className="text-xs text-slate-500 inline-flex items-center gap-0.5">
                          {open ? 'Hide codes' : 'Show codes'}
                          {open ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 pb-3 space-y-2.5 border-t border-slate-100 pt-3">
                        <CodeBlock label="Transaction code" value={p.buyer_tx_code} />
                        <CodeBlock
                          label="Reference code"
                          value={p.buyer_reference || p.gateway_ref}
                        />
                        <p className="text-xs text-slate-500 truncate">{p.buyer_email}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${p.order_id}`)}
                          className="text-xs font-medium text-brand-700 inline-flex items-center gap-1"
                        >
                          View order <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1">
                      <Button
                        size="sm"
                        variant="success"
                        fullWidth
                        disabled={busy && actingId !== p.id}
                        isLoading={actingId === p.id && approve.isPending}
                        onClick={() => handleApprove(p.id)}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        disabled={busy && actingId !== p.id}
                        isLoading={actingId === p.id && reject.isPending}
                        onClick={() => handleReject(p.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-500 order-2 sm:order-1">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm tabular-nums text-slate-600 px-2 shrink-0">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
