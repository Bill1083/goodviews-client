import Avatar from '../../../components/Avatar'
import RetryImage from '../../../components/RetryImage'
import type { FriendCompat, WrappedSlide } from '../../../types/stats'
import { formatMinutesLong, formatPercent, plural, regionName } from '../../../utils/formatStats'
import { tmdbImage } from '../../../utils/tmdbImage'
import SlideShell, { Body, Eyebrow, Headline, useStagger } from '../SlideShell'

type Watchlist = Extract<WrappedSlide, { kind: 'watchlist' }>
type Friends = Extract<WrappedSlide, { kind: 'friends' }>
type World = Extract<WrappedSlide, { kind: 'world' }>

export function WatchlistSlide({ slide }: { slide: Watchlist }) {
  const stagger = useStagger()
  const oldest = slide.oldest
  const src = tmdbImage(oldest?.movie.poster_path, 'w342')
  return (
    <SlideShell backdropPath={oldest?.movie.backdrop_path}>
      <Eyebrow index={0}>The backlog</Eyebrow>
      <Headline index={1}>
        {slide.total} {plural(slide.total, 'film')} still waiting
      </Headline>
      <Body index={2}>
        You added {slide.added_this_year} this year alone
        {slide.total_minutes > 0 && ` — about ${formatMinutesLong(slide.total_minutes)} of viewing`}.
        {oldest && oldest.days_waiting > 30 && ` ${oldest.movie.title} has been sitting there for ${oldest.days_waiting} days. It's not going to watch itself.`}
      </Body>
      {oldest && src && (
        <div {...stagger(3)} className={`mt-2 flex items-center gap-4 ${stagger(3).className}`}>
          <span className="block w-20 overflow-hidden rounded-lg shadow-2xl">
            <RetryImage src={src} alt={oldest.movie.title} className="aspect-[2/3] w-full object-cover" fallback={<span className="block aspect-[2/3] w-full bg-black/40" />} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Longest wait</p>
            <p className="text-lg font-semibold text-white">{oldest.movie.title}</p>
            <p className="text-sm text-white/70">{oldest.days_waiting} {plural(oldest.days_waiting, 'day')} and counting</p>
          </div>
        </div>
      )}
    </SlideShell>
  )
}

function FriendCard({ friend, role, index }: { friend: FriendCompat; role: string; index: number }) {
  const stagger = useStagger()
  const s = stagger(index)
  return (
    <div className={`flex items-center gap-4 ${s.className}`} style={s.style}>
      <Avatar username={friend.username ?? '?'} avatarUrl={friend.avatar_url} color={friend.avatar_color} focalY={friend.avatar_focal_y} zoom={friend.avatar_zoom} size="lg" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{role}</p>
        <p className="truncate text-2xl font-bold text-white">{friend.username}</p>
        <p className="text-sm text-white/80">
          {Math.round(friend.compatibility * 100)}% match · {friend.shared_count} {plural(friend.shared_count, 'film')} in common
        </p>
      </div>
    </div>
  )
}

export function FriendsSlide({ slide }: { slide: Friends }) {
  const d = slide.most_disagreed
  const rival = slide.nemesis ?? slide.twin
  return (
    <SlideShell>
      <Eyebrow index={0}>Taste twins</Eyebrow>
      <Headline index={1}>
        {slide.twin.username} gets you
      </Headline>
      <div className="mt-2 flex flex-col gap-5">
        <FriendCard friend={slide.twin} role="Closest match" index={2} />
        {slide.nemesis && <FriendCard friend={slide.nemesis} role="Friendly rival" index={3} />}
      </div>
      {d && (
        <Body index={4}>
          Biggest split: {d.movie.title} — you gave it {d.your_rating}★, {rival.username} gave it {d.their_rating}★. Someone owes someone a rewatch.
        </Body>
      )}
    </SlideShell>
  )
}

export function WorldSlide({ slide }: { slide: World }) {
  const stagger = useStagger()
  return (
    <SlideShell>
      <Eyebrow index={0}>Passport stamps</Eyebrow>
      <Headline index={1}>
        {slide.countries} {plural(slide.countries, 'country', 'countries')}, {slide.languages} {plural(slide.languages, 'language')}
      </Headline>
      <Body index={2}>
        {slide.non_english_share > 0
          ? `${formatPercent(slide.non_english_share)} of your films weren't in English. Subtitles are a lifestyle.`
          : 'All in English this year — the rest of the world is waiting.'}
      </Body>
      <ul className="mt-2 flex flex-wrap gap-2">
        {slide.top_countries.map((c, i) => (
          <li key={c.code} {...stagger(3 + i)} className={`rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-white ${stagger(3 + i).className}`}>
            {regionName(c.code)} <span className="text-white/60">· {c.count}</span>
          </li>
        ))}
      </ul>
    </SlideShell>
  )
}
