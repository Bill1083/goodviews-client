import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getWrappedAvailability } from '../../../services/apiClient'
import { useAuthStore } from '../../../store/authStore'
import type { WrappedHistoryYear } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import { isWrappedSeen } from '../../../utils/wrappedSeen'

function ReelIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="6.5" r="1.4" />
      <circle cx="12" cy="17.5" r="1.4" />
      <circle cx="6.5" cy="12" r="1.4" />
      <circle cx="17.5" cy="12" r="1.4" />
    </svg>
  )
}

/** Re-reads the local "seen" flags when the tab regains focus or a Wrapped
 * marks itself watched, so the "it's here" treatment calms down afterwards. */
function useSeenTick(): void {
  const [, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener('wrapped-seen', bump)
    window.addEventListener('focus', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('wrapped-seen', bump)
      window.removeEventListener('focus', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
}

/** The Wrapped's home on the profile.
 *
 * The current year only appears once the server says it has unlocked — through
 * December and not a day earlier, so there is no countdown, no "sealed until",
 * nothing at all to hint at what's being tallied. Once the year turns over it
 * drops back into the history, which is available all year round. */
export default function WrappedHubCard() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon'
  useSeenTick()
  const { data } = useQuery({
    queryKey: ['stats', 'wrapped', 'availability'],
    queryFn: getWrappedAvailability,
    staleTime: 10 * 60_000,
  })

  if (!data) return null
  const { current, history } = data
  if (!current && history.length === 0) return null

  const play = (year: number) => navigate(`/wrapped/${year}`)
  const unseen = current?.status === 'ready' && !isWrappedSeen(userId, current.year)

  // ── Nothing current: the archive stands on its own ────────────────────────
  if (!current) {
    return (
      <section className="rounded-2xl border border-white/10 bg-navy-card/60 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-teal">
          <ReelIcon size={18} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Wrapped history</h2>
        </div>
        <p className="mt-1 text-sm text-gray-muted">Your past years in film. This year's arrives in December.</p>
        <HistoryGrid years={history} onPlay={play} />
      </section>
    )
  }

  // ── It's December ─────────────────────────────────────────────────────────
  if (current.status === 'not_enough') {
    const missing = Math.max(0, current.min_films - current.films)
    return (
      <section className="rounded-2xl border border-white/10 bg-navy-card/60 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/10 bg-navy text-gray-light">
            <ReelIcon />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">{current.year} Wrapped</p>
            <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">
              Rate {missing} more {plural(missing, 'film')} before the year is out
            </h2>
            <p className="mt-0.5 text-sm text-gray-muted">
              {current.films} logged so far. {current.min_films} is all it takes.
            </p>
          </div>
        </div>
        {history.length > 0 && <HistoryGrid years={history} onPlay={play} compact />}
      </section>
    )
  }

  if (unseen) {
    return (
      <section className="glow-pulse relative overflow-hidden rounded-2xl border border-white/10 bg-navy-card/70 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-magenta/25 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal/25 blur-[70px]" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">It's here</p>
            <h2 className="text-gradient-brand mt-1 text-2xl font-bold sm:text-3xl">Your {current.year} Wrapped is ready</h2>
            <p className="mt-1 text-sm text-gray-light">
              {current.films} {plural(current.films, 'film')}, one story. Best with the sound of your own gasps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => play(current.year)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            <ReelIcon />
            Play it
          </button>
        </div>
        {history.length > 0 && <HistoryGrid years={history} onPlay={play} compact />}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-navy-card/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/10 bg-navy text-gray-light">
            <ReelIcon />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">{current.year} Wrapped</p>
            <h2 className="mt-1 text-lg font-bold text-gray-lighter sm:text-xl">Your {current.year} story, whenever you want it</h2>
            <p className="mt-0.5 text-sm text-gray-muted">It keeps counting until New Year's Eve.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => play(current.year)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-magenta/40 bg-magenta/10 px-5 py-2.5 text-sm font-semibold text-magenta transition-colors hover:bg-magenta/20"
        >
          <ReelIcon />
          Replay {current.year}
        </button>
      </div>
      {history.length > 0 && <HistoryGrid years={history} onPlay={play} compact />}
    </section>
  )
}

function HistoryGrid({ years, onPlay, compact = false }: { years: WrappedHistoryYear[]; onPlay: (year: number) => void; compact?: boolean }) {
  return (
    <div className={compact ? 'relative mt-4 border-t border-white/10 pt-3' : 'mt-4'}>
      {compact && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-muted">Earlier years</p>}
      <ul
        data-no-swipe="true"
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {years.map((y) => (
          <li key={y.year}>
            <button
              type="button"
              onClick={() => onPlay(y.year)}
              className="flex min-w-[104px] flex-col items-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-teal/50 hover:bg-teal/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
            >
              <span className="text-xl font-bold leading-none text-gray-lighter">{y.year}</span>
              <span className="mt-1 text-[11px] text-gray-muted">
                {y.films} {plural(y.films, 'film')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
