// LoginPage.tsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { authAPI } from '../lib/api'
import { homePath } from '../lib/event-access'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Calendar, ArrowRight, Leaf } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(
        formData.email,
        formData.password
      )

      const { token, user, company } = response.data

      login(token, user, company)
      navigate(homePath(user), { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200">

      {/* Background Blobs */}
      <div className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full bg-emerald-400/30 blur-[130px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-green-500/20 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/20 blur-[100px]" />

      {/* Pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(16 185 129) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Card */}
          <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(16,185,129,0.18)] p-8">

            {/* Logo */}
            <div className="text-center mb-8">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-300/50">

                <Calendar className="h-9 w-9 text-white" />

              </div>

              <div className="mt-5 flex items-center justify-center gap-2">

                <Leaf className="h-5 w-5 text-emerald-600" />

                <span className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">
                  Event Management
                </span>

              </div>

           

            </div>

            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
                className="mb-5"
              />
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Button
                type="submit"
                fullWidth
                isLoading={loading}
                className="rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 py-3 text-white transition-all duration-300 hover:scale-[1.02] hover:from-emerald-700 hover:to-green-800 shadow-lg shadow-emerald-300/40"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Organizer account?
              </p>

              <Link
                to="/register"
                className="mt-2 inline-block font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                Create an account
              </Link>

            </div>

          </div>

        
        </div>

      </div>
    </div>
  )
}