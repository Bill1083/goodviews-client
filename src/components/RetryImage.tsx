import { useState, type ReactNode } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  draggable?: boolean
  fallback: ReactNode
  onLoad?: () => void
  /** Fires once retries are exhausted and the fallback is about to render —
   * lets a caller with its own "still loading" skeleton (keyed off onLoad)
   * dismiss it instead of showing that skeleton forever when the image
   * never succeeds. */
  onFail?: () => void
}

/** TMDB's image CDN occasionally resets the connection mid-load
 * (ERR_CONNECTION_CLOSED) — browsers don't retry a failed <img> on their
 * own, so a poster/photo just stays permanently blank. Retries once with a
 * cache-busted src (usually clears a transient reset), then falls back to
 * the given placeholder rather than leaving a broken image. */
export default function RetryImage({ src, alt, className, loading = 'lazy', draggable, fallback, onLoad, onFail }: Props) {
  const [failCount, setFailCount] = useState(0)
  if (failCount >= 2) return <>{fallback}</>
  return (
    <img
      key={failCount}
      src={failCount === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${failCount}`}
      alt={alt}
      className={className}
      loading={loading}
      draggable={draggable}
      onLoad={onLoad}
      onError={() =>
        setFailCount((n) => {
          const next = n + 1
          if (next >= 2) onFail?.()
          return next
        })
      }
    />
  )
}
