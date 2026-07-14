import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useEffect } from 'react'
import {
  Calendar,
  CreditCard,
  QrCode,
  BarChart3,
  ArrowRight,
  Check,
  Mail,
  Receipt,
  MapPin,
} from 'lucide-react'
import Button from '../components/Button'

// Honest numbers, not auto-generated. If you don't have these yet, drop them.
const STATS = [
  { value: 'Free', label: 'for your first 100 tickets per event' },
  { value: '3% + 10 birr', label: 'per paid ticket after that — that\'s it' },
  { value: 'Chapa · Telebirr · CBE', label: 'money goes straight to your account' },
]

const FEATURES = [
  {
    icon: Calendar,
    title: 'A page your attendees actually want to share',
    body: 'Photos, lineup, venue map, what to bring. Everything in one link, mobile-first by default.',
  },
  {
    icon: CreditCard,
    title: 'Payments people in Ethiopia already use',
    body: 'Chapa, Telebirr and CBE Birr at checkout. We don\'t hold your money — it lands in your account.',
  },
  {
    icon: QrCode,
    title: 'Check-in without the paper list',
    body: 'Every ticket has a unique QR. Open the scanner on any phone, point, done. Works offline for a moment if the venue\'s wifi is acting up.',
  },
  {
    icon: BarChart3,
    title: 'Know what\'s selling while it\'s selling',
    body: 'Live counts of tickets, revenue, and check-ins. No spreadsheets, no end-of-night reconciliation.',
  },
  {
    icon: Mail,
    title: 'Tickets in the inbox, not on a receipt printer',
    body: 'QR tickets get emailed the second payment clears. Resends, name changes, and cancellations are one click.',
  },
  {
    icon: Receipt,
    title: 'Bulk ticket actions when you need them',
    body: 'Comp a list of journalists, move a VIP to the front row, refund a typo — all from the same screen.',
  },
]

const FAQ = [
  {
    q: 'Do I need a registered company to use it?',
    a: 'No. Individuals running a fundraiser, a band, or a one-off meetup can all create events. You only need a payout method.',
  },
  {
    q: 'What about refunds?',
    a: 'You decide the refund window per event. The buyer gets a Telebirr/CBE reversal the same way they paid — no manual bank runs.',
  },
  {
    q: 'Can I sell tickets at the door?',
    a: 'Yes. Create a "door" ticket type and scan it like any other. It shows up in the same dashboard.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Fix: was calling navigate() during render. Move to effect.
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="bg-white text-slate-800">
      {/* ---------- HERO ---------- */}
      <section className="relative">
        <div className="section pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <p className="text-sm text-slate-500 mb-6">
                For people in Ethiopia running events people actually want to attend.
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-6">
                Sell tickets.
                <br />
                <span className="text-brand-600">Get paid in birr.</span>
                <br />
                Skip the spreadsheet.
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                EventFlow is a small tool for selling tickets to events in Ethiopia.
                Make a page, share a link, get money through Chapa or Telebirr, scan
                people in at the door. That&apos;s the whole thing.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={() => navigate(isAuthenticated ? '/events/create' : '/register')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isAuthenticated ? 'Create an event' : 'Make your first event'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/browse')}
                >
                  See what&apos;s on this week
                </Button>
              </div>

              <p className="text-sm text-slate-500">
                No card needed to start. You can run an entire event on the free
                tier and only pay when you start making real money.
              </p>
            </div>

            {/* Real product preview: a single event page, not a fake dashboard. */}
            <div className="lg:col-span-6 lg:pl-4">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
                <div className="aspect-[16/10] bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 relative">
                  <div className="absolute inset-0 flex items-end p-5">
                    <div className="bg-white/95 backdrop-blur rounded-lg px-3 py-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">Sat, Aug 16</span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span>Millennium Hall, Addis Ababa</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
                    ሙዚቃ ከአዲስ — A Night of New Sounds
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Six artists, one stage, two hours. Doors at 7.
                  </p>

                  <div className="space-y-3">
                    {[
                      { tier: 'Early bird', price: '350 ETB', left: '12 left' },
                      { tier: 'General', price: '500 ETB', left: null },
                      { tier: 'VIP (front rows)', price: '1,200 ETB', left: '4 left' },
                    ].map((t) => (
                      <div
                        key={t.tier}
                        className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{t.tier}</p>
                          {t.left && (
                            <p className="text-xs text-amber-700">{t.left}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-900">
                            {t.price}
                          </span>
                          <button
                            type="button"
                            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-3 py-1.5"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 mt-4">
                    Pay with Chapa · Telebirr · CBE Birr · cards
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- THE THREE THINGS ---------- */}
      <section className="border-y border-slate-200 bg-slate-50/60">
        <div className="section py-12">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                  {s.value}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section>
        <div className="section py-20 sm:py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              What you actually get
            </h2>
            <p className="text-lg text-slate-600">
              Not a 40-page feature list. Just the things that come up at every
              event we&apos;ve helped run.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border border-slate-200 rounded-2xl p-6 bg-white"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     

     
    

      {/* ---------- FAQ ---------- */}
      <section>
        <div className="section py-20 sm:py-24">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Questions we get a lot
            </h2>
          </div>
          <div className="max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
                  <span className="font-medium text-slate-900">{item.q}</span>
                  <span
                    aria-hidden
                    className="text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none mt-0.5"
                  >
                    +
                  </span>
                </summary>
                <p className="text-slate-600 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CLOSING CTA ---------- */}
      <section>
        <div className="section pb-20">
          <div className="border border-slate-200 rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Got an event coming up?
              </h2>
              <p className="text-slate-600">
                Make a page in about ten minutes. If you get stuck, write to us —
                a real person answers.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? '/events/create' : '/register')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isAuthenticated ? 'New event' : 'Get started'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/browse')}
                leftIcon={<MapPin className="w-4 h-4" />}
              >
                Browse events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-slate-200">
        <div className="section py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">E</span>
            </div>
            <span className="font-medium text-slate-700">EventFlow</span>
            <span className="text-slate-300">·</span>
            <span>Addis Ababa</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              onClick={() => navigate('/browse')}
              className="hover:text-slate-800 transition-colors"
            >
              Discover
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="hover:text-slate-800 transition-colors"
            >
              {isAuthenticated ? 'Dashboard' : 'Get started'}
            </button>
            <a href="mailto:hello@eventflow.app" className="hover:text-slate-800 transition-colors">
              hello@eventflow.app
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
