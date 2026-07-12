import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ordersAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Banknote, CheckCircle, Clock, AlertCircle } from 'lucide-react'
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

  const { data, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersAPI.getOrder(id!).then((res) => res.data as Order),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-red-600" />
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
                      className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{ticket.holder_name}</p>
                        <p className="text-sm text-gray-600">Code: {ticket.ticket_code}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.status === 'valid'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'used'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {ticket.status}
                      </span>
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
                    Br {order.total_amount_etb.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    Br {order.total_amount_etb.toFixed(2)}
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
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  </>
                )}

                {order.status === 'paid' && (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Payment Complete!</p>
                    <p className="text-xs text-green-700 mt-1">
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
