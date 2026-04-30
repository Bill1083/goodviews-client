import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import PrimaryButton from '../../components/PrimaryButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: trimmedUsername },
      },
    })

    setIsLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setRegistered(true)
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 border border-teal/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-light">Check your email</h1>
            <p className="text-sm text-gray-muted leading-relaxed">
              We've sent a verification link to <span className="text-teal font-medium">{email}</span>.
              Please verify your email and then come back to sign in.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-teal text-white hover:bg-teal-light transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-light">Create your account</h1>
        <p className="mb-6 text-sm text-gray-muted">
          Start tracking movies with GoodViews
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base"
              placeholder="filmbuff42"
              maxLength={50}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Email
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

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-card bg-pink-brand/10 border border-pink-brand/30 px-3 py-2 text-sm text-pink-brand">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" isLoading={isLoading} className="w-full">
            Create Account
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-teal hover:text-teal-light font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
