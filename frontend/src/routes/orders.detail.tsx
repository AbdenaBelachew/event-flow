import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ordersAPI, eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

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
    ticket_code: string
    holder_name: string
    status: string
  }>
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedGateway, setSelectedGateway] = useState('chapa')
  const [error, setError] = useState('')
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersAPI.getOrder(id!).then((res) => res.data as Order),
  })

  const { data: event } = useQuery({
    queryKey: ['events', data?.order.event_id],
    queryFn: () => (data?.order.event_id ? eventsAPI.getEvent(data.order.event_id).then((res) => res.data.event) : null),
    enabled: !!data?.order.event_id,
  })

  const initiatePay = useMutation({
    mutationFn: () => ordersAPI.initiatePay(id!, selectedGateway),
    onSuccess: (response) => {
      window.location.href = response.data.checkout_url
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to initiate payment')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-6 h-6 text-purple-600" />
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-red-600" />
    }
  }

  const handleDownloadTicket = async (ticket: any) => {
    setDownloadingTicketId(ticket.id)
    try {
      // Generate QR code as data URL using free API
      const qrSize = 150
      const qrText = encodeURIComponent(ticket.ticket_code)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrText}`

      const ticketHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket - ${ticket.ticket_code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
            }
            .ticket-container { 
              width: 100%;
              max-width: 650px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              overflow: hidden;
            }
            .ticket-header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .ticket-title {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .ticket-date {
              font-size: 14px;
              opacity: 0.9;
            }
            .ticket-body {
              padding: 40px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .info-section {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 11px;
              font-weight: 700;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              line-height: 1.4;
            }
            .qr-section {
              text-align: center;
              border-top: 2px solid #e5e7eb;
              padding-top: 40px;
            }
            .qr-code-box {
              display: inline-block;
              background: white;
              padding: 15px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              margin-bottom: 15px;
            }
            .qr-code-box img {
              width: 150px;
              height: 150px;
              display: block;
            }
            .ticket-code-display {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              letter-spacing: 2px;
              margin-bottom: 15px;
            }
            .status-badge {
              display: inline-block;
              background: #dcfce7;
              color: #166534;
              padding: 8px 16px;
              border-radius: 24px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .ticket-footer {
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              line-height: 1.8;
            }
            .footer-note {
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 10px;
            }
            @media print {
              body { background: white; }
              .ticket-container { box-shadow: none; margin: 0; }
            }
            @media (max-width: 640px) {
              .ticket-header { padding: 30px 20px; }
              .ticket-title { font-size: 24px; }
              .ticket-body { padding: 20px; }
              .info-grid { grid-template-columns: 1fr; gap: 20px; }
              .info-value { font-size: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-header">
              <div class="ticket-title">${event?.title || 'Event Ticket'}</div>
              <div class="ticket-date">${event ? format(new Date(event.event_start), 'MMMM d, yyyy · HH:mm') : 'Date'}</div>
            </div>
            
            <div class="ticket-body">
              <div class="info-grid">
                <div class="info-section">
                  <div class="info-label">Ticket Holder</div>
                  <div class="info-value">${ticket.holder_name}</div>
                </div>
                <div class="info-section">
                  <div class="info-label">Order Number</div>
                  <div class="info-value">${order.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <div class="info-section">
                  <div class="info-label">Venue</div>
                  <div class="info-value">${event?.venue || 'Venue'}${event?.city ? '<br>' + event.city : ''}</div>
                </div>
                <div class="info-section">
                  <div class="info-label">Ticket Status</div>
                  <div><span class="status-badge">${ticket.status}</span></div>
                </div>
              </div>
              
              <div class="qr-section">
                <div class="qr-code-box">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                </div>
                <div class="ticket-code-display">${ticket.ticket_code}</div>
                <p style="color: #6b7280; font-size: 12px;">Scan this QR code at the event entrance</p>
              </div>
              
              <div class="ticket-footer">
                <div class="footer-note">Important Information</div>
                <div>Please present this ticket at the event entrance</div>
                <div>Downloaded: ${format(new Date(), 'PPpp')}</div>
                <div style="margin-top: 10px;">Keep this ticket safe - it grants you access to the event</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      // Create blob and download
      const blob = new Blob([ticketHTML], { type: 'text/html;charset=utf-8' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `ticket-${ticket.ticket_code}.html`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading ticket:', err)
      setError('Failed to download ticket')
    } finally {
      setDownloadingTicketId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          ← Back
        </Button>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {/* Status Alert */}
        {searchParams.get('success') === 'true' && (
          <Alert
            type="success"
            title="Payment Successful!"
            message="Your tickets have been issued. Check your email for the QR codes."
            className="mb-6"
          />
        )}

        {/* Order Header */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-2xl font-bold text-gray-900">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">{order.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Buyer Information</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{order.buyer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{order.buyer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900 font-medium">{order.buyer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="text-gray-900 font-medium">
                    {format(new Date(order.created_at), 'PPpp')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Tickets ({tickets.length})
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ticket.holder_name}</p>
                          <p className="text-sm text-gray-600">Code: {ticket.ticket_code}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            ticket.status === 'valid'
                              ? 'bg-purple-100 text-purple-800'
                              : ticket.status === 'used'
                                ? 'bg-brand-100 text-brand-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      {order.status === 'paid' && (
                        <Button
                          onClick={() => handleDownloadTicket(ticket)}
                          isLoading={downloadingTicketId === ticket.id}
                          size="sm"
                          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold mt-2"
                        >
                          Download Ticket
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    Br {parseFloat(String(order.total_amount_etb)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    Br {parseFloat(String(order.total_amount_etb)).toFixed(2)}
                  </span>
                </div>

                {order.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Payment Gateway
                      </label>
                      <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="chapa">Chapa</option>
                        <option value="telebirr">Telebirr</option>
                        <option value="cbe_birr">CBE Birr</option>
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
                  </>
                )}

                {order.status === 'paid' && (
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-purple-800 font-medium">Payment Complete!</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Check your email for ticket details
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
