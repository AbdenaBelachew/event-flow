import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import EventLinkWell from './EventLinkWell'

interface AppLayoutProps {
  children: ReactNode
}

const MINIMAL_NAVBAR_ROUTES = ['/login', '/register']
const PUBLIC_NAVBAR_ROUTES = ['/']

export default function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation()
  const minimal = MINIMAL_NAVBAR_ROUTES.includes(pathname)
  const forcePublic = PUBLIC_NAVBAR_ROUTES.includes(pathname)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar minimal={minimal} forcePublic={forcePublic} />
      {/* Sticky public-link banner — only renders on event-scoped routes */}
      <EventLinkWell />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
