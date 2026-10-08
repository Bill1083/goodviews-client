import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { themeFor } from './streamingServiceThemes'
import type { StreamingProvider } from '../../types'

const TMDB_LOGO = 'https://image.tmdb.org/t/p/w185'
const DURATION_MS = 1400
const REDUCED_DURATION_MS = 200

/** A themed, brand-coloured "entering a service's world" transition — an
 * original expanding-portal + logo-pop effect, deliberately not a copy of
 * any one streaming service's actual trademarked intro sequence. Tapping
 * anywhere (or `prefers-reduced-motion`) skips straight to onDone. */
export default function ServiceEntranceAnimation({
  provider,
  onDone,
}: {
  provider: StreamingProvider
  onDone: () => void
}) {
  const theme = themeFor(provider.provider_name)
  const reducedMotion = usePrefersReducedMotion()
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    const timer = setTimeout(finish, reducedMotion ? REDUCED_DURATION_MS : DURATION_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      type="button"
      onClick={finish}
      aria-label={`Entering ${provider.provider_name} — tap to skip`}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden"
      style={{ background: theme.shade }}
    >
      <div
        className="service-portal absolute rounded-full"
        style={{ background: `radial-gradient(circle, ${theme.color} 0%, ${theme.color} 45%, transparent 75%)` }}
      />
      <div className="service-portal-logo relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-28 sm:w-28">
        {provider.logo_path ? (
          <img src={`${TMDB_LOGO}${provider.logo_path}`} alt={provider.provider_name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-navy">{provider.provider_name[0]}</span>
        )}
      </div>
      <span className="service-portal-label absolute bottom-[16%] text-sm font-medium tracking-wide text-white/80">
        Tap to skip
      </span>
    </button>
  )
}
