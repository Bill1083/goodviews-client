import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function AuthPage() {
  const navigate = useNavigate()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState<string | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })
    setLoginLoading(false)
    if (error) {
      setLoginError(error.message)
    } else {
      navigate('/')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    const trimmed = regUsername.trim()
    if (trimmed.length < 3) {
      setRegError('Username must be at least 3 characters.')
      return
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.')
      return
    }
    setRegLoading(true)
    const { error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: { data: { username: trimmed } },
    })
    setRegLoading(false)
    if (error) {
      setRegError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel — brand */}
      <div className="relative hidden lg:flex lg:w-[55%] items-center justify-center overflow-hidden">
        {/* Blue glow */}
        <div className="absolute inset-0 flex items-end justify-start pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-blue-brand/20 blur-[120px] translate-x-[-20%] translate-y-[10%]" />
        </div>
        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Film icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-gray-medium/40 bg-navy-card/60">
              <span className="text-4xl">🎬</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-5xl font-bold text-gray-lighter">
            <span>Good</span>
            <div className="flex h-10 w-10 items-center justify-center rounded bg-navy-card/60 border border-gray-medium/30 text-2xl">
              🎞
            </div>
            <span>Views</span>
          </div>
        </div>
      </div>

      {/* Right panel — auth forms */}
      <div className="flex w-full lg:w-[45%] items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-navy-wine/90 border border-white/10 p-8 shadow-2xl backdrop-blur-sm">
          {/* Brand heading */}
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-lighter">
            Good&nbsp;
            <span className="text-teal">Views</span>
          </h1>

          {/* ── Login ── */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Username or Email Address
              </label>
              <input
                type="text"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="rounded-md bg-red-900/30 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-1 w-full rounded-lg bg-blue-brand py-2.5 text-sm font-semibold text-white
                         hover:bg-blue-brand/90 active:scale-95 transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Signing in…' : 'Log In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-medium">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* ── Sign Up ── */}
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="input-base"
                placeholder="filmbuff42"
                maxLength={50}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="input-base"
                placeholder="Min. 8 characters"
              />
            </div>

            {regError && (
              <p className="rounded-md bg-red-900/30 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                {regError}
              </p>
            )}

            <button
              type="submit"
              disabled={regLoading}
              className="mt-1 w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                         hover:bg-magenta/90 active:scale-95 transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {regLoading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
