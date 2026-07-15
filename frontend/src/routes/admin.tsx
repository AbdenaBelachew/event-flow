import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth-context'
import { adminAPI } from '../lib/api'
import { homePath, isSystemOwner } from '../lib/event-access'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Alert from '../components/Alert'
import Input from '../components/Input'
import {
  Calendar,
  CreditCard,
  Plus,
  X,
  Search,
  Eye,
  Shield,
  Lock,
  Unlock,
  Ticket,
  Banknote,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/cn'

type Tab = 'overview' | 'companies' | 'users' | 'events'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'published':
      return 'success' as const
    case 'draft':
      return 'neutral' as const
    case 'sold_out':
      return 'danger' as const
    default:
      return 'warning' as const
  }
}

function formatEtb(amount: number | string | null | undefined) {
  const n = Number(amount || 0)
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`
}

function roleLabel(role: string) {
  switch (role) {
    case 'super_admin':
      return 'System owner'
    case 'company_admin':
      return 'Organizer'
    case 'event_staff':
      return 'Door staff'
    default:
      return role
  }
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [formError, setFormError] = useState('')

  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    admin_name: '',
    admin_email: '',
    password: '',
  })

  const [userForm, setUserForm] = useState({
    company_id: '',
    full_name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    if (user && !isSystemOwner(user)) {
      navigate(homePath(user), { replace: true })
    }
  }, [user, navigate])

  const overviewQ = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminAPI.overview().then((r) => r.data.overview),
    enabled: isSystemOwner(user),
  })

  const companiesQ = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminAPI.listCompanies().then((r) => r.data.companies),
    enabled: isSystemOwner(user) && (tab === 'companies' || tab === 'users' || showUserForm),
  })

  const usersQ = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.listUsers().then((r) => r.data.users),
    enabled: isSystemOwner(user) && tab === 'users',
  })

  const eventsQ = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => adminAPI.listEvents().then((r) => r.data.events),
    enabled: isSystemOwner(user) && tab === 'events',
  })

  const createCompany = useMutation({
    mutationFn: () => adminAPI.createCompany(companyForm),
    onSuccess: () => {
      setShowCompanyForm(false)
      setFormError('')
      setCompanyForm({
        company_name: '',
        slug: '',
        contact_email: '',
        contact_phone: '',
        admin_name: '',
        admin_email: '',
        password: '',
      })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create company')
    },
  })

  const createUser = useMutation({
    mutationFn: () => adminAPI.createUser(userForm),
    onSuccess: () => {
      setShowUserForm(false)
      setFormError('')
      setUserForm({ company_id: '', full_name: '', email: '', password: '' })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create user')
    },
  })

  const lockUser = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      adminAPI.setUserLocked(id, locked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  const lockEvent = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      adminAPI.setEventLocked(id, locked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  if (!isSystemOwner(user)) return null

  const overview = overviewQ.data
  const companies = companiesQ.data || []
  const users = usersQ.data || []
  const events = eventsQ.data || []
  const q = search.toLowerCase()

  const filteredCompanies = companies.filter(
    (c: any) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.contact_email.toLowerCase().includes(q)
  )

  const filteredUsers = users.filter(
    (u: any) =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q)
  )

  const filteredEvents = events.filter(
    (e: any) =>
      e.title.toLowerCase().includes(q) ||
      (e.company_name || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q)
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'companies', label: 'Companies' },
    { id: 'users', label: 'Users' },
    { id: 'events', label: 'Manage events' },
  ]

  function submitCompany(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    createCompany.mutate()
  }

  function submitUser(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    createUser.mutate()
  }

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-bg-soft" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" aria-hidden />

      <header className="relative section pt-6 sm:pt-8 pb-5 sm:pb-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              System owner
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold text-slate-900 tracking-tight">
              Platform admin
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
              Manage companies, organizers, and events across EventFlow
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {tab === 'companies' && (
              <Button
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setFormError('')
                  setShowCompanyForm(true)
                }}
                className="w-full sm:w-auto"
              >
                New company
              </Button>
            )}
            {tab === 'users' && (
              <Button
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setFormError('')
                  setShowUserForm(true)
                }}
                className="w-full sm:w-auto"
              >
                New organizer
              </Button>
            )}
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200/80 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setSearch('')
              }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="relative section pb-20 sm:pb-16 space-y-5">
        {tab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
            <StatCard
              label="Tickets sold"
              value={overview?.tickets_sold ?? '—'}
              icon={<Ticket className="w-4 h-4" />}
            />
            <StatCard
              label="Platform revenue"
              value={
                overview?.revenue_etb != null
                  ? formatEtb(overview.revenue_etb)
                  : '—'
              }
              icon={<Banknote className="w-4 h-4" />}
              accent="text-emerald-700"
              iconBg="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              label="Events"
              value={overview?.events ?? '—'}
              icon={<Calendar className="w-4 h-4" />}
              accent="text-brand-700"
              iconBg="bg-brand-50 text-brand-700"
            />
            <StatCard
              label="Pending payments"
              value={overview?.pending_payments ?? '—'}
              icon={<CreditCard className="w-4 h-4" />}
              accent="text-amber-600"
              iconBg="bg-amber-50 text-amber-600"
            />
            <div className="col-span-2 lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <MiniStat label="Companies" value={overview?.companies ?? '—'} />
              <MiniStat label="Users" value={overview?.users ?? '—'} />
              <MiniStat label="Organizers" value={overview?.company_admins ?? '—'} />
              <MiniStat label="Published events" value={overview?.published_events ?? '—'} />
              <MiniStat label="Locked events" value={overview?.locked_events ?? '—'} />
            </div>
          </div>
        )}

        {tab !== 'overview' && (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={
                tab === 'companies'
                  ? 'Search companies…'
                  : tab === 'users'
                    ? 'Search users…'
                    : 'Search events…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10 h-11"
            />
          </div>
        )}

        {tab === 'companies' && (
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden">
            {companiesQ.isLoading ? (
              <LoadingRows />
            ) : filteredCompanies.length === 0 ? (
              <EmptyState message="No companies yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">Contact</th>
                      <th className="px-4 py-3 font-semibold">Events</th>
                      <th className="px-4 py-3 font-semibold">Users</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((c: any) => (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.slug}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {c.contact_email}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{c.event_count}</td>
                        <td className="px-4 py-3 text-slate-700">{c.user_count}</td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {format(new Date(c.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden">
            {usersQ.isLoading ? (
              <LoadingRows />
            ) : filteredUsers.length === 0 ? (
              <EmptyState message="No users found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">Company</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: any) => (
                      <tr
                        key={u.id}
                        className={cn(
                          'border-b border-slate-100 last:border-0 hover:bg-slate-50/60',
                          u.is_locked && 'bg-red-50/40'
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              u.role === 'super_admin'
                                ? 'success'
                                : u.role === 'company_admin'
                                  ? 'neutral'
                                  : 'warning'
                            }
                          >
                            {roleLabel(u.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {u.company_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.is_locked ? (
                            <Badge variant="danger">Locked</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== 'super_admin' && u.id !== user?.id && (
                            <button
                              type="button"
                              disabled={lockUser.isPending}
                              onClick={() =>
                                lockUser.mutate({ id: u.id, locked: !u.is_locked })
                              }
                              className={cn(
                                'inline-flex items-center gap-1 text-sm font-medium',
                                u.is_locked
                                  ? 'text-brand-700 hover:text-brand-900'
                                  : 'text-red-600 hover:text-red-800'
                              )}
                            >
                              {u.is_locked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Unlock
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  Lock
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden">
            {eventsQ.isLoading ? (
              <LoadingRows />
            ) : filteredEvents.length === 0 ? (
              <EmptyState message="No events yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">Company</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Tickets sold</th>
                      <th className="px-4 py-3 font-semibold">Revenue</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e: any) => (
                      <tr
                        key={e.id}
                        className={cn(
                          'border-b border-slate-100 last:border-0 hover:bg-slate-50/60',
                          e.is_locked && 'bg-red-50/40'
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{e.title}</p>
                          <p className="text-xs text-slate-400 sm:hidden">{e.company_name}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {e.company_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={statusBadgeVariant(e.status)}>
                              {e.status.replace('_', ' ')}
                            </Badge>
                            {e.is_locked && <Badge variant="danger">Locked</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium tabular-nums">
                          {e.tickets_sold ?? 0}
                          <span className="text-xs font-normal text-slate-400">
                            {' '}
                            / {e.capacity ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold tabular-nums">
                          {formatEtb(e.revenue_etb)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/events/${e.id}`)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Open
                            </button>
                            <button
                              type="button"
                              disabled={lockEvent.isPending}
                              onClick={() =>
                                lockEvent.mutate({ id: e.id, locked: !e.is_locked })
                              }
                              className={cn(
                                'inline-flex items-center gap-1 text-sm font-medium',
                                e.is_locked
                                  ? 'text-brand-700 hover:text-brand-900'
                                  : 'text-red-600 hover:text-red-800'
                              )}
                            >
                              {e.is_locked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Unlock
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  Lock
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create company modal */}
      {showCompanyForm && (
        <Modal title="Create company" onClose={() => setShowCompanyForm(false)}>
          {formError && (
            <Alert type="error" message={formError} onClose={() => setFormError('')} className="mb-4" />
          )}
          <form onSubmit={submitCompany} className="space-y-4">
            <Input
              label="Company name"
              required
              value={companyForm.company_name}
              onChange={(e) => {
                const name = e.target.value
                setCompanyForm((f) => {
                  const autoSlug = !f.slug || f.slug === slugify(f.company_name)
                  return {
                    ...f,
                    company_name: name,
                    slug: autoSlug ? slugify(name) : f.slug,
                  }
                })
              }}
            />
            <Input
              label="Slug"
              required
              value={companyForm.slug}
              onChange={(e) => setCompanyForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
            />
            <Input
              label="Contact email"
              type="email"
              required
              value={companyForm.contact_email}
              onChange={(e) => setCompanyForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
            <Input
              label="Contact phone"
              value={companyForm.contact_phone}
              onChange={(e) => setCompanyForm((f) => ({ ...f, contact_phone: e.target.value }))}
            />
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                First organizer account
              </p>
              <div className="space-y-4">
                <Input
                  label="Admin name"
                  required
                  value={companyForm.admin_name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, admin_name: e.target.value }))}
                />
                <Input
                  label="Admin email"
                  type="email"
                  required
                  value={companyForm.admin_email}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, admin_email: e.target.value }))}
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={8}
                  value={companyForm.password}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowCompanyForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={createCompany.isPending} className="flex-1">
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create organizer modal */}
      {showUserForm && (
        <Modal title="Add organizer" onClose={() => setShowUserForm(false)}>
          {formError && (
            <Alert type="error" message={formError} onClose={() => setFormError('')} className="mb-4" />
          )}
          <form onSubmit={submitUser} className="space-y-4">
            <div className="flex flex-col">
              <label className="label-base">
                Company <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                required
                className="input-base h-11"
                value={userForm.company_id}
                onChange={(e) => setUserForm((f) => ({ ...f, company_id: e.target.value }))}
              >
                <option value="">Select company…</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Full name"
              required
              value={userForm.full_name}
              onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={userForm.password}
              onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowUserForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={createUser.isPending} className="flex-1">
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
  iconBg,
}: {
  label: string
  value: string | number
  icon: ReactNode
  accent?: string
  iconBg?: string
}) {
  return (
    <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn('p-1.5 rounded-lg', iconBg || 'bg-slate-100 text-slate-500')}>
          {icon}
        </div>
      </div>
      <p className={cn('font-display text-2xl font-semibold text-slate-900', accent)}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/70 border border-slate-200/60 rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center text-sm text-slate-500">{message}</div>
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
