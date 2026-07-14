import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { eventsAPI, ordersAPI } from '../lib/api'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { slugify } from '../lib/slug'

interface CartItem {
  ticket_type_id: string
  ticket_name: string
  price: number
  quantity: number
  holder_name: string
}

interface CheckoutDraft {
  eventId?: string
  eventSlug?: string | null
  buyer?: { name?: string; email?: string; phone?: string }
  cart?: CartItem[]
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<'select' | 'checkout'>('select')
  const [eventSlug, setEventSlug] = useState<string | null>(null)
  const [buyerInfo, setBuyerInfo] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
  })
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    // Prefer the new draft (ticket + buyer). Fall back to legacy registrantInfo.
    const draftRaw = sessionStorage.getItem('checkoutDraft')
    const legacyRaw = sessionStorage.getItem('registrantInfo')

    if (draftRaw) {
      try {
        const draft: CheckoutDraft = JSON.parse(draftRaw)
        if (!draft.eventId || draft.eventId === id) {
          if (draft.buyer) {
            setBuyerInfo({
              buyer_name: draft.buyer.name || '',
              buyer_email: draft.buyer.email || '',
              buyer_phone: draft.buyer.phone || '',
            })
          }
          if (draft.cart?.length) {
            setCart(draft.cart)
            setStep('checkout')
          }
          if (draft.eventSlug) setEventSlug(draft.eventSlug)
        }
        sessionStorage.removeItem('checkoutDraft')
      } catch (err) {
        console.error('Failed to parse checkout draft', err)
      }
    } else if (legacyRaw) {
      try {
        const data = JSON.parse(legacyRaw)
        setBuyerInfo({
          buyer_name: data.name || '',
          buyer_email: data.email || '',
          buyer_phone: data.phone || '',
        })
        sessionStorage.removeItem('registrantInfo')
      } catch (err) {
        console.error('Failed to parse registrant info', err)
      }
    }
    setDraftReady(true)
  }, [id])

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

  const backToEvent = () => {
    const slug = eventSlug || (availability?.event?.title ? slugify(availability.event.title) : null)
    if (slug) {
      navigate(`/browse?event=${slug}`)
      return
    }
    navigate('/browse')
  }

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

    if (cart.length === 0) {
      setError('Your cart is empty')
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
  const cameFromBrowse = step === 'checkout' && cart.length > 0

  if (isLoading || !draftReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
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
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={backToEvent} className="mb-6">
          ← Back to event
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
                  <h2 className="text-2xl font-bold text-slate-900">
                    {availability.event.title}
                  </h2>
                  <p className="text-slate-600 mt-1">Select tickets to purchase</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availability.ticket_types.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-900">{ticket.name}</h3>
                        <p className="text-sm text-slate-600">
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
                  <h2 className="text-2xl font-bold text-slate-900">Confirm & pay</h2>
                  <p className="text-slate-600 mt-1">
                    Review your order, then create it to pay.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Your tickets</h3>
                      {cart.map((item) => (
                        <div
                          key={item.ticket_type_id}
                          className="p-4 border border-slate-200 rounded-lg space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-slate-900">{item.ticket_name}</h4>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.ticket_type_id, -1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                type="button"
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

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Buyer information</h3>
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
                        Create order
                      </Button>
                      {!cameFromBrowse && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setStep('select')}
                          fullWidth
                        >
                          Back
                        </Button>
                      )}
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
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order summary
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.ticket_type_id}
                          className="flex justify-between text-sm p-2 bg-slate-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{item.ticket_name}</p>
                            <p className="text-slate-600">x{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900">
                              Br {(item.price * item.quantity).toFixed(2)}
                            </p>
                            {!cameFromBrowse && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.ticket_type_id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold text-slate-900">Total</span>
                        <span className="text-xl font-bold text-slate-900">
                          Br {cartTotal.toFixed(2)}
                        </span>
                      </div>
                      {step === 'select' && (
                        <Button onClick={() => setStep('checkout')} fullWidth>
                          Continue
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-slate-600 py-4">No tickets selected yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
