import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import Button from '../components/Button'
import Alert from '../components/Alert'
import {
  Calendar,
  MapPin,
  X,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Type,
  AlignLeft,
} from 'lucide-react'

// ---- Helpers ----
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---- Luma-style "meta row" — clickable pill that opens an editor ----
interface MetaRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  placeholder?: string
  onClick: () => void
  error?: boolean
  multiline?: boolean
}

function MetaRow({ icon, label, value, placeholder, onClick, error, multiline }: MetaRowProps) {
  const hasValue = value !== null && value !== undefined && value !== ''
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left',
        'border transition-all duration-150',
        'bg-white/60 hover:bg-white border-slate-200/70',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
        error && 'border-red-300 bg-red-50/50'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand-100 group-hover:text-brand-700 text-slate-500 flex items-center justify-center flex-shrink-0 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            'text-sm leading-snug truncate',
            multiline && 'whitespace-normal',
            hasValue ? 'text-slate-900 font-medium' : 'text-slate-400'
          )}
        >
          {hasValue ? value : placeholder || 'Add'}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition" />
    </button>
  )
}

// ---- Inline editor row (the "expanded" state of a meta row) ----
interface EditorRowProps {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}

function EditorRow({ title, description, onClose, children }: EditorRowProps) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white shadow-lg shadow-brand-500/5 overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ---- Tiny input that fits the Luma meta-row editor style ----
function InlineInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={cn(
        'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white',
        'placeholder:text-slate-400 text-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 transition',
        className
      )}
    />
  )
}

function InlineTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 transition resize-none"
    />
  )
}

// ---- Field that opens a popover (like Luma's date pickers) ----
// Implemented inline using a full-width popover rendered in place.

type FieldKey = 'title' | 'description' | 'when' | 'where' | 'cover' | null

export default function CreateEventPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [openField, setOpenField] = useState<FieldKey>(null)
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
      setSuccess('Event created!')
      setTimeout(() => navigate(`/events/${response.data.event.id}/edit`), 700)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create event. Please try again.')
    },
  })

  const update = (patch: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...patch }))

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      update({ cover_image_url: result })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    update({ cover_image_url: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.title || !formData.event_start || !formData.event_end) {
      setError('Please add a title and event start/end to continue.')
      return
    }
    if (new Date(formData.sales_start) >= new Date(formData.sales_end)) {
      setError('Sales start must be before sales end.')
      return
    }
    if (new Date(formData.event_start) >= new Date(formData.event_end)) {
      setError('Event start must be before event end.')
      return
    }
    createMutation.mutate(formData as any)
  }

  // Pretty-formatted values for display
  const whenValue =
    formData.event_start && formData.event_end
      ? `${new Date(formData.event_start).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })} – ${new Date(formData.event_end).toLocaleString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })}`
      : null

  const whereValue =
    formData.venue || formData.city
      ? [formData.venue, formData.city].filter(Boolean).join(' · ')
      : null

  return (
    <div className="min-h-screen gradient-bg-soft">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Page header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
         
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            {formData.title || (
              <span className="text-slate-400">Name your event</span>
            )}
          </h1>
          <p className="mt-3 text-slate-500 text-base max-w-md mx-auto">
            Fill in a few quick details below. You can change everything later.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert type="success" message={success} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* ---- COVER IMAGE (always shown — first impression) ---- */}
          {openField === 'cover' ? (
            <EditorRow
              title="Cover image"
              description="A nice photo helps people notice your event."
              onClose={() => setOpenField(null)}
            >
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative aspect-[16/8] rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden flex items-center justify-center',
                    imagePreview
                      ? 'border-brand-300'
                      : 'border-slate-200 hover:border-brand-300 bg-slate-50'
                  )}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="text-white text-sm font-medium">
                          Click to change
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-700">Click to upload</p>
                      <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
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
                <div className="flex gap-2">
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      size="sm"
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setOpenField(null)}
                    size="sm"
                    className="ml-auto bg-brand-600 hover:bg-brand-700"
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </EditorRow>
          ) : (
            <button
              type="button"
              onClick={() => setOpenField('cover')}
              className={cn(
                'group w-full rounded-2xl overflow-hidden text-left',
                'border border-slate-200/70 bg-white/60 hover:bg-white',
                'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400'
              )}
            >
              <div className="relative aspect-[16/8] bg-gradient-to-br from-brand-100 via-brand-50 to-brand-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-brand-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Add a cover image
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Recommended 16:8 ratio
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </button>
          )}

          {/* ---- META ROWS (Luma-style pill list) ---- */}
          {openField === 'title' ? (
            <EditorRow
              title="Event name"
              onClose={() => setOpenField(null)}
            >
              <InlineInput
                value={formData.title}
                onChange={(v) => update({ title: v })}
                placeholder="e.g. Addis Jazz Night 2026"
                autoFocus
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setOpenField(null)}
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700"
                  rightIcon={<Check className="w-4 h-4" />}
                >
                  Done
                </Button>
              </div>
            </EditorRow>
          ) : (
            <MetaRow
              icon={<Type className="w-4 h-4" />}
              label="Event name"
              value={formData.title}
              placeholder="Add the name of your event"
              onClick={() => setOpenField('title')}
              error={!formData.title}
            />
          )}

          {openField === 'description' ? (
            <EditorRow
              title="Description"
              description="A short summary to get people excited."
              onClose={() => setOpenField(null)}
            >
              <InlineTextarea
                value={formData.description}
                onChange={(v) => update({ description: v })}
                placeholder="What is this event about? Who's it for? Why does it matter?"
                rows={5}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setOpenField(null)}
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700"
                  rightIcon={<Check className="w-4 h-4" />}
                >
                  Done
                </Button>
              </div>
            </EditorRow>
          ) : (
            <MetaRow
              icon={<AlignLeft className="w-4 h-4" />}
              label="Description"
              value={formData.description ? truncate(formData.description, 60) : null}
              placeholder="Add a description"
              onClick={() => setOpenField('description')}
              multiline
            />
          )}

          {openField === 'when' ? (
            <EditorRow
              title="When"
              description="Pick the start and end time for your event."
              onClose={() => setOpenField(null)}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                      Starts
                    </label>
                    <InlineInput
                      type="datetime-local"
                      value={formData.event_start}
                      onChange={(v) => update({ event_start: v })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                      Ends
                    </label>
                    <InlineInput
                      type="datetime-local"
                      value={formData.event_end}
                      onChange={(v) => update({ event_end: v })}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                    Sales window
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InlineInput
                      type="datetime-local"
                      value={formData.sales_start}
                      onChange={(v) => update({ sales_start: v })}
                    />
                    <InlineInput
                      type="datetime-local"
                      value={formData.sales_end}
                      onChange={(v) => update({ sales_end: v })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    When tickets are available to buy.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setOpenField(null)}
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700"
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </EditorRow>
          ) : (
            <MetaRow
              icon={<Calendar className="w-4 h-4" />}
              label="Date & time"
              value={whenValue}
              placeholder="Add start and end time"
              onClick={() => setOpenField('when')}
              error={!formData.event_start}
            />
          )}

          {openField === 'where' ? (
            <EditorRow
              title="Where"
              description="Help guests find the venue."
              onClose={() => setOpenField(null)}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                    Venue
                  </label>
                  <InlineInput
                    value={formData.venue}
                    onChange={(v) => update({ venue: v })}
                    placeholder="e.g. Hyatt Regency, Friendship Hall"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                    City
                  </label>
                  <InlineInput
                    value={formData.city}
                    onChange={(v) => update({ city: v })}
                    placeholder="e.g. Addis Ababa"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setOpenField(null)}
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700"
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </EditorRow>
          ) : (
            <MetaRow
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={whereValue}
              placeholder="Add a venue or city"
              onClick={() => setOpenField('where')}
            />
          )}

          {/* ---- Submit (Luma-style pill CTA) ---- */}
          <div className="pt-4">
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {formData.title ? `Create "${truncate(formData.title, 30)}"` : 'Create event'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="block mx-auto mt-3 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Cancel and go back
            </button>
          </div>
        </form>

        {/* ---- Subtle helper footer ---- */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Your draft saves automatically. You can publish from the next page.
        </p>
      </div>
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <path d="M19 16L19.5 18.5L22 19L19.5 19.5L19 22L18.5 19.5L16 19L18.5 18.5L19 16Z" />
    </svg>
  )
}
