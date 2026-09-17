import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabaseClient'
import { getStoredTrustedDeviceToken, getVerifiedTotpFactorId, storeTrustedDeviceToken } from '../utils/mfa'
import { createTrustedDevice, verifyTrustedDevice } from '../services/apiClient'
import PrimaryButton from '../components/PrimaryButton'

/** Temporary, opt-in via ?mfadebug=1 — reports why this device wasn't recognised,
 *  so a re-challenge can be traced to a missing token vs a rejected one. */
function TrustedDeviceDebug({ userId }: { userId: string }) {
  const [lines, setLines] = useState<string[]>(['checking…'])

  useEffect(() => {
    const token = getStoredTrustedDeviceToken(userId)
    const out = [
      `origin: ${window.location.origin}`,
      `account: ${userId.slice(0, 8)}…`,
      `stored token: ${token ? `${token.slice(0, 6)}… (${token.length} chars)` : 'NONE — nothing was saved on this device'}`,
    ]
    if (!token) {
      setLines(out)
      return
    }
    verifyTrustedDevice(token)
      .then((trusted) => setLines([...out, `server says: ${trusted ? 'TRUSTED (should not have been challenged)' : 'NOT trusted — token unknown or expired'}`]))
      .catch((e) => setLines([...out, `verify call failed: ${e?.response?.status ?? ''} ${e?.message ?? e}`]))
  }, [userId])

  return (
    <div className="rounded-lg border border-white/15 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-gray-lighter">
      {lines.map((l) => (
        <p key={l} className="break-all">{l}</p>
      ))}
    </div>
  )
}

export default function MfaChallengePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setTrustedDevice = useAuthStore((s) => s.setTrustedDevice)
  const [code, setCode] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
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
      if (rememberDevice) {
        try {
          const { token } = await createTrustedDevice()
          storeTrustedDeviceToken(user.id, token)
          setTrustedDevice(true)
        } catch {
          // Non-fatal — the MFA verify itself already succeeded, so just
          // fall back to challenging again next time.
        }
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
        {new URLSearchParams(window.location.search).get('mfadebug') === '1' && <TrustedDeviceDebug userId={user.id} />}
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
        <label className="flex items-center gap-2 text-sm text-gray-muted">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="h-4 w-4 rounded border-gray-500 accent-teal"
          />
          Remember this device for 30 days
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton type="submit" isLoading={loading} disabled={code.length !== 6}>
          Verify
        </PrimaryButton>
      </form>
    </div>
  )
}
