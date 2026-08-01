import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getMyFriends, getMyFriendGroups, recommendMovie } from '../services/apiClient'
import type { Movie } from '../types'

interface Props {
  movie: Movie
  onSent?: () => void
  onCancel: () => void
}

/** Inline "send this movie to friends" picker — used inside MovieDetailModal wherever recommending is available. */
export default function SendToFriendsPanel({ movie, onSent, onCancel }: Props) {
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [groupIds, setGroupIds] = useState<string[]>([])

  const { data: friends = [] } = useQuery({ queryKey: ['friends'], queryFn: getMyFriends, staleTime: 1000 * 60 * 5 })
  const { data: groups = [] } = useQuery({ queryKey: ['friend-groups'], queryFn: getMyFriendGroups, staleTime: 1000 * 60 * 5 })

  const mutation = useMutation({
    mutationFn: () =>
      recommendMovie({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        release_date: movie.release_date ?? null,
        friend_ids: friendIds,
        group_ids: groupIds,
      }),
    onSuccess: () => onSent?.(),
  })

  const toggleFriend = (id: string) =>
    setFriendIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleGroup = (id: string) =>
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-teal/30 bg-navy/50 p-3.5">
      <p className="text-xs font-semibold text-teal-light uppercase tracking-wide">Send to Friends</p>

      {friends.length === 0 && groups.length === 0 ? (
        <p className="text-xs text-gray-muted italic">Add some friends first to send recommendations.</p>
      ) : (
        <>
          {friends.length > 0 && (
            <div>
              <p className="text-xs text-gray-muted mb-1.5">Friends</p>
              <div className="flex flex-wrap gap-1.5">
                {friends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={[
                      'w-fit rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                      friendIds.includes(f.id)
                        ? 'border-teal bg-teal/20 text-teal-light'
                        : 'border-white/20 text-gray-muted hover:border-white/40',
                    ].join(' ')}
                  >
                    {f.username}
                  </button>
                ))}
              </div>
            </div>
          )}
          {groups.length > 0 && (
            <div>
              <p className="text-xs text-gray-muted mb-1.5">Groups</p>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={[
                      'w-fit rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                      groupIds.includes(g.id)
                        ? 'border-magenta bg-magenta/20 text-white'
                        : 'border-white/20 text-gray-muted hover:border-white/40',
                    ].join(' ')}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={(friendIds.length === 0 && groupIds.length === 0) || mutation.isPending}
              className="flex-1 rounded-lg bg-teal/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Sending…' : 'Send'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-muted hover:text-gray-lighter transition-colors"
            >
              Cancel
            </button>
          </div>
          {mutation.isSuccess && <p className="text-xs text-teal-light">Sent!</p>}
        </>
      )}
    </div>
  )
}
