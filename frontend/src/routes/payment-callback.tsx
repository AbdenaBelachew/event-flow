import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent } from '../components/Card'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function PaymentCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status] = useState<'loading' | 'success' | 'failed'>(() => {
    const paymentStatus = searchParams.get('status')
    if (paymentStatus === 'success') return 'success'
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') return 'failed'
    return 'success'
  })

  const orderId = searchParams.get('order_id')
  const txRef = searchParams.get('tx_ref')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600">Verifying payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-purple-600 mx-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600">
                  Your payment has been processed successfully.
                </p>
              </div>

              {orderId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="text-lg font-mono font-bold text-gray-900 mt-1">
                    {orderId.slice(0, 12).toUpperCase()}...
                  </p>
                </div>
              )}

              {txRef && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Transaction Reference</p>
                  <p className="text-sm font-mono text-gray-900 mt-1 break-all">{txRef}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Your tickets have been issued and sent to your email. Download them and bring them to the event.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                {orderId && (
                  <Button fullWidth onClick={() => navigate(`/orders/${orderId}`)}>
                    View Order
                  </Button>
                )}
                <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600">
                Your payment could not be processed. Please try again.
              </p>
            </div>

            <Alert
              type="error"
              message="If you were charged, you will receive a refund within 24 hours."
            />

            <div className="space-y-2 pt-4">
              {orderId && (
                <Button fullWidth onClick={() => navigate(`/orders/${orderId}`)}>
                  Retry Payment
                </Button>
              )}
              <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
