import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Button from '../components/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="bg-slate-950 text-white">
      {/* ---------- HERO: one composition ---------- */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
        {/* Full-bleed atmosphere */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2400&q=80)',
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #4ade80 0%, transparent 45%), radial-gradient(circle at 80% 70%, #2dd4bf 0%, transparent 40%)',
          }}
          aria-hidden
        />

        <div className="relative flex-1 flex flex-col justify-end pb-16 sm:pb-20 pt-24">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <p
              className="font-display text-brand-400 text-sm sm:text-base font-semibold tracking-[0.2em] uppercase mb-5 animate-[fadeUp_0.7s_ease-out_both]"
              style={{ animationDelay: '0.05s' }}
            >
              EventFlow
            </p>

            <h1
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02] max-w-3xl mb-5 animate-[fadeUp_0.8s_ease-out_both]"
              style={{ animationDelay: '0.15s' }}
            >
              Tickets for nights worth showing up to.
            </h1>

            <p
              className="text-base sm:text-lg text-slate-300 max-w-xl mb-9 leading-relaxed animate-[fadeUp_0.8s_ease-out_both]"
              style={{ animationDelay: '0.28s' }}
            >
              Sell in birr. Pay with Telebirr, Chapa, or CBE. Scan at the door.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 animate-[fadeUp_0.8s_ease-out_both]"
              style={{ animationDelay: '0.4s' }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold shadow-lg shadow-brand-500/20"
              >
                Host an event
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/browse')}
                className="border-white/30 text-black hover:bg-green-500/10 hover:border-green-500/50"
              >
                Find tickets
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle bottom fade into next section */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
      </section>

      {/* ---------- ONE JOB: how it works ---------- */}
      <section className="relative bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Three steps. Then you&apos;re live.
          </h2>
          <p className="text-slate-400 max-w-lg mb-14">
            Built for organizers in Ethiopia — no spreadsheet, no waiting on a bank transfer.
          </p>

          <ol className="grid md:grid-cols-3 gap-10 md:gap-12">
            {[
              {
                n: '01',
                title: 'Publish',
                body: 'Add your night, ticket types, and a share link. Live in minutes.',
              },
              {
                n: '02',
                title: 'Get paid',
                body: 'Buyers pay on their phone. You approve the codes. Tickets unlock.',
              },
              {
                n: '03',
                title: 'Check in',
                body: 'Scan the QR on any phone at the door. No paper list.',
              },
            ].map((step) => (
              <li key={step.n} className="relative">
                <span className="font-display text-4xl font-bold text-brand-500/40 tabular-nums">
                  {step.n}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-slate-400 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Got something coming up?
            </h2>
            <p className="mt-2 text-brand-100 max-w-md">
              Make a page, share the link, fill the room.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-white text-brand-800 hover:bg-brand-50 font-semibold"
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/tickets')}
              className="border-white/40 text-black hover:bg-white/10"
            >
              Recover my tickets
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER (links live here, not in the header) ---------- */}
      <footer className="bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">E</span>
            </div>
            <span className="font-medium text-slate-300">EventFlow</span>
            <span className="text-slate-600">·</span>
            <span>Addis Ababa</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="hover:text-slate-200 transition-colors"
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="hover:text-slate-200 transition-colors"
            >
              My tickets
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hover:text-slate-200 transition-colors"
            >
              Log in
            </button>
            <a
              href="mailto:hello@eventflow.app"
              className="hover:text-slate-200 transition-colors"
            >
              hello@eventflow.app
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
