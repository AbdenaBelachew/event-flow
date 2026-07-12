import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import {
  Ticket,
  BarChart3,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Calendar,
  CreditCard,
  QrCode,
} from 'lucide-react'
import Button from '../components/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">EventFlow</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-gray-700"
            >
              Login
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Sell Event Tickets Online
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              EventFlow makes it simple to create events, manage tickets, accept payments, and check
              in attendees—all in one place.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                size="lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/browse')}
                variant="secondary"
                size="lg"
                className="text-gray-700"
              >
                Browse Events
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ No credit card required • ✓ Free to start • ✓ Full-featured trial
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <Ticket className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Event Dashboard Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600">
              All the tools to run successful events, from creation to check-in
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Event Creation</h3>
              <p className="text-gray-600">
                Create events with all the details. Add multiple ticket types with custom pricing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accept Payments</h3>
              <p className="text-gray-600">
                Accept payments via Chapa, Telebirr, CBE Birr, and more. Fast, secure transactions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Check-in</h3>
              <p className="text-gray-600">
                Scan QR codes at your event. Fast validation, no double check-ins.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Track sales, revenue, attendance, and more in real-time dashboard.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Guest Checkout</h3>
              <p className="text-gray-600">
                Attendees can buy tickets without creating an account. Simple, fast checkout.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
              <p className="text-gray-600">
                Built for speed and reliability. Handle events of any size with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600">Get your event online in minutes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Event</h3>
            <p className="text-gray-600 text-sm">
              Set up your event with details, dates, and location
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Add Tickets</h3>
            <p className="text-gray-600 text-sm">
              Create ticket types with different prices and quantities
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Go Live</h3>
            <p className="text-gray-600 text-sm">
              Publish your event and start selling tickets
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
              4
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Check In</h3>
            <p className="text-gray-600 text-sm">
              Scan QR codes at your event for quick validation
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-gray-600">No hidden fees, transparent pricing</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Everything included</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">Free</span>
                <p className="text-gray-600 mt-2">to start • Always</p>
              </div>
              <ul className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited events</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited tickets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Real-time analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Multiple payment methods</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">QR code check-in</span>
                </li>
              </ul>
              <Button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                size="lg"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to sell tickets?</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Join thousands of event organizers using EventFlow to manage their events.
        </p>
        <Button
          onClick={() => navigate('/register')}
          className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
          size="lg"
        >
          Create Free Account
          <ArrowRight className="w-4 h-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">EventFlow</span>
            </div>
            <p className="text-gray-600 text-sm">
              &copy; 2026 EventFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
