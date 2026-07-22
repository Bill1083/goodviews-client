import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import PrimaryButton from '../../components/PrimaryButton'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 border border-teal/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-light">Check your inbox</h1>
          <p className="text-sm text-gray-muted">
            If an account exists for{' '}
            <span className="text-gray-lighter font-medium">{email}</span>
            , you'll receive a password reset link shortly.
          </p>
          <Link
            to="/auth"
            className="mt-2 text-sm font-medium text-teal hover:text-teal-light transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-light">Forgot your password?</h1>
        <p className="mb-6 text-sm text-gray-muted">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-gray-muted uppercase tracking-wide"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p className="rounded-card bg-pink-brand/10 border border-pink-brand/30 px-3 py-2 text-sm text-pink-brand">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" isLoading={isLoading} className="w-full">
            Send Reset Link
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-muted">
          <Link to="/auth" className="text-teal hover:text-teal-light font-medium">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
