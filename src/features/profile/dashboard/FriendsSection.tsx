import Avatar from '../../../components/Avatar'
import HorizontalBars from '../../../components/charts/HorizontalBars'
import { SENTIMENT } from '../../../components/charts/chartTheme'
import type { DashboardStats, FriendCompat, MovieRef } from '../../../types/stats'
import { plural } from '../../../utils/formatStats'
import DashboardCard from './DashboardCard'
import PosterThumb from './PosterThumb'

interface Props {
  stats: DashboardStats
  index: number
  className?: string
  onMovie: (movie: MovieRef) => void
}

function Callout({ heading, friend, tone }: { heading: string; friend: FriendCompat; tone: 'positive' | 'negative' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
      <Avatar username={friend.username ?? '?'} avatarUrl={friend.avatar_url} color={friend.avatar_color} focalY={friend.avatar_focal_y} zoom={friend.avatar_zoom} size="sm" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-muted">{heading}</p>
        <p className="truncate text-sm text-gray-lighter">
          <span className="font-semibold">{friend.username}</span>{' '}
          <span style={{ color: SENTIMENT[tone] }}>{Math.round(friend.compatibility * 100)}% match</span>
          <span className="text-gray-muted"> · {friend.shared_count} shared</span>
        </p>
      </div>
    </div>
  )
}

export default function FriendsSection({ stats, index, className, onMovie }: Props) {
  const f = stats.friends
  if (f.friend_count === 0) return null
  const disagreement = f.nemesis?.most_disagreed ?? f.twin?.most_disagreed ?? null
  const disagreeWith = f.nemesis?.most_disagreed ? f.nemesis : f.twin

  return (
    <DashboardCard
      title="Taste twins"
      subtitle={f.compared.length > 0 ? `${f.compared.length} of ${f.friend_count} ${plural(f.friend_count, 'friend')} share enough films to compare` : undefined}
      index={index}
      className={className}
      footnote={f.compared.length > 0 ? 'Match = how close your stars land on the films you have both rated.' : undefined}
    >
      {f.compared.length === 0 ? (
        <p className="text-sm text-gray-muted">Rate three films in common with a friend and your compatibility shows up here.</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {f.twin && <Callout heading="Taste twin" friend={f.twin} tone="positive" />}
            {f.nemesis && <Callout heading="Friendly rival" friend={f.nemesis} tone="negative" />}
          </div>
          {disagreement && disagreeWith && (
            <div className="flex items-center gap-3">
              <PosterThumb path={disagreement.movie.poster_path} title={disagreement.movie.title} size="xs" onClick={() => onMovie(disagreement.movie)} />
              <p className="min-w-0 text-sm leading-snug text-gray-light">
                Biggest split: <span className="font-semibold text-gray-lighter">{disagreement.movie.title}</span> — you ★{disagreement.your_rating}, {disagreeWith.username} ★{disagreement.their_rating}.
              </p>
            </div>
          )}
          <HorizontalBars
            max={100}
            rows={f.compared.map((c) => ({
              key: c.id,
              label: c.username ?? 'Friend',
              value: Math.round(c.compatibility * 100),
              valueLabel: `${Math.round(c.compatibility * 100)}%`,
              sub: `${c.shared_count} ${plural(c.shared_count, 'film')} in common`,
              thumb: <Avatar username={c.username ?? '?'} avatarUrl={c.avatar_url} color={c.avatar_color} focalY={c.avatar_focal_y} zoom={c.avatar_zoom} size="xs" />,
            }))}
            dense
          />
        </>
      )}
    </DashboardCard>
  )
}
