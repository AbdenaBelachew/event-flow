// LoginPage.tsx
// NOTE: This is a starter rewritten template preserving your auth logic.
// Replace your existing file with this and continue customizing as needed.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { authAPI } from '../lib/api'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Calendar, Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login(formData.email, formData.password)
      const { token, user, company } = response.data
      login(token, user, company)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-brand-100 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-80 h-80 bg-brand-300/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-[140px]" />

      <div className="relative min-h-screen flex">
     

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Calendar className="text-white"/>
              </div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 mt-2">Sign in to continue.</p>
            </div>

            {error && <Alert type="error" message={error} onClose={()=>setError('')} className="mb-4"/>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
              <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />

              <Button type="submit" fullWidth isLoading={loading}
                className="bg-gradient-to-r from-brand-600 via-purple-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl py-3">
                {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4"/></>}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/register" className="text-brand-700 font-semibold hover:text-brand-800">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
