import { useState, type ReactNode } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  fallback: ReactNode
}

/** TMDB's image CDN occasionally resets the connection mid-load
 * (ERR_CONNECTION_CLOSED) — browsers don't retry a failed <img> on their
 * own, so a poster/photo just stays permanently blank. Retries once with a
 * cache-busted src (usually clears a transient reset), then falls back to
 * the given placeholder rather than leaving a broken image. */
export default function RetryImage({ src, alt, className, loading = 'lazy', fallback }: Props) {
  const [failCount, setFailCount] = useState(0)
  if (failCount >= 2) return <>{fallback}</>
  return (
    <img
      key={failCount}
      src={failCount === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${failCount}`}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailCount((n) => n + 1)}
    />
  )
}
