import { useEffect } from 'react'
import type { WatchProvider } from '../types'

const TMDB_PROVIDER_LOGO = 'https://image.tmdb.org/t/p/w92'

interface Props {
  movieTitle: string
  providers: WatchProvider[]
  justWatchLink?: string
  onClose: () => void
}

/** Lists the AU subscription services a movie is streaming on. Opened by tapping the small
 *  icon row in MovieDetailModal — kept as its own modal (rather than an inline expansion)
 *  so it can stack over the movie modal the same way PersonModal/ReviewModal already do. */
export default function WatchProvidersModal({ movieTitle, providers, justWatchLink, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="panel-card dialog-scale-in flex w-full max-w-sm flex-col gap-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-lighter">Streaming in Australia</h2>
            <p className="truncate text-xs text-gray-muted">{movieTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-xl leading-none text-gray-muted hover:text-gray-lighter"
          >
            ×
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {providers.map((provider) => (
            <li key={provider.provider_id} className="flex items-center gap-3">
              <img
                src={`${TMDB_PROVIDER_LOGO}${provider.logo_path}`}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
              />
              <span className="text-sm font-medium text-gray-lighter">{provider.provider_name}</span>
            </li>
          ))}
        </ul>

        {justWatchLink && (
          <a
            href={justWatchLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-[11px] text-gray-muted transition-colors hover:text-gray-lighter"
          >
            Availability data powered by JustWatch
          </a>
        )}
      </div>
    </div>
  )
}
