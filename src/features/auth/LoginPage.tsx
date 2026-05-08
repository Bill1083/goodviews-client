import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import PrimaryButton from '../../components/PrimaryButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      let email = login.trim()

      // If the user entered a username (no @), resolve it to an email first
      if (!email.includes('@')) {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/resolve-login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: email }),
          }
        )
        if (!res.ok) {
          setError('No account found with that username.')
          setIsLoading(false)
          return
        }
        const data = await res.json()
        email = data.email
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
      } else {
        navigate('/')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-light">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-muted">
          Sign in to your GoodViews account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="login" className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Email or Username
            </label>
            <input
              id="login"
              type="text"
              autoComplete="username email"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input-base"
              placeholder="you@example.com or username"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Sign In
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-teal hover:text-teal-light font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
