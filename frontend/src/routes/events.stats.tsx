import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Card, { CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Users, Banknote, TrendingUp, BarChart3, ArrowLeft, Sparkles, Ticket, CheckCircle2 } from 'lucide-react'
import { useRequireEventOwner } from '../lib/event-access'

export default function StatsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsAPI.getEvent(id!).then((res) => res.data.event),
    enabled: !!id,
  })
  const isOwner = useRequireEventOwner(event, eventLoading)

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['events', id, 'stats'],
    queryFn: async () => {
      const res = await eventsAPI.getStats(id!)
      return res.data
    },
    enabled: !!id && !!event && isOwner,
  })

  if (event && !isOwner) return null

  if (eventLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 via-brand-50 to-brand-50">
        <div className="text-center">
          <div className="relative w-20 h-20 xs:w-24 xs:h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-500 animate-pulse flex items-center justify-center">
              <BarChart3 className="w-8 h-8 xs:w-10 xs:h-10 text-white" />
            </div>
          </div>
          <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">Loading Statistics...</h2>
          <p className="text-sm xs:text-base text-gray-600">Fetching your event analytics</p>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" message="Failed to load event statistics" />
        <div className="mt-4">
          <Button onClick={() => navigate(`/events/${id}`)}>← Back to Event</Button>
        </div>
      </div>
    )
  }

  const capacity = stats?.capacity || 0
  const occupied = stats?.checked_in || 0
  const occupancyPercent = capacity > 0 ? ((occupied / capacity) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/40 to-brand-50/40">
      {/* Animated Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative max-w-[1800px] mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 xs:mb-7 sm:mb-8 md:mb-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 xs:gap-3 mb-2">
              <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-brand-900 to-brand-900 bg-clip-text text-transparent">
                  Event Statistics
                </h1>
              </div>
            </div>
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 flex items-center gap-2">

              Real-time analytics and insights for your event
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/events/${id}`)}
            className="self-start sm:self-auto text-sm xs:text-base shrink-0 shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xs:gap-5 sm:gap-6 md:gap-7">
          
          {/* LEFT COLUMN - Main KPIs */}
          <div className="lg:col-span-8 space-y-4 xs:space-y-5 sm:space-y-6">
            
            {/* Top Row - Revenue & Tickets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
              
              {/* Total Revenue */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-purple-600 to-brand-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>
                
                <CardContent className="py-6 xs:py-7 sm:py-8 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Banknote className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                        </div>
                        <p className="text-sm xs:text-base text-white/90 font-semibold">Total Revenue</p>
                      </div>
                      <p className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-white mt-2 tracking-tight">
                        Br {(stats?.revenue_etb || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs xs:text-sm text-white/80 mt-2">
                        From {stats?.sold || 0} tickets sold
                      </p>
                    </div>
                    <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 xs:w-10 xs:h-10 text-white/60" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets Sold */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-700 to-purple-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>
                
                <CardContent className="py-6 xs:py-7 sm:py-8 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Ticket className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                        </div>
                        <p className="text-sm xs:text-base text-white/90 font-semibold">Tickets Sold</p>
                      </div>
                      <p className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-white mt-2">
                        {stats?.sold || 0}
                      </p>
                      <p className="text-xs xs:text-sm text-white/80 mt-2">
                        Total tickets distributed
                      </p>
                    </div>
                    <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 xs:w-10 xs:h-10 text-white/60" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row - Checked In & Occupancy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
              
              {/* Checked In Card */}
              <Card className="border-2 border-brand-100 bg-white hover:border-brand-300 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="py-5 xs:py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle2 className="w-5 h-5 text-brand-600" />
                        </div>
                        <p className="text-xs xs:text-sm text-gray-600 font-semibold uppercase tracking-wide">Checked In</p>
                      </div>
                      <p className="text-3xl xs:text-4xl font-extrabold text-gray-900 mt-2">
                        {stats?.checked_in || 0}
                      </p>
                      <p className="text-xs xs:text-sm text-gray-500 mt-1">
                        Attendees present
                      </p>
                    </div>
                    <Users className="w-12 h-12 xs:w-14 xs:h-14 text-brand-600/20 group-hover:text-brand-600/30 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              {/* Occupancy Card */}
              <Card className="border-2 border-orange-100 bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="py-5 xs:py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-xs xs:text-sm text-gray-600 font-semibold uppercase tracking-wide">Occupancy</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl xs:text-4xl font-extrabold text-gray-900 mt-2">
                          {occupancyPercent}%
                        </p>
                        <p className="text-sm xs:text-base text-gray-500 font-medium">
                          ({occupied} / {capacity})
                        </p>
                      </div>
                      
                      {/* Occupancy Progress Bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${occupancyPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Types Breakdown */}
            {stats?.by_ticket_type && stats?.by_ticket_type.length > 0 && (
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardHeader className="px-4 xs:px-5 sm:px-6 py-4 xs:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-brand-50/30">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">
                          Ticket Types Performance
                        </h2>
                        <p className="text-xs xs:text-sm text-gray-600 mt-0.5">
                          Sales breakdown by ticket category
                        </p>
                      </div>
                    </div>
                    <span className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                      {stats.by_ticket_type.length} {stats.by_ticket_type.length === 1 ? 'Type' : 'Types'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 xs:px-5 sm:px-6 py-5 xs:py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5">
                    {stats.by_ticket_type.map((type: any, index: number) => {
                      const soldPercent =
                        type.quantity_total > 0
                          ? ((type.quantity_sold / type.quantity_total) * 100).toFixed(0)
                          : 0
                      const remaining = type.quantity_total - type.quantity_sold
                      const isAlmostSoldOut = remaining > 0 && remaining <= 10
                      
                      return (
                        <div 
                          key={index} 
                          className="relative p-4 xs:p-5 border-2 border-gray-100 rounded-xl hover:border-brand-200 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 group"
                        >
                          {/* Badge for almost sold out */}
                          {isAlmostSoldOut && (
                            <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] xs:text-xs font-bold rounded-full shadow-lg animate-pulse">
                              Almost Sold Out!
                            </div>
                          )}
                          
                          {remaining === 0 && (
                            <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-red-500 to-brand-500 text-white text-[10px] xs:text-xs font-bold rounded-full shadow-lg">
                              Sold Out
                            </div>
                          )}

                          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 xs:gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base xs:text-lg text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                {type.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm xs:text-base font-semibold text-brand-600">
                                  Br {type.price_etb}
                                </span>
                                <span className="text-xs text-gray-500">per ticket</span>
                              </div>
                            </div>
                            <div className="text-left xs:text-right shrink-0">
                              <div className="text-xl xs:text-2xl font-extrabold text-gray-900">
                                {type.quantity_sold}
                              </div>
                              <div className="text-[10px] xs:text-xs text-gray-500 font-medium">
                                of {type.quantity_total}
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar with Gradient */}
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2.5">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                remaining === 0 
                                  ? 'bg-gradient-to-r from-red-500 to-brand-500' 
                                  : isAlmostSoldOut 
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-r from-brand-500 to-brand-500'
                              }`}
                              style={{ width: `${soldPercent}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs xs:text-sm font-bold text-gray-900">
                              {soldPercent}% sold
                            </span>
                            <span className={`text-xs xs:text-sm font-semibold ${
                              remaining === 0 ? 'text-red-600' : isAlmostSoldOut ? 'text-amber-600' : 'text-brand-600'
                            }`}>
                              {remaining === 0 ? 'No tickets left' : `${remaining} remaining`}
                            </span>
                          </div>

                          {/* Revenue for this ticket type */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs xs:text-sm">
                              <span className="text-gray-600">Revenue from type:</span>
                              <span className="font-bold text-gray-900">
                                Br {(type.quantity_sold * type.price_etb).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN - Summary & Insights */}
          <div className="lg:col-span-4 space-y-4 xs:space-y-5 sm:space-y-6">
            
            {/* Quick Summary Card */}
            <Card className="border-0 bg-gradient-to-br from-purple-500 via-purple-700 to-purple-900 shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
              <CardHeader className="px-4 xs:px-5 py-4 xs:py-5 border-b border-white/20">
                <div className="flex items-center gap-2">
                  
                  <h3 className="text-lg xs:text-xl font-bold">Quick Summary</h3>
                </div>
              </CardHeader>
              <CardContent className="px-4 xs:px-5 py-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/20">
                    <span className="text-sm text-white/90">Total Tickets</span>
                    <span className="text-lg font-bold">{stats?.sold || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/20">
                    <span className="text-sm text-white/90">Revenue</span>
                    <span className="text-lg font-bold">Br {(stats?.revenue_etb || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/20">
                    <span className="text-sm text-white/90">Check-ins</span>
                    <span className="text-lg font-bold">{stats?.checked_in || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-white/90">Capacity</span>
                    <span className="text-lg font-bold">{capacity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="border-2 border-brand-100 bg-white hover:border-brand-300 hover:shadow-lg transition-all duration-300">
              <CardHeader className="px-4 xs:px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-brand-600" />
                  </div>
                  <h3 className="text-base xs:text-lg font-bold text-gray-900">Performance</h3>
                </div>
              </CardHeader>
              <CardContent className="px-4 xs:px-5 py-5">
                <div className="space-y-4">
                  {/* Avg Revenue per Ticket */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs xs:text-sm text-gray-600">Avg. Ticket Price</span>
                      <span className="text-sm xs:text-base font-bold text-gray-900">
                        Br {stats?.sold > 0 ? ((stats?.revenue_etb || 0) / stats.sold).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs xs:text-sm text-gray-600">Attendance Rate</span>
                      <span className="text-sm xs:text-base font-bold text-gray-900">
                        {stats?.sold > 0 ? (((stats?.checked_in || 0) / stats.sold) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-brand-500 h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${stats?.sold > 0 ? (((stats?.checked_in || 0) / stats.sold) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Capacity Usage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs xs:text-sm text-gray-600">Capacity Usage</span>
                      <span className="text-sm xs:text-base font-bold text-gray-900">
                        {occupancyPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${occupancyPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Badge */}
            <Card className="border-0 bg-gradient-to-r from-brand-50 to-brand-50 border-l-4 border-l-brand-500">
              <CardContent className="px-4 xs:px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Event is Live</p>
                    <p className="text-xs text-gray-600 mt-0.5">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
