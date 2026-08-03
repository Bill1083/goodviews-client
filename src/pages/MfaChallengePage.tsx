import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabaseClient'
import { getVerifiedTotpFactorId } from '../utils/mfa'
import PrimaryButton from '../components/PrimaryButton'

export default function MfaChallengePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Someone with no session at all shouldn't land here — send them to log in properly.
  if (!user) return <Navigate to="/auth" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const factorId = await getVerifiedTotpFactorId()
      if (!factorId) {
        setError('No authenticator found on this account.')
        return
      }
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (verifyError) {
        setError(verifyError.message)
        return
      }
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="panel-card dialog-scale-in flex w-full max-w-sm flex-col gap-4 p-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-lighter">Two-Factor Verification</h1>
          <p className="mt-1 text-sm text-gray-muted">Enter the 6-digit code from your authenticator app.</p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="input-base text-center text-lg tracking-[0.3em]"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton type="submit" isLoading={loading} disabled={code.length !== 6}>
          Verify
        </PrimaryButton>
      </form>
    </div>
  )
}
