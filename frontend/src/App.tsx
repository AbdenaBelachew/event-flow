import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth-context'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Pages
import HomePage from './routes/index'
import LoginPage from './routes/login'
import RegisterPage from './routes/register'
import DashboardPage from './routes/dashboard'
import CreateEventPage from './routes/events.create'
import EventDetailPage from './routes/events.detail'
import EditEventPage from './routes/events.edit'
import CheckoutPage from './routes/events.checkout'
import ScannerPage from './routes/events.scanner'
import StatsPage from './routes/events.stats'
import OrderPage from './routes/orders.detail'
import BrowsePage from './routes/browse'
import PaymentCallbackPage from './routes/payment-callback'
import NotFoundPage from './routes/not-found'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/payment-callback" element={<PaymentCallbackPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events/create" element={<CreateEventPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/edit" element={<EditEventPage />} />
                <Route path="/events/:id/scanner" element={<ScannerPage />} />
                <Route path="/events/:id/stats" element={<StatsPage />} />
              </Route>

              {/* Public Checkout (not protected - guests can checkout) */}
              <Route path="/events/:id/checkout" element={<CheckoutPage />} />
              <Route path="/orders/:id" element={<OrderPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
