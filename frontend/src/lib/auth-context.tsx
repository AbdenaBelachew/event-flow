import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { clearAppCache } from './queryClient'

export interface User {
  id: string
  company_id: string
  full_name: string
  email: string
  role: 'super_admin' | 'company_admin' | 'event_staff'
  assigned_event_id?: string | null
}

export interface Company {
  id: string
  name: string
  slug: string
  contact_email: string
  contact_phone?: string
  logo_url?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  company: Company | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User, company?: Company) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearSessionStorage() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('company')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedCompany = localStorage.getItem('company')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        if (storedCompany) {
          setCompany(JSON.parse(storedCompany))
        }
      } catch (err) {
        console.error('Failed to restore session:', err)
        clearSessionStorage()
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User, newCompany?: Company) => {
    // Wipe previous account's cached queries before switching session
    clearAppCache()

    setToken(newToken)
    setUser(newUser)
    setCompany(newCompany ?? null)

    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    if (newCompany) {
      localStorage.setItem('company', JSON.stringify(newCompany))
    } else {
      localStorage.removeItem('company')
    }
  }

  const logout = () => {
    clearAppCache()
    setToken(null)
    setUser(null)
    setCompany(null)
    clearSessionStorage()
  }

  const value: AuthContextType = {
    user,
    company,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
