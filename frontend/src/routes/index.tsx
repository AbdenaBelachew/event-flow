import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { homePath } from '../lib/event-access'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Button from '../components/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return
    navigate(homePath(user), { replace: true })
  }, [isAuthenticated, user, navigate])

  return (
    <div className="bg-white text-slate-900">
      {/* ---------- HERO: one clean composition ---------- */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col border-b border-slate-200">
        <div className="flex-1 flex flex-col justify-end pb-14 sm:pb-20 pt-20 sm:pt-28">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p
                className="font-display text-brand-600 text-xs sm:text-sm font-bold tracking-[0.28em] uppercase mb-6 sm:mb-8 animate-[fadeUp_0.6s_ease-out_both]"
              >
                Event tickets · Ethiopia
              </p>

              <h1 className="font-display font-extrabold tracking-[-0.04em] leading-[0.9] mb-8 animate-[fadeUp_0.75s_ease-out_both]">
                <span className="block text-[clamp(3.5rem,14vw,9rem)] text-brand-600">
                  EventFlow
                </span>
              </h1>

              <p
                className="font-display text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-slate-800 max-w-xl leading-snug mb-4 animate-[fadeUp_0.8s_ease-out_both]"
                style={{ animationDelay: '0.1s' }}
              >
                Tickets for nights worth showing up to.
              </p>

              <p
                className="text-base sm:text-[17px] text-slate-500 max-w-md mb-10 leading-relaxed animate-[fadeUp_0.8s_ease-out_both]"
                style={{ animationDelay: '0.2s' }}
              >
                Sell in birr. Pay with Telebirr, Chapa, or CBE. Scan at the door.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3 animate-[fadeUp_0.8s_ease-out_both]"
                style={{ animationDelay: '0.3s' }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Host an event
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/browse')}
                >
                  Browse events
                </Button>
              </div>
            </div>
          </div>
        </div>

       
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="mb-14 sm:mb-16 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl md:text-[2.5rem] font-bold tracking-tight text-slate-900 mb-3 leading-tight">
              Three steps. Then you&apos;re live.
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Built for organizers in Ethiopia — no spreadsheet, no waiting on a bank transfer.
            </p>
          </div>

          <ol className="grid md:grid-cols-3 gap-0 md:gap-0 border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
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
            ].map((step, i) => (
              <li
                key={step.n}
                className="p-8 sm:p-10 animate-[fadeUp_0.65s_ease-out_both]"
                style={{ animationDelay: `${0.08 + i * 0.1}s` }}
              >
                <span className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 tabular-nums">
                  {step.n}
                </span>
                <h3 className="mt-5 font-display text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-slate-500 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- How to check your ticket ---------- */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="mb-14 sm:mb-16 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl md:text-[2.5rem] font-bold tracking-tight text-slate-900 mb-3 leading-tight">
              How to check your ticket
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Lost the PNG or closed the tab? Pull your tickets back in under a minute.
            </p>
          </div>

          <ol className="grid md:grid-cols-3 gap-0 border border-slate-200 bg-slate-50 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {[
              {
                n: '01',
                title: 'Open Find tickets',
                body: 'Go to My tickets — no account needed.',
              },
              {
                n: '02',
                title: 'Look it up',
                body: 'Use your order ID, ticket code, or the email and phone from checkout.',
              },
              {
                n: '03',
                title: 'Download again',
                body: 'Save the QR ticket to your phone and show it at the door.',
              },
            ].map((step, i) => (
              <li
                key={step.n}
                className="p-8 sm:p-10 animate-[fadeUp_0.65s_ease-out_both]"
                style={{ animationDelay: `${0.08 + i * 0.1}s` }}
              >
                <span className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 tabular-nums">
                  {step.n}
                </span>
                <h3 className="mt-5 font-display text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-slate-500 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/tickets')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Find my tickets
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- CTA — solid brand block ---------- */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="max-w-lg">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Got something coming up?
            </h2>
            <p className="mt-3 text-brand-100 text-base sm:text-lg leading-relaxed">
              Make a page, share the link, fill the room.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
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
              className="border-white/45 text-white hover:bg-white/10 bg-transparent"
            >
              Recover my tickets
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">E</span>
            </div>
            <span className="font-display font-semibold text-slate-800">EventFlow</span>
            <span className="text-slate-300">·</span>
            <span>Addis Ababa</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="hover:text-brand-700 transition-colors"
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="hover:text-brand-700 transition-colors"
            >
              My tickets
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hover:text-brand-700 transition-colors"
            >
              Log in
            </button>
            <a
              href="mailto:hello@eventflow.app"
              className="hover:text-brand-700 transition-colors"
            >
              hello@eventflow.app
            </a>
          </nav>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
