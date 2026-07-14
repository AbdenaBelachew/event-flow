import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import {
  Menu,
  X,
  LogOut,
  Plus,
  ChevronDown,
  Compass,
  LogIn,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'
import Button from './Button'

interface NavbarProps {
  minimal?: boolean
  forcePublic?: boolean
}

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const PUBLIC_NAV: NavItem[] = [
  { to: '/browse', label: 'Discover' },
]

const PROTECTED_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true },
 
]

export default function Navbar({ minimal = false, forcePublic = false }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const showAuthMenu = isAuthenticated && !forcePublic

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/80 backdrop-blur-lg transition-shadow duration-200',
        scrolled && 'shadow-sm border-b border-slate-200/60'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <span className="font-display font-semibold text-slate-900 text-[15px] tracking-tight">
                EventFlow
              </span>
            </NavLink>

        
          </div>

          {!minimal && (
            <div className="hidden md:flex items-center gap-2">
              {showAuthMenu ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/events/create')}
                  >
                    New event
                  </Button>

                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-haspopup="menu"
                      aria-expanded={profileMenuOpen}
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium text-xs">
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-slate-400 transition-transform',
                          profileMenuOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lift z-50 overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.full_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          <ProfileMenuItem
                            label="Dashboard"
                            onClick={() => navigate('/dashboard')}
                          />
                          <ProfileMenuItem
                            label="Create event"
                            onClick={() => navigate('/events/create')}
                          />
                          <ProfileMenuItem
                            label="Discover"
                            onClick={() => navigate('/browse')}
                          />
                        </div>

                        <div className="border-t border-slate-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/login')}
                  >
                    Log in
                  </Button>
                  <Button size="sm" onClick={() => navigate('/register')}>
                    Get started
                  </Button>
                </>
              )}
            </div>
          )}

          {!minimal && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {!minimal && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <NavLink
            to="/browse"
            className={({ isActive }) =>
              cn(
                'block px-3 py-2 text-sm font-medium rounded-lg transition',
                isActive
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-slate-700 hover:bg-slate-100'
              )
            }
          >
            Discover
          </NavLink>
          {showAuthMenu && (
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2 text-sm font-medium rounded-lg transition',
                  isActive
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-700 hover:bg-slate-100'
                )
              }
            >
              Dashboard
            </NavLink>
          )}

          {showAuthMenu ? (
            <>
              <button
                onClick={() => navigate('/events/create')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New event
              </button>
              <div className="border-t border-slate-100 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-center"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-3 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition text-center"
              >
                Get started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function ProfileMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
    >
      {label}
    </button>
  )
}
