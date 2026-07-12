import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ticketsAPI } from '../lib/api'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react'

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

  const checkInMutation = useMutation({
    mutationFn: (code: string) => ticketsAPI.checkIn(code),
    onSuccess: (response) => {
      setScanResult(response.data)
      setTicketCode('')
      inputRef.current?.focus()
    },
    onError: (err: any) => {
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Check-in failed',
      })
      setTicketCode('')
    },
  })

  const handleScan = (code: string) => {
    if (!code.trim()) return
    checkInMutation.mutate(code)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(ticketCode)
    }
  }

  const getResultIcon = () => {
    if (!scanResult) return null
    if (scanResult.success) return <CheckCircle className="w-16 h-16 text-green-600" />
    return <AlertCircle className="w-16 h-16 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-6">
          ← Back to Event
        </Button>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <QrCode className="w-8 h-8" />
              Check-in Scanner
            </h1>
            <p className="text-gray-600 mt-1">Scan QR codes or enter ticket codes to check in attendees</p>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Scanner Input */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan QR code or enter ticket code..."
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className="w-full text-lg py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Position the QR code scanner or paste the ticket code and press Enter
                </p>
              </div>

              {/* Scan Results */}
              {scanResult && (
                <div
                  className={`p-6 rounded-lg text-center space-y-4 ${
                    scanResult.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex justify-center">{getResultIcon()}</div>
                  <div>
                    <h2
                      className={`text-2xl font-bold ${
                        scanResult.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                    </h2>
                    <p className={`text-sm mt-2 ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {scanResult.message}
                    </p>
                  </div>

                  {scanResult.ticket && (
                    <div className="text-left space-y-2 pt-4 border-t border-gray-300">
                      <div>
                        <p className="text-xs text-gray-600">Holder</p>
                        <p className="font-medium text-gray-900">{scanResult.ticket.holder_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Ticket Code</p>
                        <p className="font-mono text-sm text-gray-900">
                          {scanResult.ticket.ticket_code}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p
                          className={`text-sm font-medium ${
                            scanResult.ticket.status === 'valid'
                              ? 'text-green-600'
                              : scanResult.ticket.status === 'used'
                                ? 'text-blue-600'
                                : 'text-yellow-600'
                          }`}
                        >
                          {scanResult.ticket.status}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setScanResult(null)
                      inputRef.current?.focus()
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Scan Next
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tips</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <QrCode className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p>Use a QR code scanner device or mobile camera to scan ticket QR codes</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p>Data will be transmitted to the server in real-time</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p>Prevent double check-in - each ticket can only be checked in once</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
