import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, isLoading, aal, trustedDevice, trustedDeviceChecked } = useAuthStore()

  const mfaOutstanding = Boolean(aal.current && aal.next && aal.current !== aal.next)

  if (isLoading || (mfaOutstanding && !trustedDeviceChecked)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  // An enrolled MFA factor hasn't been challenged yet this session — finish
  // that first, unless this browser was already remembered as trusted.
  if (mfaOutstanding && !trustedDevice) {
    return <Navigate to="/mfa-challenge" replace />
  }

  return <>{children}</>
}
