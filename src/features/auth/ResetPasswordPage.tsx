import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import PrimaryButton from '../../components/PrimaryButton'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    // Supabase JS v2 automatically exchanges the recovery token in the URL hash.
    // It fires PASSWORD_RECOVERY via onAuthStateChange once the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // The token may already have been exchanged before this component mounted,
    // so also check for an existing session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      }
    })

    // If neither fires within 5 seconds, the link is likely invalid or expired.
    const timer = setTimeout(() => {
      setInvalid((prev) => {
        if (!prev && !ready) return true
        return prev
      })
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      await supabase.auth.signOut()
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 border border-teal/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-teal-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-light">Your password has been reset!</h1>
          <p className="text-sm text-gray-muted">
            You can now sign in with your new password.
          </p>
          <Link
            to="/auth"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal/20 border border-teal/40 px-5 py-2 text-sm font-medium text-teal-light hover:bg-teal/30 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Invalid / expired link ───────────────────────────────────────────────────
  if (invalid && !ready) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-brand/10 border border-pink-brand/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-pink-brand"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-light">Link expired</h1>
          <p className="text-sm text-gray-muted">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-2 text-sm font-medium text-teal hover:text-teal-light transition-colors"
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  // ── Verifying token ──────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-gray-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          Verifying your reset link…
        </div>
      </div>
    )
  }

  // ── Password form ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-light">Reset your password</h1>
        <p className="mb-6 text-sm text-gray-muted">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-gray-muted uppercase tracking-wide"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirm"
              className="text-xs font-medium text-gray-muted uppercase tracking-wide"
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-card bg-pink-brand/10 border border-pink-brand/30 px-3 py-2 text-sm text-pink-brand">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" isLoading={isLoading} className="w-full">
            Set New Password
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
