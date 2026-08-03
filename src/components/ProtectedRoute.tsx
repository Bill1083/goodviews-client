import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, isLoading, aal } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // An enrolled MFA factor hasn't been challenged yet this session — finish that first.
  if (aal.current && aal.next && aal.current !== aal.next) {
    return <Navigate to="/mfa-challenge" replace />
  }

  return <>{children}</>
}
