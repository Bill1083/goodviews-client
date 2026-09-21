import type { ReactNode } from 'react'
import RetryImage from '../../../components/RetryImage'
import { tmdbImage } from '../../../utils/tmdbImage'

const SIZES = { xs: 'w-10', sm: 'w-14', md: 'w-20', lg: 'w-24' } as const

interface Props {
  path: string | null
  title: string
  size?: keyof typeof SIZES
  className?: string
  onClick?: () => void
  /** Bottom-right overlay (rating chip, ×N badge). */
  badge?: ReactNode
}

function Fallback({ title }: { title: string }) {
  return (
    <span className="flex h-full w-full items-center justify-center bg-navy-card px-1 text-center text-[10px] leading-tight text-gray-muted">
      {title}
    </span>
  )
}

export default function PosterThumb({ path, title, size = 'sm', className = '', onClick, badge }: Props) {
  const src = tmdbImage(path, size === 'lg' || size === 'md' ? 'w185' : 'w154')
  const image = (
    <span className={`relative block aspect-[2/3] ${SIZES[size]} shrink-0 overflow-hidden rounded-md bg-navy-card ${className}`}>
      {src ? (
        <RetryImage src={src} alt={title} className="h-full w-full object-cover" fallback={<Fallback title={title} />} />
      ) : (
        <Fallback title={title} />
      )}
      {badge && <span className="absolute bottom-1 right-1">{badge}</span>}
    </span>
  )
  if (!onClick) return image
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="shrink-0 rounded-md transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
    >
      {image}
    </button>
  )
}

export function RatingBadge({ rating, rewatches = 0 }: { rating: number; rewatches?: number }) {
  return (
    <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white backdrop-blur-sm">
      ★{Number.isInteger(rating) ? rating : rating.toFixed(1)}
      {rewatches > 0 && <span className="text-teal"> ×{rewatches + 1}</span>}
    </span>
  )
}
