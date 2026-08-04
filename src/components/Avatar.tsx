const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-24 w-24 text-2xl',
  '2xl': 'h-40 w-40 text-4xl',
} as const

const DEFAULT_FOCAL_Y = 22
const DEFAULT_ZOOM = 1

interface Props {
  username: string
  avatarUrl?: string | null
  /** Fill colour for the initials fallback — defaults to a neutral gray card when unset. */
  color?: string | null
  /** Vertical crop position, 0 (top) – 100 (bottom) — user-adjustable in AvatarPicker since
   *  avatars are usually portrait movie-poster art and the subject isn't always centered. */
  focalY?: number | null
  /** Zoom applied on top of the cover-crop, 1.0–2.5 — also user-adjustable in AvatarPicker. */
  zoom?: number | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** A user's picture wherever one appears — a chosen movie-character photo if they've set
 *  one (see AvatarPicker), otherwise their colour with initials. One component so every
 *  surface (profile header, friends list, requests, group members, search results) stays
 *  in sync automatically as avatar support reaches more of them. */
export default function Avatar({ username, avatarUrl, color, focalY, zoom, size = 'md', className = '' }: Props) {
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: color ?? 'rgba(255,255,255,0.08)' }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full object-cover"
          style={{
            objectPosition: `50% ${focalY ?? DEFAULT_FOCAL_Y}%`,
            transform: `scale(${zoom ?? DEFAULT_ZOOM})`,
          }}
        />
      ) : (
        <span className={color ? 'text-navy' : 'text-gray-lighter'}>{initials}</span>
      )}
    </div>
  )
}
