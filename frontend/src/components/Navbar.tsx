import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'
import Button from './Button'

interface NavbarProps {
  minimal?: boolean
  forcePublic?: boolean
}

/** Header is brand + account only — no Discover / My tickets / hamburger menus. */
export default function Navbar({ minimal = false, forcePublic = false }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const showAccount = isAuthenticated && !forcePublic && !minimal

  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setProfileOpen(false)
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
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="font-display font-semibold text-slate-900 text-[15px] tracking-tight">
              EventFlow
            </span>
          </NavLink>

          {!minimal && (
            <div className="flex items-center gap-2">
              {showAccount ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Account"
                    aria-expanded={profileOpen}
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium text-xs">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lift z-50 overflow-hidden py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/dashboard')
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          setProfileOpen(false)
                          navigate('/')
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                    Log in
                  </Button>
                  <Button size="sm" onClick={() => navigate('/register')}>
                    Get started
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
