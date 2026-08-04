const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-24 w-24 text-2xl',
} as const

interface Props {
  username: string
  avatarUrl?: string | null
  /** Fill colour for the initials fallback — defaults to a neutral gray card when unset. */
  color?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** A user's picture wherever one appears — a chosen movie-character photo if they've set
 *  one (see AvatarPicker), otherwise their colour with initials. One component so every
 *  surface (profile header, friends list, requests, group members, search results) stays
 *  in sync automatically as avatar support reaches more of them. */
export default function Avatar({ username, avatarUrl, color, size = 'md', className = '' }: Props) {
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: color ?? 'rgba(255,255,255,0.08)' }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
      ) : (
        <span className={color ? 'text-navy' : 'text-gray-lighter'}>{initials}</span>
      )}
    </div>
  )
}
