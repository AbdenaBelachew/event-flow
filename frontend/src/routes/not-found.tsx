import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-display font-semibold text-slate-200 mb-4 select-none">404</p>
        <h1 className="text-lg font-medium text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-8">
          This page doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/')}>Home</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
