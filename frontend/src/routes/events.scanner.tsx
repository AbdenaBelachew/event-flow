import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ticketsAPI } from '../lib/api'
import Alert from '../components/Alert'
import Card, { CardContent } from '../components/Card'
import { QrCode, CheckCircle, AlertCircle, ArrowLeft, Zap, Shield, Wifi } from 'lucide-react'

interface ScanResult {
  success: boolean
  ticket?: {
    id: string
    holder_name: string
    ticket_code: string
    status: string
  }
  message: string
}

export default function ScannerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [ticketCode, setTicketCode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkInMutation = useMutation({
    mutationFn: (code: string) => ticketsAPI.checkIn(code),
    onSuccess: (response) => {
      setScanResult(response.data)
      setTicketCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
    },
    onError: (err: any) => {
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Check-in failed',
      })
      setTicketCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
    },
  })

  const handleScan = (code: string) => {
    if (!code.trim()) return
    checkInMutation.mutate(code)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(ticketCode)
    }
  }

  const resetAndFocus = () => {
    setScanResult(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900">
      <div className="max-w-lg mx-auto px-3 xs:px-4 sm:px-5 py-4 xs:py-5 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 xs:mb-5 sm:mb-6">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center gap-1.5 xs:gap-2 text-slate-300 hover:text-white transition-all duration-200 text-sm xs:text-base font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg hover:bg-white/10 active:bg-white/5"
            aria-label="Back to event"
          >
            <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            <span className="hidden xs:inline xs:ml-0.5">Back</span>
            <span className="inline xs:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2 xs:gap-2.5">
            <div className="w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-brand-400 animate-pulse"></div>
            <span className="text-xs xs:text-sm font-semibold text-brand-400">Live Scanner</span>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-4 xs:mb-5 sm:mb-6"
          />
        )}

        {/* Scanner Card */}
        <Card className="shadow-2xl hover:shadow-3xl border-0 overflow-hidden transition-shadow duration-300">
          <div className="bg-gradient-to-r from-brand-600 via-brand-600 to-brand-600 px-4 xs:px-5 sm:px-6 py-4 xs:py-5 sm:py-6">
            <div className="flex items-center gap-3 xs:gap-4">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">Check-in Scanner</h1>
                <p className="text-xs xs:text-sm text-white/90 mt-0.5 xs:mt-1">Scan or enter ticket code to check-in attendees</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 xs:p-5 sm:p-6 md:p-8">
            {/* Scanner Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter ticket code here..."
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full text-base xs:text-lg sm:text-xl py-3 xs:py-4 sm:py-5 px-4 xs:px-5 sm:px-6 pr-14 xs:pr-16 sm:pr-20 border-2 border-slate-200 rounded-xl xs:rounded-2xl focus:ring-3 focus:ring-brand-500 focus:border-transparent bg-white shadow-sm"
                aria-label="Ticket code input"
              />
              <button
                onClick={() => handleScan(ticketCode)}
                disabled={checkInMutation.isPending || !ticketCode.trim()}
                className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 p-2 xs:p-2.5 sm:p-3 bg-gradient-to-r from-brand-600 to-brand-600 text-white rounded-lg xs:rounded-xl hover:from-brand-700 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                aria-label="Scan ticket"
              >
                {checkInMutation.isPending ? (
                  <div className="w-5 h-5 xs:w-6 xs:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7" />
                )}
              </button>
            </div>

            {/* Scan Results */}
            {scanResult && (
              <div
                className={`mt-4 xs:mt-5 sm:mt-6 p-4 xs:p-5 sm:p-6 rounded-xl xs:rounded-2xl border-2 transition-all duration-300 ${
                  scanResult.success 
                    ? 'bg-gradient-to-br from-brand-50 to-purple-50 border-brand-300 shadow-brand-100' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-red-100'
                }`}
              >
                <div className="flex items-start gap-3 xs:gap-4">
                  <div className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    scanResult.success ? 'bg-brand-100' : 'bg-red-100'
                  }`}>
                    {scanResult.success ? (
                      <CheckCircle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-brand-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-base xs:text-lg sm:text-xl font-bold ${
                      scanResult.success ? 'text-brand-900' : 'text-red-900'
                    }`}>
                      {scanResult.success ? '✓ Checked In Successfully!' : '✗ Check-in Failed'}
                    </h2>
                    <p className={`text-sm xs:text-base mt-1 xs:mt-1.5 ${
                      scanResult.success ? 'text-brand-700' : 'text-red-700'
                    }`}>
                      {scanResult.message}
                    </p>

                    {scanResult.ticket && (
                      <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-slate-200 grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 text-sm xs:text-base">
                        <div className="space-y-1">
                          <p className="text-xs xs:text-sm text-slate-500 font-medium">Ticket Holder</p>
                          <p className="font-semibold text-slate-900 truncate text-base xs:text-lg">{scanResult.ticket.holder_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs xs:text-sm text-slate-500 font-medium">Ticket Code</p>
                          <p className="font-mono text-sm xs:text-base text-slate-900 truncate bg-slate-100 px-2 xs:px-3 py-1 xs:py-1.5 rounded-lg">{scanResult.ticket.ticket_code}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={resetAndFocus}
                  className="w-full mt-4 xs:mt-5 sm:mt-6 py-2.5 xs:py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg xs:rounded-xl hover:from-slate-800 hover:to-slate-700 font-medium text-sm xs:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Row */}
        <div className="mt-4 xs:mt-5 sm:mt-6 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3">
          <div className="flex items-center gap-2 xs:gap-2.5 p-3 xs:p-3.5 bg-white/10 backdrop-blur-lg rounded-lg xs:rounded-xl hover:bg-white/15 transition-all duration-200">
            <QrCode className="w-4 h-4 xs:w-5 xs:h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xs xs:text-sm font-semibold text-white">Scan QR Code</p>
              <p className="text-[10px] xs:text-xs text-slate-300">Quick barcode scanning</p>
            </div>
          </div>
          <div className="flex items-center gap-2 xs:gap-2.5 p-3 xs:p-3.5 bg-white/10 backdrop-blur-lg rounded-lg xs:rounded-xl hover:bg-white/15 transition-all duration-200">
            <Wifi className="w-4 h-4 xs:w-5 xs:h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xs xs:text-sm font-semibold text-white">Real-time Sync</p>
              <p className="text-[10px] xs:text-xs text-slate-300">Instant database updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2 xs:gap-2.5 p-3 xs:p-3.5 bg-white/10 backdrop-blur-lg rounded-lg xs:rounded-xl hover:bg-white/15 transition-all duration-200">
            <Shield className="w-4 h-4 xs:w-5 xs:h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs xs:text-sm font-semibold text-white">Duplicate Prevention</p>
              <p className="text-[10px] xs:text-xs text-slate-300">No double check-ins</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 xs:mt-5 sm:mt-6 bg-white/5 backdrop-blur-lg rounded-xl xs:rounded-2xl p-4 xs:p-5">
          <h3 className="text-sm xs:text-base font-semibold text-white mb-2 xs:mb-3">How to use:</h3>
          <ul className="space-y-1.5 xs:space-y-2 text-xs xs:text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 bg-brand-500/20 text-brand-400 rounded-full text-[10px] xs:text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Enter ticket code manually or use device camera to scan QR code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 bg-brand-500/20 text-brand-400 rounded-full text-[10px] xs:text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Press Enter or click Scan button to check-in attendee</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 bg-amber-500/20 text-amber-400 rounded-full text-[10px] xs:text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>View real-time results and continue scanning next tickets</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
