import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { getTrendingMovies, getTopRatedMovies } from '../services/apiClient'
import type { Movie } from '../types'
import { PASSWORD_MAX_LENGTH, validatePassword } from '../utils/passwordPolicy'
import { useAuthStore } from '../store/authStore'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { BrandMonogram, BrandWordmark, FilmStripSmall } from '../components/brand/BrandLogo'
import { BRAND } from '../config/brand'
import { PUBLIC_PAGES } from '../config/seo'
import { usePageMeta } from '../hooks/usePageMeta'

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w185'

/** Desktop: posters fade in from random spawn points and drift further outward,
 *  one at a time — some "currently popular" (trending) titles mixed with
 *  "classics" (top-rated), purely ambient/aria-hidden. */
function AuthPosterField({ movies }: { movies: Movie[] }) {
  const posters = useMemo(
    () =>
      movies.map((movie, i) => {
        // Most posters spawn near screen-centre (with some jitter); only a
        // few spawn out at a random spot anywhere on screen. Each poster's
        // drift direction is biased away from screen-centre (toward
        // whichever edge it's already closest to) with some jitter, and
        // travels far enough that it actually reads as heading for the edge.
        const spawnsFromCentre = Math.random() < 0.75
        const ox = spawnsFromCentre ? 50 + (Math.random() - 0.5) * 36 : 3 + Math.random() * 94
        const oy = spawnsFromCentre ? 50 + (Math.random() - 0.5) * 36 : 4 + Math.random() * 92
        const outwardAngle = Math.atan2(oy - 50, ox - 50)
        const angle = outwardAngle + (Math.random() - 0.5) * (Math.PI / 2) // ±45° jitter
        const radius = 30 + Math.random() * 34 // vmin travelled from the spawn point
        // The very first poster fades in noticeably faster than the rest — the
        // page needs *something* on screen quickly, before login is even possible.
        const duration = i === 0 ? 7 + Math.random() * 2 : 18 + Math.random() * 10
        return {
          key: `${movie.id}-${i}`,
          posterPath: movie.poster_path,
          ox,
          oy,
          tx: Math.cos(angle) * radius,
          ty: Math.sin(angle) * radius,
          rot: -10 + Math.random() * 20,
          size: 76 + Math.random() * 44,
          duration,
        }
      }),
    [movies]
  )

  // Bring posters in one at a time rather than spawning the whole field at once —
  // each newly-mounted poster starts its own animation fresh from tiny/invisible,
  // which also hides the async poster image load behind the fade-in.
  const maxVisible = Math.min(posters.length, 9)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (maxVisible === 0) return
    setVisibleCount(1)
    const interval = setInterval(() => {
      setVisibleCount((count) => {
        if (count >= maxVisible) {
          clearInterval(interval)
          return count
        }
        return count + 1
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [maxVisible])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {posters.slice(0, visibleCount).map(({ key, posterPath, ox, oy, tx, ty, rot, size, duration }) => (
        <div
          key={key}
          className="auth-poster"
          style={
            {
              left: `${ox}%`,
              top: `${oy}%`,
              '--tx': `${tx}vmin`,
              '--ty': `${ty}vmin`,
              '--duration': `${duration}s`,
              width: size,
            } as React.CSSProperties
          }
        >
          <img
            src={`${TMDB_POSTER}${posterPath}`}
            alt=""
            className="w-full rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: `rotate(${rot}deg)` }}
          />
        </div>
      ))}
    </div>
  )
}

// Matches the auth card's own responsive width (w-full, capped at 349px,
// inside the root's px-4 gutter) so the posters line up with the login section.
// Uses vw rather than % because the scrolling track is a shrink-to-fit
// absolutely-positioned box — a %-width child would create a circular
// sizing dependency against it.
const CAROUSEL_FRAME_CLASS = 'w-[calc(100vw-32px)] max-w-[349px]'

/** Phone: a single vertical carousel of uniform-size posters in random order,
 *  scrolling slowly top-to-bottom behind the (semi-transparent) auth card —
 *  framed like an old film strip, with sprocket-hole rails. */
type CarouselEntry =
  | { type: 'movie'; key: string; posterPath: string | null }
  | { type: 'logo'; key: string }

function AuthPosterCarousel({ movies }: { movies: Movie[] }) {
  const entries = useMemo<CarouselEntry[]>(() => {
    const ordered = movies
      .map((movie) => ({ movie, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ movie }) => movie)

    if (ordered.length === 0) return []

    // A couple of slots in the reel show the logo instead of a
    // poster, like a blank/leader frame spliced into a real film strip.
    const logoCount = Math.min(2 + Math.floor(Math.random() * 2), ordered.length)
    const logoIndices = new Set<number>()
    while (logoIndices.size < logoCount) {
      logoIndices.add(Math.floor(Math.random() * ordered.length))
    }

    return ordered.map((movie, i) =>
      logoIndices.has(i)
        ? { type: 'logo', key: `logo-${movie.id}-${i}` }
        : { type: 'movie', key: `${movie.id}-${i}`, posterPath: movie.poster_path }
    )
  }, [movies])

  if (entries.length === 0) return null

  const duration = Math.max(50, entries.length * 10)

  return (
    <div
      className="auth-carousel-fade pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="auth-poster-carousel-track flex flex-col items-center gap-5"
        style={{ '--carousel-duration': `${duration}s` } as React.CSSProperties}
      >
        {[...entries, ...entries].map((entry, i) => (
          <div key={`${entry.key}-${i}`} className={`film-reel-frame ${CAROUSEL_FRAME_CLASS}`}>
            {entry.type === 'movie' ? (
              <img
                src={`${TMDB_POSTER}${entry.posterPath}`}
                alt=""
                className="film-poster w-full aspect-[2/3] rounded-md object-cover"
              />
            ) : (
              <div className="film-poster auth-logo-card flex w-full items-center justify-center rounded-md py-2">
                <FilmStripSmall width={48} height={42} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const authInputClass =
  'w-full rounded-[5px] border-0 px-[14px] text-[15px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors'

const authInputStyle = { background: 'rgba(177, 178, 181, 0.30)', height: 29 }

const labelClass = 'text-[15px] text-white leading-none'

export default function AuthPage() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const { user } = useAuthStore()

  // This page is never allowed to scroll (see useBodyScrollLock below), so if
  // a session appears while it's mounted — e.g. a confirmation-email link
  // landed here after supabase-js silently picked up the tokens from the URL
  // hash — the user would otherwise be stuck staring at an unchanged login
  // form with no indication they're actually signed in. Bounce them on.
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  // Fixed, non-scrolling screen (matches the app's other auth-adjacent
  // screens) — the floating panel below scrolls internally if its own
  // content ever exceeds the available height instead.
  useBodyScrollLock(true)

  // Background poster field: mix of "currently popular" and "classic" movies
  const { data: trending } = useQuery({
    queryKey: ['auth-bg', 'trending'],
    queryFn: ({ signal }) => getTrendingMovies(1, signal),
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const { data: topRated } = useQuery({
    queryKey: ['auth-bg', 'top-rated'],
    queryFn: ({ signal }) => getTopRatedMovies(1, signal),
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const bgMovies = useMemo(() => {
    const popular = (trending?.results ?? []).filter((m) => m.poster_path)
    const classics = (topRated?.results ?? []).filter((m) => m.poster_path)
    return [...popular.slice(0, 8), ...classics.slice(0, 8)]
      .map((movie) => ({ movie, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ movie }) => movie)
  }, [trending, topRated])

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
  const [regConfirmationSent, setRegConfirmationSent] = useState(false)

  usePageMeta(PUBLIC_PAGES['/auth'])

  // Arriving from a "Create account" link: bring the sign-up form into view.
  const [searchParams] = useSearchParams()
  const registerUsernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (searchParams.get('mode') !== 'register') return
    const input = registerUsernameRef.current
    input?.scrollIntoView({ block: 'center' })
    input?.focus({ preventScroll: true })
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      let email = loginEmail.trim()

      // If input has no @, treat it as a username and resolve to email first
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
          setLoginError('No account found with that username.')
          setLoginLoading(false)
          return
        }
        const data = await res.json()
        email = data.email
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      })
      if (error) {
        setLoginError(error.message)
      } else {
        // Whether this account needs the MFA challenge (and whether this
        // device is already trusted) is decided by ProtectedRoute, driven by
        // the single refreshAal check App.tsx's onAuthStateChange listener
        // already kicks off for every sign-in — always navigate home and let
        // it redirect to /mfa-challenge if needed. Deciding it a second time
        // here would race that same check (two concurrent trusted-device
        // verifies, last one to resolve wins) rather than reuse its result.
        navigate('/')
      }
    } finally {
      setLoginLoading(false)
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
    const passwordError = validatePassword(regPassword)
    if (passwordError) {
      setRegError(passwordError)
      return
    }
    setRegLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        data: { username: trimmed },
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    })
    setRegLoading(false)
    if (error) {
      setRegError(error.message)
    } else if (data.session) {
      // Email confirmation is off (or this address was already confirmed) —
      // signUp returned an active session directly, so there's nothing to
      // wait on.
      navigate('/')
    } else {
      // The account was created but needs email confirmation before a
      // session exists — navigating to '/' here would just bounce straight
      // back to this page via ProtectedRoute with no explanation. Tell the
      // user to check their inbox instead; clicking the emailed link lands
      // back on this page and the effect above will pick up the new session.
      setRegConfirmationSent(true)
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden flex items-center justify-center px-4 py-8 sm:justify-end sm:px-0 sm:py-0 sm:pr-[5vw]">

      {/* ── Ambient popular/classic movie posters ── */}
      {isDesktop ? <AuthPosterField movies={bgMovies} /> : <AuthPosterCarousel movies={bgMovies} />}

      {/* ── Blue glow accent (left side) ── */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-brand/15 blur-[160px] pointer-events-none" />

      {/* ── Top-left logo ── */}
      <Link to="/" aria-label={`${BRAND.name} home`} className="absolute top-8 left-8 z-20 hidden sm:block">
        <BrandMonogram />
      </Link>

      {/* ── Floating auth panel ── */}
      <div
        className="relative z-10 flex w-full max-w-[349px] flex-col items-center justify-center overflow-y-auto rounded-xl px-6 py-6 sm:px-9 sm:py-[22px]"
        style={{
          maxHeight: '100%',
          background: 'linear-gradient(to bottom, rgba(9,29,91,0.85) 0%, rgba(0,10,41,0.9) 50%, rgba(32,10,50,0.85) 100%)',
          boxShadow: '4px 4px 20px 0px rgba(0,0,0,0.55)',
        }}
      >

        {/* Brand heading */}
        <BrandWordmark className="mb-[18px]" />

        {/* ── Login form ── */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-[8px]">
          <div className="flex flex-col gap-[5px]">
            <label className={labelClass}>Username or Email Address</label>
            <input
              type="text"
              autoComplete="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={authInputClass}
              style={authInputStyle}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Password</label>
              <Link to="/forgot-password" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={authInputClass}
              style={authInputStyle}
            />
          </div>
          {loginError && (
            <p className="rounded-md bg-pink-brand/10 border border-pink-brand/30 px-2 py-1 text-sm text-pink-brand">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-[5px] text-[15px] font-normal text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-blue-brand hover:brightness-110"
            style={{ height: 32 }}
          >
            {loginLoading ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        {/* ── OR divider ── */}
        <div className="my-[14px] flex items-center justify-center">
          <span className="text-[15px] text-white" style={{ fontFamily: '"Source Sans 3", sans-serif' }}>OR</span>
        </div>

        {/* ── Sign Up form ── */}
        {regConfirmationSent ? (
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <p className="text-[15px] font-medium text-white">Check your email</p>
            <p className="text-[13px] text-white/60 leading-relaxed">
              We sent a confirmation link to <span className="text-white/90">{regEmail.trim()}</span>.
              Open it to finish creating your account — this page will pick it up automatically.
            </p>
            <button
              type="button"
              onClick={() => setRegConfirmationSent(false)}
              className="mt-1 text-[13px] text-white/50 hover:text-white/80 transition-colors"
            >
              Used the wrong email? Go back
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-[8px]">
            <div className="flex flex-col gap-[5px]">
              <label className={labelClass}>Username</label>
              <input
                ref={registerUsernameRef}
                type="text"
                autoComplete="username"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className={authInputClass}
                style={authInputStyle}
                placeholder="filmbuff42"
                maxLength={50}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={authInputClass}
                style={authInputStyle}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                maxLength={PASSWORD_MAX_LENGTH}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={authInputClass}
                style={authInputStyle}
                placeholder="Min. 10 chars, 1 number, 1 symbol"
              />
            </div>
            {regError && (
              <p className="rounded-md bg-pink-brand/10 border border-pink-brand/30 px-2 py-1 text-sm text-pink-brand">
                {regError}
              </p>
            )}
            <button
              type="submit"
              disabled={regLoading}
              className="w-full rounded-[5px] text-[15px] font-normal text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-magenta-dark hover:brightness-110"
              style={{ height: 32 }}
            >
              {regLoading ? 'Creating account…' : 'Sign Up'}
            </button>
            <p className="text-center text-[12px] leading-snug text-white/50">
              By signing up you agree to the{' '}
              <Link to="/terms" className="underline decoration-white/30 underline-offset-2 hover:text-white/80">Terms of Use</Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline decoration-white/30 underline-offset-2 hover:text-white/80">Privacy Policy</Link>.
            </p>
          </form>
        )}

      </div>

      <nav
        aria-label="Site"
        className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-4 whitespace-nowrap text-[13px] text-white/40 sm:bottom-6 sm:left-8 sm:translate-x-0"
      >
        <Link to="/about" className="transition-colors hover:text-white/70">About &amp; TMDB attribution</Link>
        <Link to="/privacy" className="transition-colors hover:text-white/70">Privacy</Link>
        <Link to="/terms" className="transition-colors hover:text-white/70">Terms</Link>
      </nav>
    </div>
  )
}
