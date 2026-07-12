import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { Menu, X, LogOut, Plus, ChevronDown, Settings, Compass } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout, company } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Left: Logo */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-gray-900 text-base hidden sm:inline">EventFlow</span>
          </div>

          {/* Center: Navigation (Desktop) */}
         

          {/* Right: Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Create Event Button */}
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    {company && (
                      <p className="text-xs text-gray-600 mt-1">{company.name}</p>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                    >
                      <span>🎯</span>
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/browse')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Browse Events</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-2">
            <button
              onClick={() => {
                navigate('/dashboard')
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
            >
              🎯 Dashboard
            </button>

            <button
              onClick={() => {
                navigate('/browse')
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
            >
              🧭 Browse Events
            </button>

            <button
              onClick={() => {
                navigate('/events/create')
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-4 py-2 bg-gray-50 rounded-md mb-2">
                <p className="text-xs font-medium text-gray-600">Logged in as</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{user?.full_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
