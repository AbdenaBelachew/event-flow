import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Input, { TextArea } from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Card, { CardContent, CardHeader } from '../components/Card'
import { Upload, Calendar, MapPin, FileImage, Trash2, ChevronRight, Sparkles } from 'lucide-react'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    city: '',
    event_start: '',
    event_end: '',
    sales_start: '',
    sales_end: '',
    cover_image_url: '',
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.createEvent(data),
    onSuccess: (response) => {
      setSuccess('Event created successfully! Redirecting...')
      setTimeout(() => {
        navigate(`/events/${response.data.event.id}/edit`)
      }, 1000)
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || 'Failed to create event. Please try again.'
      )
    },
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreview(result)
        setFormData((prev) => ({
          ...prev,
          cover_image_url: result,
        }))
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setFileName('')
    setFormData((prev) => ({
      ...prev,
      cover_image_url: '',
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (new Date(formData.sales_start) >= new Date(formData.sales_end)) {
      setError('Sales start must be before sales end')
      return
    }

    if (new Date(formData.event_start) >= new Date(formData.event_end)) {
      setError('Event start must be before event end')
      return
    }

    if (new Date(formData.sales_end) > new Date(formData.event_end)) {
      setError('Sales end must be before or at event end')
      return
    }

    createMutation.mutate(formData as any)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 hover:opacity-80 transition"
            >
              <span>← Dashboard</span>
            </button>
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Create New Event</h1>
          <p className="text-blue-100 text-lg">Bring your amazing event to life with EventFlow</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {success && (
          <Alert type="success" message={success} className="mb-6" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Basics</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Tell us about your event</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <Input
                    label="Event Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Tech Summit 2026, Music Festival..."
                    className="text-lg"
                  />
                  <TextArea
                    label="Event Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell attendees what your event is about. Make it engaging and exciting!"
                    rows={5}
                    helperText="Be creative and descriptive"
                  />
                </CardContent>
              </Card>

              {/* Location Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Location</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Where will your event take place?</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Venue Name"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      placeholder="Convention Center, Hotel, Stadium..."
                      icon={<MapPin className="w-5 h-5" />}
                    />
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Addis Ababa, Dire Dawa..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time Section */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dates & Times</h2>
                  </div>
                  <p className="text-gray-600 mt-2">When will your event happen?</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span className="text-purple-600">📅</span>
                      <span>Event Schedule</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Event Start"
                        type="datetime-local"
                        name="event_start"
                        value={formData.event_start}
                        onChange={handleChange}
                        required
                        icon={<Calendar className="w-5 h-5" />}
                      />
                      <Input
                        label="Event End"
                        type="datetime-local"
                        name="event_end"
                        value={formData.event_end}
                        onChange={handleChange}
                        required
                        icon={<Calendar className="w-5 h-5" />}
                      />
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <span className="text-green-600">🎫</span>
                      <span>Sales Window</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Sales Start"
                        type="datetime-local"
                        name="sales_start"
                        value={formData.sales_start}
                        onChange={handleChange}
                        required
                        helperText="When do you want to open ticket sales?"
                      />
                      <Input
                        label="Sales End"
                        type="datetime-local"
                        name="sales_end"
                        value={formData.sales_end}
                        onChange={handleChange}
                        required
                        helperText="When will ticket sales close?"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  isLoading={createMutation.isPending}
                  disabled={!formData.title || !formData.event_start || !formData.event_end}
                  fullWidth
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Create Event</span>
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  fullWidth
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Image Upload Section */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-rose-50 border-b-2 border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Cover Image</h2>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-8">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900">{fileName}</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            fullWidth
                          >
                            Change Image
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage()
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                          <FileImage className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 justify-center text-xs text-gray-500">
                        <Upload className="w-4 h-4" />
                        <span>or drag and drop</span>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreview && (
                  <Alert
                    type="success"
                    message="✨ Image selected! It will be uploaded with your event."
                    className="bg-green-50 border-green-200"
                  />
                )}

                {!imagePreview && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      <strong>💡 Tip:</strong> Upload a high-quality image to make your event stand out to potential attendees!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-blue-500">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📝</div>
              <div>
                <h3 className="font-bold text-gray-900">Complete Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add all event information including title, description, and location
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-green-500">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🎨</div>
              <div>
                <h3 className="font-bold text-gray-900">Add Cover Image</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a beautiful cover image to attract attendees
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition border-l-4 border-purple-500">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🎫</div>
              <div>
                <h3 className="font-bold text-gray-900">Add Ticket Types</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create multiple ticket tiers and manage pricing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
