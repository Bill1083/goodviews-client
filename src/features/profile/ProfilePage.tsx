import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyReviews, deleteReview } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import MovieCard from '../../components/MovieCard'
import StarRating from '../../components/StarRating'
import PrimaryButton from '../../components/PrimaryButton'
import type { Review } from '../../types'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', 'me', page],
    queryFn: () => getMyReviews(page),
    staleTime: 1000 * 60,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      setDeletingId(null)
    },
  })

  const username =
    (user?.user_metadata?.['username'] as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User'

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple text-2xl font-bold text-gray-light">
          {username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-light">{username}</h1>
          <p className="text-sm text-gray-muted">{user?.email}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-light">
        My Reviews
      </h2>

      {isLoading && (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="text-pink-brand text-sm">Failed to load reviews.</p>
      )}

      {data?.reviews.length === 0 && (
        <p className="text-gray-muted text-sm">
          No reviews yet.{' '}
          <a href="/search" className="text-teal hover:text-teal-light underline">
            Find a movie
          </a>{' '}
          to log your first one!
        </p>
      )}

      <div className="flex flex-col gap-4">
        {data?.reviews.map((review: Review) => (
          <article
            key={review.id}
            className="flex items-start gap-4 rounded-card border border-purple/20 bg-navy p-4"
          >
            {review.movies && (
              <div className="flex-shrink-0 w-20">
                <MovieCard movie={{ ...review.movies, id: review.movie_id }} />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-light">
                    {review.movies?.title ?? `Movie #${review.movie_id}`}
                  </h3>
                  <StarRating value={review.rating} readOnly size="sm" />
                </div>
                <PrimaryButton
                  variant="danger"
                  onClick={() => setDeletingId(review.id)}
                  className="text-xs px-3 py-1.5 flex-shrink-0"
                >
                  Delete
                </PrimaryButton>
              </div>

              {review.review_text && (
                <p className="text-sm text-gray-muted leading-relaxed line-clamp-4">
                  {review.review_text}
                </p>
              )}

              <p className="text-xs text-gray-muted/60">
                {new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {data && data.reviews.length === data.page_size && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm text-teal disabled:text-gray-muted"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-muted">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.reviews.length < data.page_size}
            className="text-sm text-teal disabled:text-gray-muted"
          >
            Next →
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/70 px-4">
          <div className="w-full max-w-sm rounded-card border border-purple/30 bg-navy p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-light">
              Delete Review?
            </h3>
            <p className="mb-5 text-sm text-gray-muted">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <PrimaryButton
                variant="secondary"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingId)}
              >
                Delete
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
