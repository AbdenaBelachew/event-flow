import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ticketsAPI, eventsAPI } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import {
  useRequireEventOwner,
  isDoorChecker,
  canEditEvent,
} from '../lib/event-access'
import Button from '../components/Button'
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ScanLine,
  MapPin,
  Calendar,
  LogOut,
  RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'

type CheckInResult =
  | 'success'
  | 'already_used'
  | 'unpaid'
  | 'invalid'
  | 'wrong_event'
  | 'error'

interface ScanFeedback {
  result: CheckInResult
  message: string
  ticket?: {
    ticket_code: string
    holder_name: string
    status: string
    used_at?: string
  } | null
}

const RESULT_COPY: Record<
  CheckInResult,
  { title: string; tone: 'ok' | 'warn' | 'bad' }
> = {
  success: { title: 'Welcome in', tone: 'ok' },
  already_used: { title: 'Already used', tone: 'warn' },
  unpaid: { title: 'Not paid', tone: 'bad' },
  invalid: { title: 'Invalid ticket', tone: 'bad' },
  wrong_event: { title: 'Wrong event', tone: 'bad' },
  error: { title: 'Check-in failed', tone: 'bad' },
}

function parseScanPayload(data: any, fallbackMessage?: string): ScanFeedback {
  const result = (data?.result as CheckInResult) || 'error'
  return {
    result: RESULT_COPY[result] ? result : 'error',
    message: data?.message || fallbackMessage || 'Something went wrong',
    ticket: data?.ticket ?? null,
  }
}

export default function ScannerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [ticketCode, setTicketCode] = useState('')
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [checkedInCount, setCheckedInCount] = useState(0)

  const checker = isDoorChecker(user)

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
    enabled: !!id,
  })

  const isOwner = useRequireEventOwner(event, eventLoading)
  const isAdmin = canEditEvent(user, event)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!feedback || feedback.result !== 'success') return
    const t = setTimeout(() => {
      setFeedback(null)
      inputRef.current?.focus()
    }, 2800)
    return () => clearTimeout(t)
  }, [feedback])

  const checkInMutation = useMutation({
    mutationFn: (code: string) => ticketsAPI.checkIn(code.trim()),
    onSuccess: (response) => {
      const parsed = parseScanPayload(response.data)
      setFeedback(parsed)
      if (parsed.result === 'success') {
        setCheckedInCount((n) => n + 1)
      }
      setTicketCode('')
      setTimeout(() => inputRef.current?.focus(), 80)
    },
    onError: (err: any) => {
      const data = err?.response?.data
      setFeedback(
        parseScanPayload(data, data?.message || err?.message || 'Check-in failed')
      )
      setTicketCode('')
      setTimeout(() => inputRef.current?.focus(), 80)
    },
  })

  if (event && !isOwner) return null

  const handleScan = () => {
    const code = ticketCode.trim()
    if (!code || checkInMutation.isPending) return
    setFeedback(null)
    checkInMutation.mutate(code)
  }

  const readyForNext = () => {
    setFeedback(null)
    setTicketCode('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const tone = feedback ? RESULT_COPY[feedback.result].tone : null

  if (eventLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white min-h-[calc(100dvh-3.5rem)]">
        <div className="text-center px-4">
          <div className="w-10 h-10 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading scanner…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white min-h-[calc(100dvh-3.5rem)] flex flex-col">
      {/* Compact header */}
      <header className="border-b border-slate-200 bg-slate-50/90 sticky top-14 z-20">
        <div className="max-w-lg mx-auto w-full px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {!checker ? (
              <button
                type="button"
                onClick={() => navigate(`/events/${id}`)}
                className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200"
                aria-label="Back to event"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <ScanLine className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-brand-600">
                Door check-in
              </p>
              <h1 className="font-display text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                {event?.title || 'Event'}
              </h1>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
              <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-center min-w-[3.25rem]">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                  In
                </p>
                <p className="font-display text-lg sm:text-xl font-bold text-brand-600 tabular-nums leading-none mt-0.5">
                  {checkedInCount}
                </p>
              </div>
              {checker && (
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/login', { replace: true })
                  }}
                  className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {(event?.venue || event?.event_start) && (
            <div className="mt-2.5 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-3 sm:gap-y-1 text-xs text-slate-500 pl-12 sm:pl-11">
              {event?.venue && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </span>
                </span>
              )}
              {event?.event_start && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="sm:hidden">
                    {format(new Date(event.event_start), 'MMM d · h:mm a')}
                  </span>
                  <span className="hidden sm:inline">
                    {format(new Date(event.event_start), 'EEE, MMM d · h:mm a')}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <div className="flex-1 px-3 sm:px-5 pt-4 sm:pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-8">
          <div className="mb-4 sm:mb-5">
            <p className="font-display text-sm sm:text-base font-semibold text-slate-900">
              Scan ticket
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              <span className="sm:hidden">Type or scan a code, then check in</span>
              <span className="hidden sm:inline">
                Enter code or use a barcode scanner — then press Enter
              </span>
            </p>
          </div>

          <label className="sr-only" htmlFor="ticket-code-input">
            Ticket code
          </label>
          <input
            id="ticket-code-input"
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="TICKET CODE"
            value={ticketCode}
            onChange={(e) => {
              setTicketCode(e.target.value.toUpperCase())
              if (feedback && feedback.result !== 'success') setFeedback(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleScan()
              }
            }}
            disabled={checkInMutation.isPending}
            className="w-full font-mono text-base sm:text-xl md:text-2xl tracking-[0.12em] sm:tracking-wider text-center py-3.5 sm:py-4 px-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 touch-manipulation"
          />

          {/* Result */}
          <div className="mt-4 sm:mt-6">
            {!feedback && !checkInMutation.isPending && (
              <div className="border border-dashed border-slate-200 rounded-xl px-4 py-7 sm:py-10 text-center">
                <p className="font-display text-base sm:text-lg font-semibold text-slate-800">
                  Ready
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-[16rem] mx-auto leading-relaxed">
                  Waiting for the next ticket. Green means let them in.
                </p>
              </div>
            )}

            {checkInMutation.isPending && !feedback && (
              <div className="border border-slate-200 rounded-xl px-4 py-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Checking…</p>
              </div>
            )}

            {feedback && (
              <div
                className={[
                  'rounded-xl border px-4 py-6 sm:px-5 sm:py-8 text-center animate-[fadeUp_0.35s_ease-out_both]',
                  tone === 'ok' && 'bg-brand-50 border-brand-200',
                  tone === 'warn' && 'bg-amber-50 border-amber-200',
                  tone === 'bad' && 'bg-red-50 border-red-200',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div
                  className={[
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4',
                    tone === 'ok' && 'bg-brand-600 text-white',
                    tone === 'warn' && 'bg-amber-500 text-white',
                    tone === 'bad' && 'bg-red-600 text-white',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tone === 'ok' ? (
                    <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                  ) : (
                    <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                  )}
                </div>

                <h2
                  className={[
                    'font-display text-xl sm:text-3xl font-bold tracking-tight',
                    tone === 'ok' && 'text-brand-900',
                    tone === 'warn' && 'text-amber-950',
                    tone === 'bad' && 'text-red-950',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {RESULT_COPY[feedback.result].title}
                </h2>
                <p
                  className={[
                    'mt-1.5 sm:mt-2 text-sm sm:text-base px-1',
                    tone === 'ok' && 'text-brand-800',
                    tone === 'warn' && 'text-amber-900/80',
                    tone === 'bad' && 'text-red-900/80',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {feedback.message}
                </p>

                {feedback.ticket && (
                  <div className="mt-4 sm:mt-6 pt-4 border-t border-black/5 grid grid-cols-2 gap-3 text-left">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Name
                      </p>
                      <p className="font-semibold text-sm sm:text-base text-slate-900 mt-0.5 truncate">
                        {feedback.ticket.holder_name || '—'}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Code
                      </p>
                      <p className="font-mono text-xs sm:text-sm text-slate-900 mt-0.5 truncate">
                        {feedback.ticket.ticket_code}
                      </p>
                    </div>
                  </div>
                )}

                {feedback.result !== 'success' && (
                  <Button
                    className="mt-5 w-full sm:w-auto"
                    variant="outline"
                    size="lg"
                    onClick={readyForNext}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Scan next
                  </Button>
                )}
              </div>
            )}
          </div>

          {user && (
            <p className="mt-6 mb-2 text-center text-[11px] sm:text-xs text-slate-400 px-2">
              {user.full_name}
              {checker ? ' · door checker' : isAdmin ? ' · admin' : ''}
            </p>
          )}
        </div>

        {/* Sticky thumb CTA — mobile & tablet */}
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:px-5 sm:pb-6">
          <div
            className="max-w-lg mx-auto px-3 sm:px-0 pt-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <Button
              type="button"
              size="lg"
              fullWidth
              isLoading={checkInMutation.isPending}
              disabled={!ticketCode.trim()}
              onClick={handleScan}
              className="min-h-[3rem] text-base font-semibold touch-manipulation"
            >
              Check in
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
