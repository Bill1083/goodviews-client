import { themeFor } from './streamingServiceThemes'
import type { StreamingProvider } from '../../types'

const TMDB_LOGO = 'https://image.tmdb.org/t/p/w185'

/** One square entry tile into a streaming service's own "world" — sized to
 * sit comfortably beside the movie-poster carousels above it (see
 * DiscoverPage's "Streaming Worlds" section) without towering over them. */
export default function StreamingWorldTile({
  provider,
  onClick,
}: {
  provider: StreamingProvider
  onClick: () => void
}) {
  const theme = themeFor(provider.provider_name)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Browse ${provider.provider_name}`}
      className="group relative aspect-square w-28 shrink-0 overflow-hidden rounded-card border border-white/10 shadow-lg transition-transform hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:w-32"
      style={{ background: `radial-gradient(circle at 30% 25%, ${theme.color} 0%, ${theme.shade} 78%)` }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow sm:h-12 sm:w-12">
          {provider.logo_path ? (
            <img
              src={`${TMDB_LOGO}${provider.logo_path}`}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-lg font-bold text-navy">{provider.provider_name[0]}</span>
          )}
        </div>
        <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white drop-shadow sm:text-xs">
          {provider.provider_name}
        </span>
      </div>
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
    </button>
  )
}
