import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Avatar from '../../components/Avatar'
import SkeletonBlock from '../../components/charts/SkeletonBlock'
import { getUserProfile, getUserStats } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import type { FriendProfile } from '../../types'
import { plural } from '../../utils/formatStats'
import GenreDnaSection from './dashboard/GenreDnaSection'
import HeadlineStrip from './dashboard/HeadlineStrip'

const PAGE = 'mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 xl:max-w-[1400px] 2xl:max-w-[1600px]'

function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/profile', { replace: true })
  }
  return (
    <button
      type="button"
      onClick={goBack}
      className="flex items-center gap-2 self-start text-sm text-gray-muted transition-colors hover:text-gray-lighter"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </button>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main className={PAGE}>
      <BackButton />
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-navy-card/40 px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-gray-lighter">{title}</h1>
        <p className="max-w-sm text-sm text-gray-muted">{body}</p>
      </section>
    </main>
  )
}

function FriendsPanel({ friends, username, myId }: { friends: FriendProfile[]; username: string; myId: string | undefined }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-navy-card/60 p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal">
        Friends <span className="ml-1 normal-case tracking-normal text-gray-muted">· {friends.length}</span>
      </h2>
      {friends.length === 0 ? (
        <p className="text-sm text-gray-muted">{username} hasn't added anyone yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {friends.map((f) => {
            const isMe = f.id === myId
            return (
              <li key={f.id}>
                <Link
                  to={isMe ? '/profile' : `/u/${f.id}`}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 transition-colors hover:border-teal/40 hover:bg-teal/5"
                >
                  <Avatar username={f.username} avatarUrl={f.avatar_url} color={f.avatar_color} focalY={f.avatar_focal_y} zoom={f.avatar_zoom} size="xs" />
                  <span className="min-w-0 truncate text-sm text-gray-light">{isMe ? 'You' : f.username}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Someone else's profile: their taste card and, unless they've hidden it,
 * who they're friends with. Entirely read-only — the editor, the settings and
 * the Wrapped all belong to whoever owns the profile. */
export default function PublicProfilePage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const myId = useAuthStore((s) => s.user?.id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile', 'public', userId],
    queryFn: () => getUserProfile(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: false,
  })

  const profile = data?.status === 'ok' ? data.profile : null

  // Your own profile has the editor, the settings and the Wrapped on it.
  useEffect(() => {
    if (profile?.is_self) navigate('/profile', { replace: true })
  }, [profile, navigate])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', 'user', userId],
    queryFn: () => getUserStats(userId),
    enabled: Boolean(profile) && !profile?.is_self,
    staleTime: 2 * 60_000,
  })

  if (isLoading) {
    return (
      <main className={PAGE}>
        <BackButton />
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-20 w-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-56" />
          </div>
        </div>
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-80 rounded-2xl" />
      </main>
    )
  }

  if (isError) return <Notice title="That didn't load" body="Something went wrong fetching this profile. Try again in a moment." />
  if (data?.status === 'not_found') return <Notice title="Profile not found" body="This account doesn't exist, or it has since been deleted." />
  if (data?.status === 'private') {
    return <Notice title="This profile is private" body="They've chosen not to share their profile. If you're friends, they may have limited it further." />
  }
  if (!profile || profile.is_self) return null

  const username = profile.username ?? 'This user'

  return (
    <main className={PAGE}>
      <BackButton />

      <div className="flex items-center gap-3 sm:gap-5">
        <Avatar
          username={username}
          avatarUrl={profile.avatar_url}
          color={profile.avatar_color ?? '#c5c491'}
          focalY={profile.avatar_focal_y}
          zoom={profile.avatar_zoom}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-lighter sm:text-3xl">{username}</h1>
            {profile.is_friend && (
              <span className="rounded-full border border-teal/40 bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">Friends</span>
            )}
          </div>
          {profile.friend_count !== null && (
            <p className="text-sm text-gray-muted">
              {profile.friend_count} {plural(profile.friend_count, 'friend')}
            </p>
          )}
          <p className={`mt-1 text-sm italic ${profile.bio ? 'text-gray-light/60' : 'text-gray-light/40'}`}>
            {profile.bio ?? 'No bio set yet.'}
          </p>
        </div>
      </div>

      {statsLoading && (
        <>
          <SkeletonBlock className="h-24 rounded-2xl" />
          <SkeletonBlock className="h-80 rounded-2xl" />
        </>
      )}

      {stats && stats.headline.films === 0 && (
        <section className="rounded-2xl border border-dashed border-white/15 bg-navy-card/40 px-6 py-10 text-center text-sm text-gray-muted">
          {username} hasn't rated any films yet.
        </section>
      )}

      {stats && stats.headline.films > 0 && (
        <>
          <HeadlineStrip stats={stats} />
          <GenreDnaSection stats={stats} index={1} subject={username} />
        </>
      )}

      {profile.friends !== null && <FriendsPanel friends={profile.friends} username={username} myId={myId} />}
    </main>
  )
}
