import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Link2, Copy, Check, ExternalLink } from 'lucide-react'
import { eventsAPI } from '../lib/api'
import { slugify } from '../lib/slug'
import { cn } from '../lib/cn'

export default function EventLinkWell() {
  const params = useParams<{ id?: string }>()
  const location = useLocation()
  const [copied, setCopied] = useState(false)

  const eventId = params.id
  const isEventRoute =
    !!eventId && /^\/events\/[^/]+(\/.*)?$/.test(location.pathname)

  if (!isEventRoute) return null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', eventId, 'linkWell'],
    queryFn: () => eventsAPI.getEvent(eventId!).then((res) => res.data.event),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading || isError || !data?.title) {
    return (
      <div className="bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="h-4 w-64 max-w-full rounded bg-slate-200/60 animate-shimmer" />
        </div>
      </div>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareLink = `${origin}/browse?event=${slugify(data.title)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareLink
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="bg-brand-50/60 border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-brand-700 flex-shrink-0">
          <Link2 className="w-3.5 h-3.5" />
          Public link
        </div>

        <a
          href={shareLink}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-w-0 text-sm font-mono text-brand-800 hover:text-brand-900 truncate"
          title={shareLink}
        >
          {shareLink}
        </a>

        <a
          href={shareLink}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 px-2 py-1 rounded-md hover:bg-white/60 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </a>

        <button
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition',
            copied
              ? 'text-brand-700 bg-brand-50 border-brand-200'
              : 'text-brand-700 bg-white border-brand-200 hover:border-brand-300'
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
