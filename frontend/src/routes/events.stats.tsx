import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import {
  Users,
  Banknote,
  ArrowLeft,
  Ticket,
  CheckCircle2,
  UserX,
  ScanLine,
  Pencil,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useRequireEventOwner } from '../lib/event-access'
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
      return { variant: 'neutral' as const, label: status || 'Unknown' }
  }
}

function formatBr(n: number) {
  return `Br ${Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5', accent || 'text-slate-900')}>
            {value}
          </p>
          {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({
  value,
  max,
  tone = 'brand',
}: {
  value: number
  max: number
  tone?: 'brand' | 'amber' | 'red'
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const bar =
    tone === 'red'
      ? 'bg-red-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : 'bg-brand-500'

  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function StatsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
    enabled: !!id,
  })
  const isOwner = useRequireEventOwner(event, eventLoading)

  const {
    data: stats,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['events', id, 'stats'],
    queryFn: async () => {
      const res = await eventsAPI.getStats(id!)
      return res.data
    },
    enabled: !!id && !!event && isOwner,
    refetchInterval: 30_000,
  })

  if (event && !isOwner) return null

  if (eventLoading || (isLoading && !stats)) {
    return (
      <div className="min-h-screen gradient-bg-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading statistics…</p>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="min-h-screen gradient-bg-soft">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Couldn’t load stats</h2>
          <p className="text-sm text-slate-500 mb-6">
            Something went wrong fetching analytics for this event.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate(`/events/${id}`)}>
              Back to event
            </Button>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }

  const capacity = stats.capacity || 0
  const sold = stats.sold || 0
  const issued = stats.tickets_issued || 0
  const checkedIn = stats.checked_in || 0
  const noShow = stats.no_show ?? Math.max(issued - checkedIn, 0)
  const revenue = Number(stats.revenue_etb || 0)
  const sellThrough = capacity > 0 ? (sold / capacity) * 100 : 0
  const attendanceRate = issued > 0 ? (checkedIn / issued) * 100 : 0
  const avgTicket = sold > 0 ? revenue / sold : 0
  const badge = statusBadge(event?.status)

  return (
    <div className="min-h-screen gradient-bg-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="mt-1 p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition"
              aria-label="Back to event"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={badge.variant} dot>
                  {badge.label}
                </Badge>
                <span className="text-xs text-slate-400">Statistics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 truncate">
                {event?.title || 'Event stats'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Revenue, tickets, and door check-ins
                {isFetching && !isLoading ? (
                  <span className="ml-2 text-brand-600">Updating…</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${id}/scanner`)}
              leftIcon={<ScanLine className="w-3.5 h-3.5" />}
            >
              Scanner
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/events/${id}/edit`)}
              leftIcon={<Pencil className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger">
          <StatCard
            label="Revenue"
            value={formatBr(revenue)}
            hint={`${sold} tickets sold`}
            icon={<Banknote className="w-5 h-5" />}
            accent="text-brand-700"
          />
          <StatCard
            label="Tickets sold"
            value={sold.toLocaleString()}
            hint={capacity > 0 ? `${sellThrough.toFixed(0)}% of capacity` : 'No capacity set'}
            icon={<Ticket className="w-5 h-5" />}
          />
          <StatCard
            label="Checked in"
            value={checkedIn.toLocaleString()}
            hint={issued > 0 ? `${attendanceRate.toFixed(0)}% of issued` : 'No tickets issued yet'}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="No-shows"
            value={noShow.toLocaleString()}
            hint={
              issued > 0
                ? `${((noShow / issued) * 100).toFixed(0)}% of issued tickets`
                : 'Waiting for sales'
            }
            icon={<UserX className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Main column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Attendance funnel */}
            <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Attendance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  From capacity through door check-in
                </p>
              </div>
              <div className="p-5 space-y-5">
                <FunnelRow
                  label="Capacity"
                  value={capacity}
                  max={Math.max(capacity, 1)}
                  tone="brand"
                />
                <FunnelRow
                  label="Sold"
                  value={sold}
                  max={Math.max(capacity, sold, 1)}
                  tone="brand"
                />
                <FunnelRow
                  label="Issued"
                  value={issued}
                  max={Math.max(capacity, issued, 1)}
                  tone="brand"
                />
                <FunnelRow
                  label="Checked in"
                  value={checkedIn}
                  max={Math.max(issued, checkedIn, 1)}
                  tone="brand"
                />
                <FunnelRow
                  label="No-shows"
                  value={noShow}
                  max={Math.max(issued, noShow, 1)}
                  tone={noShow > 0 ? 'amber' : 'brand'}
                />
              </div>
            </section>

            {/* Ticket types */}
            <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">By ticket type</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Sales and revenue per tier</p>
                </div>
                {stats.by_ticket_type?.length > 0 && (
                  <Badge variant="brand">
                    {stats.by_ticket_type.length}{' '}
                    {stats.by_ticket_type.length === 1 ? 'type' : 'types'}
                  </Badge>
                )}
              </div>

              <div className="p-5">
                {stats.by_ticket_type?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.by_ticket_type.map((type: any) => {
                      const remaining = Math.max(
                        (type.quantity_total || 0) - (type.quantity_sold || 0),
                        0
                      )
                      const soldPct =
                        type.quantity_total > 0
                          ? Math.round((type.quantity_sold / type.quantity_total) * 100)
                          : 0
                      const typeRevenue =
                        type.revenue_etb ?? type.quantity_sold * type.price_etb
                      const tone =
                        remaining === 0
                          ? 'red'
                          : remaining <= 10 && type.quantity_total > 10
                            ? 'amber'
                            : 'brand'

                      return (
                        <div
                          key={type.name}
                          className="rounded-xl border border-slate-200 p-4 hover:border-brand-200 hover:bg-brand-50/20 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {type.name}
                                </h3>
                                {remaining === 0 && <Badge variant="danger">Sold out</Badge>}
                                {remaining > 0 &&
                                  remaining <= 10 &&
                                  type.quantity_total > 10 && (
                                    <Badge variant="warning">Low stock</Badge>
                                  )}
                              </div>
                              <p className="text-sm text-slate-500 mt-0.5">
                                {formatBr(type.price_etb)} each
                              </p>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <p className="text-lg font-bold text-slate-900">
                                {type.quantity_sold}
                                <span className="text-sm font-medium text-slate-400">
                                  {' '}
                                  / {type.quantity_total}
                                </span>
                              </p>
                              <p className="text-xs font-medium text-brand-700 mt-0.5">
                                {formatBr(typeRevenue)}
                              </p>
                            </div>
                          </div>

                          <ProgressBar
                            value={type.quantity_sold}
                            max={type.quantity_total || 1}
                            tone={tone}
                          />
                          <div className="flex justify-between mt-2 text-xs">
                            <span className="font-medium text-slate-700">{soldPct}% sold</span>
                            <span
                              className={cn(
                                'font-medium',
                                remaining === 0
                                  ? 'text-red-600'
                                  : remaining <= 10
                                    ? 'text-amber-600'
                                    : 'text-slate-500'
                              )}
                            >
                              {remaining === 0 ? 'None left' : `${remaining} remaining`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                      <Ticket className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-800">No ticket types yet</p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Add tickets on the edit page to start tracking sales.
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate(`/events/${id}/edit`)}
                      leftIcon={<Pencil className="w-4 h-4" />}
                    >
                      Manage tickets
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Performance</h2>
              <dl className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-slate-500">Avg. ticket price</dt>
                  <dd className="text-sm font-semibold text-slate-900">{formatBr(avgTicket)}</dd>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <dt className="text-sm text-slate-500">Sell-through</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {sellThrough.toFixed(0)}%
                    </dd>
                  </div>
                  <ProgressBar value={sold} max={Math.max(capacity, 1)} />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <dt className="text-sm text-slate-500">Attendance rate</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {attendanceRate.toFixed(0)}%
                    </dd>
                  </div>
                  <ProgressBar value={checkedIn} max={Math.max(issued, 1)} />
                </div>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <dt className="text-sm text-slate-500">Tickets issued</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {issued.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-slate-500">Capacity</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {capacity.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Quick links
              </p>
              <Link
                to={`/events/${id}/scanner`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <ScanLine className="w-4 h-4 text-slate-400" />
                Door scanner
              </Link>
              <Link
                to={`/events/${id}/payments`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                Payments
              </Link>
              <Link
                to={`/events/${id}/edit`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Edit event
              </Link>
              <Link
                to={`/events/${id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Users className="w-4 h-4 text-slate-400" />
                Public page
              </Link>
            </section>

            {event?.status === 'draft' && (
              <Alert
                type="info"
                message="This event is still a draft. Publish it so guests can buy tickets."
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function FunnelRow({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone: 'brand' | 'amber' | 'red'
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <ProgressBar value={value} max={max} tone={tone} />
    </div>
  )
}
