import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Users, Banknote, TrendingUp, BarChart3 } from 'lucide-react'

export default function StatsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['events', id, 'stats'],
    queryFn: async () => {
      const res = await eventsAPI.getStats(id!)
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" message="Failed to load event statistics" />
      </div>
    )
  }

  const capacity = stats?.capacity || 0
  const occupied = stats?.checked_in || 0
  const occupancyPercent = capacity > 0 ? ((occupied / capacity) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Statistics</h1>
            <p className="text-gray-600 mt-1">Real-time analytics and insights</p>
          </div>
          <Button variant="ghost" onClick={() => navigate(`/events/${id}`)}>
            ← Back to Event
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    Br {(stats?.revenue_etb || 0).toFixed(2)}
                  </p>
                </div>
                <Banknote className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tickets Sold</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.sold || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Checked In */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.checked_in || 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Occupancy */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {occupancyPercent}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {occupied} / {capacity}
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Types Breakdown */}
        {stats?.by_ticket_type && stats?.by_ticket_type.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Ticket Types Breakdown</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.by_ticket_type.map((type: any, index: number) => {
                  const soldPercent =
                    type.quantity_total > 0
                      ? ((type.quantity_sold / type.quantity_total) * 100).toFixed(0)
                      : 0
                  return (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600">Br {type.price_etb}</p>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {type.quantity_sold} / {type.quantity_total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${soldPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{soldPercent}% sold</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
