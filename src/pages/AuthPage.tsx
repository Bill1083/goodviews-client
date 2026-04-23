import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-end" style={{ paddingRight: '5vw' }}>

      {/* ── Blue glow accent (left side) ── */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-brand/15 blur-[160px] pointer-events-none" />

      {/* ── Top-left GV logo ── */}
      <div className="absolute top-8 left-8 z-20 hidden lg:block">
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
        className="relative z-10 flex flex-col items-center justify-center w-[349px] rounded-xl px-9 py-[22px]"
        style={{
          height: '90vh',
          background: 'linear-gradient(to bottom, rgba(71,21,48,1) 0%, rgba(41,17,45,1) 50%, rgba(28,19,54,1) 100%)',
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
            <label className={labelClass}>Password</label>
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
            <p className="rounded-md bg-red-900/30 border border-red-500/30 px-2 py-1 text-sm text-red-400">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-[5px] text-[15px] font-normal text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#1c2397', height: 32 }}
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
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className={authInputClass}
              style={authInputStyle}
              placeholder="Min. 8 characters"
            />
          </div>
          {regError && (
            <p className="rounded-md bg-red-900/30 border border-red-500/30 px-2 py-1 text-sm text-red-400">
              {regError}
            </p>
          )}
          <button
            type="submit"
            disabled={regLoading}
            className="w-full rounded-[5px] text-[15px] font-normal text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#a503ab', height: 32 }}
          >
            {regLoading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

      </div>
    </div>
  )
}
