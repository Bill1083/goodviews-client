import RetryImage from '../../../components/RetryImage'
import { tmdbImage } from '../../../utils/tmdbImage'

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-base' } as const

interface Props {
  path: string | null
  name: string
  size?: keyof typeof SIZES
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Round profile photo with an initials fallback, for directors / actors. */
export default function PersonThumb({ path, name, size = 'sm' }: Props) {
  const src = tmdbImage(path, 'w185')
  const fallback = (
    <span className="flex h-full w-full items-center justify-center bg-navy-blue font-semibold text-gray-light">{initials(name)}</span>
  )
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full bg-navy-card ${SIZES[size]}`}>
      {src ? <RetryImage src={src} alt={name} className="h-full w-full object-cover" fallback={fallback} /> : fallback}
    </span>
  )
}
