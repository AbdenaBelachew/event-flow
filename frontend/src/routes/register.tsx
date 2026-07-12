import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { authAPI } from '../lib/api'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { Building2, User } from 'lucide-react'

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
    let value = e.target.value
    // Auto-generate slug from company name
    if (e.target.name === 'company_name') {
      setFormData((prev) => ({
        ...prev,
        company_name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: value,
      }))
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
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 text-sm mt-1">Set up your company and admin account to get started</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Company Information</h2>
            </div>

            <p className="text-xs text-gray-600">Tell us about your organization</p>

            <Input
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              placeholder="My Event Company"
              className="bg-white"
            />

            <Input
              label="Company Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              disabled
              helperText="Auto-generated from company name"
              className="bg-gray-50"
            />

            <Input
              label="Contact Email"
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              required
              placeholder="contact@company.com"
              className="bg-white"
            />

            <Input
              label="Contact Phone"
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+251911234567"
              className="bg-white"
            />
          </div>

          {/* Right Column: Admin Account */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Admin Account</h2>
            </div>

            <p className="text-xs text-gray-600">Create your administrator account</p>

            <Input
              label="Full Name"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="bg-white"
            />

            <Input
              label="Email Address"
              type="email"
              name="admin_email"
              value={formData.admin_email}
              onChange={handleChange}
              required
              placeholder="admin@company.com"
              className="bg-white"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              helperText="Minimum 8 characters"
              className="bg-white"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="bg-white"
            />
          </div>
        </form>

        {/* Full Width Submit Button */}
        <div className="mt-6">
          <Button
            type="submit"
            onClick={handleSubmit}
            fullWidth
            isLoading={loading}
            disabled={
              !formData.company_name ||
              !formData.admin_name ||
              !formData.admin_email ||
              !formData.password ||
              !formData.confirmPassword
            }
            className="py-2"
          >
            Create Account
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
