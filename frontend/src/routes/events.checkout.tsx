import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { eventsAPI, ordersAPI } from '../lib/api'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import { ShoppingCart, Minus, Plus } from 'lucide-react'

interface CartItem {
  ticket_type_id: string
  ticket_name: string
  price: number
  quantity: number
  holder_name: string
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<'select' | 'checkout'>('select')
  const [buyerInfo, setBuyerInfo] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
  })

  const { data: availability, isLoading } = useQuery({
    queryKey: ['events', id, 'availability'],
    queryFn: () => eventsAPI.getAvailability(id!).then((res) => res.data),
  })

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => ordersAPI.create(data),
    onSuccess: (response) => {
      navigate(`/orders/${response.data.order.id}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create order')
    },
  })

  const handleAddToCart = (ticket: any) => {
    const existing = cart.find((item) => item.ticket_type_id === ticket.id)
    if (existing && existing.quantity < ticket.max_per_order) {
      setCart(
        cart.map((item) =>
          item.ticket_type_id === ticket.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else if (!existing) {
      setCart([
        ...cart,
        {
          ticket_type_id: ticket.id,
          ticket_name: ticket.name,
          price: ticket.price_etb,
          quantity: 1,
          holder_name: '',
        },
      ])
    }
  }

  const handleRemoveFromCart = (ticketTypeId: string) => {
    setCart(cart.filter((item) => item.ticket_type_id !== ticketTypeId))
  }

  const handleUpdateQuantity = (ticketTypeId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.ticket_type_id === ticketTypeId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }



  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!buyerInfo.buyer_name || !buyerInfo.buyer_email || !buyerInfo.buyer_phone) {
      setError('Please fill in all buyer information')
      return
    }

    const items = cart.map((item) => ({
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      holder_name: item.holder_name || buyerInfo.buyer_name,
    }))

    createOrderMutation.mutate({
      event_id: id!,
      buyer_name: buyerInfo.buyer_name,
      buyer_email: buyerInfo.buyer_email,
      buyer_phone: buyerInfo.buyer_phone,
      items,
    } as any)
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!availability) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" message="Event not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2">
            {step === 'select' ? (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {availability.event.title}
                  </h2>
                  <p className="text-gray-600 mt-1">Select tickets to purchase</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availability.ticket_types.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">{ticket.name}</h3>
                        <p className="text-sm text-gray-600">
                          Br {ticket.price_etb} • {ticket.remaining} available
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(ticket)}
                        disabled={ticket.sold_out || !ticket.on_sale}
                        size="sm"
                      >
                        {ticket.sold_out ? 'Sold Out' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    {/* Cart Items */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                      {cart.map((item) => (
                        <div
                          key={item.ticket_type_id}
                          className="p-4 border border-gray-200 rounded-lg space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">{item.ticket_name}</h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.ticket_type_id, -1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.ticket_type_id, 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            Br {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Buyer Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Buyer Information</h3>
                      <Input
                        label="Full Name"
                        value={buyerInfo.buyer_name}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, buyer_name: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={buyerInfo.buyer_email}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, buyer_email: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={buyerInfo.buyer_phone}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, buyer_phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        isLoading={createOrderMutation.isPending}
                        fullWidth
                      >
                        Create Order
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setStep('select')}
                        fullWidth
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.ticket_type_id}
                          className="flex justify-between text-sm p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{item.ticket_name}</p>
                            <p className="text-gray-600">x{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              Br {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleRemoveFromCart(item.ticket_type_id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-gray-900">
                          Br {cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        onClick={() => setStep('checkout')}
                        fullWidth
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-600 py-4">No items in cart</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
