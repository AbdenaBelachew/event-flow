import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { authAPI } from '../lib/api'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Building2, User, Calendar, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    company_name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    admin_name: '',
    admin_email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (e.target.name === 'company_name') {
      setFormData((prev) => ({
        ...prev,
        company_name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      }))
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.registerCompany({
        company_name: formData.company_name,
        slug: formData.slug,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        password: formData.password,
      })
      const { token, user, company } = response.data
      login(token, user, company)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    'Create unlimited events',
    'Professional ticket sales',
    'Real-time analytics',
    'Mobile check-in app',
    '24/7 support included'
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-brand-50 to-purple-50">
        {/* Animated background blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-300/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-100/30 rounded-full blur-2xl animate-pulse-soft" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* Main content */}
      <div className="relative">
        <div className="section py-8 sm:py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            {/* Logo */}
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lift">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-300 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-brand-800" />
              </div>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand-600 via-brand-600 to-purple-600 bg-clip-text text-transparent mb-3 tracking-tight">
              Join EventFlow
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Create your account and start building amazing events that bring people together
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            {/* Left sidebar - Benefits */}
            <div className="lg:order-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="surface-card p-6 sticky top-6">
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-4">
                  What's included
                </h3>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${0.2 + index * 0.05}s` }}>
                      <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0" />
                      <span className="text-sm text-slate-600 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-brand-50 border border-brand-200">
                  <p className="text-sm font-semibold text-brand-800 mb-1">Free for 30 days</p>
                  <p className="text-xs text-brand-700">No credit card required to start</p>
                </div>
              </div>
            </div>

            {/* Main form */}
            <div className="lg:col-span-2 lg:order-2 animate-scale-in">
              {error && (
                <Alert 
                  type="error" 
                  message={error} 
                  onClose={() => setError('')} 
                  className="mb-6 animate-scale-in" 
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company section */}
                <section className="surface-card p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">Company Information</h2>
                      <p className="text-xs text-slate-500">Tell us about your organization</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Company name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      placeholder="My Event Company"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <Input
                      label="URL slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      disabled
                      helperText="This will be your unique URL"
                      className="bg-slate-50"
                    />
                    <Input
                      label="Contact email"
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      required
                      placeholder="contact@company.com"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <Input
                      label="Contact phone"
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </section>

                {/* Admin section */}
                <section className="surface-card p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">Admin Account</h2>
                      <p className="text-xs text-slate-500">Your personal login credentials</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full name"
                      name="admin_name"
                      value={formData.admin_name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <Input
                      label="Email address"
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleChange}
                      required
                      placeholder="admin@company.com"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a strong password"
                      helperText="Minimum 8 characters"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <Input
                      label="Confirm password"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Repeat your password"
                      className="transition-all duration-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </section>

                {/* Submit button */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={loading}
                    disabled={
                      !formData.company_name ||
                      !formData.admin_name ||
                      !formData.admin_email ||
                      !formData.password ||
                      !formData.confirmPassword
                    }
                    className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-lift transition-all duration-200 group"
                  >
                    {loading ? (
                      'Creating your account...'
                    ) : (
                      <>
                        Create account & get started
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  {/* Terms */}
                  <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-brand-600 hover:text-brand-700 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-brand-600 hover:text-brand-700 font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Sign in link */}
          <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-brand-600 hover:text-brand-700 font-semibold transition-colors inline-flex items-center gap-1 group"
              >
                Sign in here
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
