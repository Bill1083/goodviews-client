import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { getTrendingMovies, getTopRatedMovies } from '../services/apiClient'
import type { Movie } from '../types'
import { PASSWORD_MAX_LENGTH, validatePassword } from '../utils/passwordPolicy'

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w185'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = () => setMatches(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

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

    // A couple of slots in the reel show the GoodViews logo instead of a
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

/** Film strip SVG — large (91 × 73), used for the top-left GV logo */
function FilmStripLarge() {
  return (
    <svg width="91" height="73" viewBox="1058 -49 91 73" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ opacity: 0.6 }}>
        <path d="M1069.375,-36.833L1137.625,-36.833C1139.719,-36.833,1141.417,-35.472,1141.417,-33.792L1141.417,-30.75L1065.583,-30.75L1065.583,-33.792C1065.583,-35.472,1067.281,-36.833,1069.375,-36.833Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <g style={{ opacity: 0.3 }}>
        <path d="M1076.958,-42.917L1130.042,-42.917C1132.136,-42.917,1133.833,-41.555,1133.833,-39.875L1133.833,-36.833L1073.167,-36.833L1073.167,-39.875C1073.167,-41.555,1074.864,-42.917,1076.958,-42.917Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <path d="M1061.792,-30.75L1145.208,-30.75C1147.302,-30.75,1149,-29.388,1149,-27.708L1149,17.917C1149,19.597,1147.302,20.958,1145.208,20.958L1061.792,20.958C1059.698,20.958,1058,19.597,1058,17.917L1058,-27.708C1058,-29.388,1059.698,-30.75,1061.792,-30.75ZM1061.792,-24.667L1061.792,-15.542L1073.167,-15.542L1073.167,-24.667L1061.792,-24.667ZM1061.792,-9.458L1061.792,-0.333L1073.167,-0.333L1073.167,-9.458L1061.792,-9.458ZM1061.792,5.75L1061.792,14.875L1073.167,14.875L1073.167,5.75L1061.792,5.75ZM1133.833,-24.667L1133.833,-15.542L1145.208,-15.542L1145.208,-24.667L1133.833,-24.667ZM1133.833,-9.458L1133.833,-0.333L1145.208,-0.333L1145.208,-9.458L1133.833,-9.458ZM1133.833,5.75L1133.833,14.875L1145.208,14.875L1145.208,5.75L1133.833,5.75Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
    </svg>
  )
}

/** Film strip SVG — small, used between "Good" and "Views" in the panel header */
function FilmStripSmall({ width = 44, height = 39 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="1878 -52 62 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ opacity: 0.6 }}>
        <path d="M1885.75,-42.833L1932.25,-42.833C1933.677,-42.833,1934.833,-41.807,1934.833,-40.542L1934.833,-38.25L1883.167,-38.25L1883.167,-40.542C1883.167,-41.807,1884.323,-42.833,1885.75,-42.833Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <g style={{ opacity: 0.3 }}>
        <path d="M1890.917,-47.417L1927.083,-47.417C1928.51,-47.417,1929.667,-46.391,1929.667,-45.125L1929.667,-42.833L1888.333,-42.833L1888.333,-45.125C1888.333,-46.391,1889.49,-47.417,1890.917,-47.417Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <path d="M1880.583,-38.25L1937.417,-38.25C1938.843,-38.25,1940,-37.224,1940,-35.958L1940,-1.583C1940,-0.318,1938.843,0.708,1937.417,0.708L1880.583,0.708C1879.157,0.708,1878,-0.318,1878,-1.583L1878,-35.958C1878,-37.224,1879.157,-38.25,1880.583,-38.25ZM1880.583,-33.667L1880.583,-26.792L1888.333,-26.792L1888.333,-33.667L1880.583,-33.667ZM1880.583,-22.208L1880.583,-15.333L1888.333,-15.333L1888.333,-22.208L1880.583,-22.208ZM1880.583,-10.75L1880.583,-3.875L1888.333,-3.875L1888.333,-10.75L1880.583,-10.75ZM1929.667,-33.667L1929.667,-26.792L1937.417,-26.792L1937.417,-33.667L1929.667,-33.667ZM1929.667,-22.208L1929.667,-15.333L1937.417,-15.333L1937.417,-22.208L1929.667,-22.208ZM1929.667,-10.75L1929.667,-3.875L1937.417,-3.875L1937.417,-10.75L1929.667,-10.75Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
    </svg>
  )
}

const authInputClass =
  'w-full rounded-[5px] border-0 px-[14px] text-[15px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors'

const authInputStyle = { background: 'rgba(177, 178, 181, 0.30)', height: 29 }

const labelClass = 'text-[15px] text-white leading-none'

export default function AuthPage() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 640px)')

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-8 sm:justify-end sm:px-0 sm:py-0 sm:pr-[5vw]">

      {/* ── Ambient popular/classic movie posters ── */}
      {isDesktop ? <AuthPosterField movies={bgMovies} /> : <AuthPosterCarousel movies={bgMovies} />}

      {/* ── Blue glow accent (left side) ── */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-brand/15 blur-[160px] pointer-events-none" />

      {/* ── Top-left GV logo ── */}
      <div className="absolute top-8 left-8 z-20 hidden sm:block">
        <div className="relative" style={{ width: 91, height: 73 }}>
          <FilmStripLarge />
          <span
            className="absolute pointer-events-none select-none"
            style={{ left: 18, top: 17, fontSize: 45, fontFamily: '"Source Sans 3", sans-serif', fontWeight: 400, color: '#200a32', lineHeight: 1 }}
          >G</span>
          <span
            className="absolute pointer-events-none select-none"
            style={{ left: 43, top: 27, fontSize: 45, fontFamily: '"Source Sans 3", sans-serif', fontWeight: 400, color: '#200a32', lineHeight: 1 }}
          >V</span>
        </div>
      </div>

      {/* ── Floating auth panel ── */}
      <div
        className="relative z-10 flex w-full max-w-[349px] flex-col items-center justify-center overflow-y-auto rounded-xl px-6 py-6 sm:px-9 sm:py-[22px]"
        style={{
          maxHeight: '90vh',
          background: 'linear-gradient(to bottom, rgba(9,29,91,0.85) 0%, rgba(0,10,41,0.9) 50%, rgba(32,10,50,0.85) 100%)',
          boxShadow: '4px 4px 20px 0px rgba(0,0,0,0.55)',
        }}
      >

        {/* Brand heading */}
        <div className="mb-[18px] flex items-center justify-center gap-[9px]">
          <span className="font-normal leading-none text-white" style={{ fontSize: 34, fontFamily: '"Source Sans 3", sans-serif' }}>Good</span>
          <FilmStripSmall width={50} height={44} />
          <span className="font-normal leading-none text-white" style={{ fontSize: 34, fontFamily: '"Source Sans 3", sans-serif' }}>Views</span>
        </div>

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
        <form onSubmit={handleRegister} className="w-full flex flex-col gap-[8px]">
          <div className="flex flex-col gap-[5px]">
            <label className={labelClass}>Username</label>
            <input
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
        </form>

      </div>
    </div>
  )
}
