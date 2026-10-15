import { useEffect, useState } from 'react'
import { filmUrl } from '../utils/filmUrl'

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
    </svg>
  )
}

/** Shares a film's public page: the system share sheet where there is one
 *  (phones), otherwise copies the link. */
export default function ShareFilmButton({
  movie,
  variant = 'pill',
  className = '',
}: {
  movie: { id: number; title: string }
  variant?: 'pill' | 'icon'
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const share = async () => {
    const url = filmUrl(movie)
    const canShare = typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
    if (canShare) {
      try {
        await navigator.share({ title: movie.title, url })
        return
      } catch (err) {
        // Dismissing the share sheet isn't an error worth falling back from.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const label = copied ? 'Link copied' : 'Share'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={share}
        aria-label={copied ? 'Link copied' : `Share ${movie.title}`}
        title={label}
        className={`flex h-8 items-center justify-center gap-1.5 rounded-full bg-black/50 px-2.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white ${className}`}
      >
        <ShareIcon className="h-4 w-4" />
        {copied && <span>Copied</span>}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-2 rounded-pill border border-white/20 px-5 py-2.5 text-sm font-semibold text-gray-lighter transition-colors hover:bg-white/5 ${className}`}
    >
      <ShareIcon className="h-4 w-4" />
      {label}
    </button>
  )
}
